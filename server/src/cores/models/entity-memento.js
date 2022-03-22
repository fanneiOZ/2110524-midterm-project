const cuid = require('cuid')

const CHANGE_TYPE = Object.freeze({
  UPDATE: 'U',
  DELETE: 'D',
})

class EntityMemento {
  /**
   * Instance factory method
   *
   * @param entityId
   * @param state
   * @return {EntityMemento}
   */
  static createUpdateChange(entityId, state) {
    return new EntityMemento(cuid(), entityId, CHANGE_TYPE.UPDATE, state)
  }

  static createDeleteChange(entityId) {
    return new EntityMemento(cuid(), entityId, CHANGE_TYPE.DELETE, undefined)
  }

  /**
   * @param {string} id
   * @param {string} entityId
   * @param {string} changeType
   * @param {Object | undefined} state
   */
  constructor(id, entityId, changeType, state) {
    this.id = id
    this.entityId = entityId
    this.changeType = changeType
    this.state = state
  }

  /**
   *
   * @return {Readonly<Object>}
   */
  get dbState() {
    return Object.freeze(
      Object.assign(
        { id: this.id, entity_id: this.entityId, change_type: this.changeType },
        this.state ? { state: this.state } : {},
      ),
    )
  }
}

module.exports = { EntityMemento, CHANGE_TYPE }
