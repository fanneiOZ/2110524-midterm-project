const db = require('../../libs/db')
const { Message } = require('../models/message')


class MessageRepo {
  constructor(dbDriver) {
    this.dbDriver = dbDriver
  }

  async get(limit = 12000, createCursor = undefined) {
    const conditions = Object.assign({ active: true }, createCursor ? { timestamp_key: createCursor } : {})
    const result = await this.dbDriver.select(
      conditions,
      [ 'uuid', 'author', 'message', 'likes', 'timestamp_key' ],
      { timestamp_key: 'ASC' },
      limit,
    )

    return result.map(row => new Message({
      uuid: row['uuid'],
      author: row['author'],
      message: row['message'],
      likes: parseInt(row['likes'], 10),
      timestampKey: row['timestamp_key'],
    }))
  }

  /**
   *
   * @param {string} uuid
   */
  async delete(uuid) {
    return await this.dbDriver.updateByPk(uuid, { active: false }, { active: true })
  }

  /**
   *
   * @param {Message} message
   */
  async insert(message) {
    try {
      return await this.dbDriver.insert(message.dbState)
    } catch (e) {
      if (e.code && e.code === '23505' && e.routine && e.routine === '_bt_check_unique') {
        return { affectedRow: 0 }
      }

      throw e
    }
  }

  /**
   *
   * @param {Message} message
   */
  async update(message) {
    const updatingValues = { ...message.dbState }
    delete updatingValues['uuid']
    delete updatingValues['active']
    delete updatingValues['timestamp_key']

    return await this.dbDriver.updateByPk(message.uuid, updatingValues, { active: true })
  }
}

module.exports = new MessageRepo(db.resolveDriver('data_enhanced', [ 'uuid' ]))
