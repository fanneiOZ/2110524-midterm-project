const db = require('../../libs/db')
const { CHANGE_TYPE } = require('../models/entity-memento')

class EntityMementoRepo {
  constructor(dbDriver) {
    this.dbDriver = dbDriver
  }

  async getDeleteChange(limit = 15000, deleteCursor = undefined) {
    const conditions = Object.assign({ change_type: CHANGE_TYPE.DELETE }, deleteCursor ? { id: deleteCursor } : {})
    return await this.dbDriver.select(
      conditions,
      [ 'id', 'entity_id' ],
      { id: 'ASC' },
      limit,
    )
  }

  async getUpdateChange(updateCursor = undefined, limit = 1000) {
    const conditions = Object.assign({ change_type: CHANGE_TYPE.UPDATE }, updateCursor ? { id: updateCursor } : {})
    return await this.dbDriver.select(
      conditions,
      [ 'id', 'entity_id', 'state' ],
      { id: 'ASC' },
      limit,
    )
  }

  /**
   *
   * @param {EntityMemento} memento
   * @return {Promise<*>}
   */
  async save(memento) {
    return await this.dbDriver.insert(memento.dbState)
  }
}

module.exports = new EntityMementoRepo(db.resolveDriver('entity_memento', [ 'id' ]))
