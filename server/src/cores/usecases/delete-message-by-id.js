const { EntityMemento } = require('../models/entity-memento')
const messageRepo = require('../repos/message-repo')
const mementoRepo = require('../repos/entity-memento-repo')
const { HttpException } = require('../../libs/exception')

async function deleteMessageById(uuid) {
  const result = await messageRepo.delete(uuid)
  if (!result.affectedRows) {
    throw new HttpException(404, 'MESSAGE_NOT_FOUND', `Message with uuid#${uuid} not found.`)
  }

  const memento = EntityMemento.createDeleteChange(uuid)
  mementoRepo.save(memento)
}

module.exports = deleteMessageById
