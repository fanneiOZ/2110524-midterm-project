const { Client } = require('pg')


class PostgresDriver {
  /**
   * @param client
   * @param {string} tableName
   * @param {string[]} pkNames
   */
  constructor(client, tableName, pkNames) {
    this.client = client
    this.client.connect()
    this.tableName = tableName
    this.pkNames = pkNames
    this.keyCondition = buildKeyExpression(pkNames)
  }

  async select(conditions, fields, sorting, limit) {
    const values = []
    const conditionExpressions = []
    const orderingExpressions = Object.entries(sorting).map(([ k, v ]) => (`${k} ${v.toUpperCase()}`)).join(', ')
    Object.entries(conditions).forEach(([ k, v ], i) => {
      conditionExpressions.push(`${k} ${k === 'timestamp_key' || k === 'id' ? '>' : '='} $${i + 1}`)
      values.push(v)
    })

    const statement = `SELECT ${fields.join(', ')}
                       FROM ${this.tableName}
                       WHERE ${conditionExpressions.join(' AND ')}
                       ORDER BY ${orderingExpressions} LIMIT ${limit}`
    const result = await this.client.query(statement, values)

    return result.rows
  }

  async updateByPk(key, valueObj, additionalConditions = undefined) {
    let conditionExpression = this.keyCondition
    const values = [ key ]
    const updateExpressions = []
    Object.entries(valueObj).forEach(([ k, v ], i) => {
      updateExpressions.push(`${k} = $${i + 2}`)
      values.push(v)
    })
    if (additionalConditions) {
      conditionExpression += ' AND '
        + Object.entries(additionalConditions)
          .map(([ k, v ], i) => {
            values.push(v)
            return `${k} = $${i + values.length}`
          })
          .join(' AND ')
    }
    const statement = `UPDATE ${this.tableName}
                       SET ${updateExpressions.join(', ')}
                       WHERE ${conditionExpression}`
    const result = await this.client.query(statement, values)

    return { affectedRows: result.rowCount }
  }

  async insert(valueObj) {
    const paramKeys = []
    const fields = []
    const values = []
    Object.entries(valueObj).forEach(([ k, v ], i) => {
      paramKeys.push(`$${i + 1}`)
      fields.push(k)
      values.push(v)
    })
    const statement = `INSERT INTO ${this.tableName}(${fields.join(',')})
                       VALUES (${paramKeys.join(',')})`
    const result = await this.client.query(statement, values)

    return { affectedRows: result.rowCount }
  }

  async deleteByPk(key) {
    const statement = `DELETE
                       FROM ${this.tableName}
                       WHERE ${this.keyCondition}`
    const result = await this.client.query(statement, [ key ])

    return { affectedRows: result.rowCount }
  }

  async close() {
    await this.client.end()
  }
}

function setupClient() {
  const connectionSettings = {
    PGHOST: 'localhost',
    PGUSER: 'broadcast_admin',
    PGDATABASE: 'broadcast',
    PGPASSWORD: 'broadcast-admin',
    PGPORT: 15432,
  }
  const env = process.env

  process.env = Object.assign({}, env, connectionSettings)

  return new Client()
}

/**
 * Driver container by each particular table name
 *
 * @type {Map<string, PostgresDriver>}
 */
const driverContainer = new Map()

/**
 * @param {string} tableName
 * @param {string[]} pkNames
 * @returns {PostgresDriver}
 */
function resolveDriver(tableName, pkNames) {
  if (!driverContainer.has(tableName)) {
    driverContainer.set(tableName, new PostgresDriver(setupClient(), tableName, pkNames))
  }

  return driverContainer.get(tableName)
}


/**
 * Builder method to create WHERE condition on primary key fields in form of KEY = $n
 *
 * @param {string[]} pkNames
 * @return {string}
 */
function buildKeyExpression(pkNames) {
  return pkNames.map((keyName, i) => (`${keyName} = $${i + 1}`)).join(' AND ')
}

module.exports = { resolveDriver }
