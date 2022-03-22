const { Message } = require('../models/message')
const { EntityMemento } = require('../models/entity-memento')
const messageRepo = require('../repos/message-repo')
const mementoRepo = require('../repos/entity-memento-repo')
const { HttpException } = require('../../libs/exception')

async function editMessage(uuid, values) {
  const { author , message, likes } = values
  const entity = Message.create(author, message, likes, uuid)
  const result = await messageRepo.update(entity)
  if (!result.affectedRows) {
    throw new HttpException(404, 'MESSAGE_NOT_FOUND', `Message with uuid#${uuid} not found.`)
  }

  const memento = EntityMemento.createUpdateChange(uuid, { author, message, likes })
  mementoRepo.save(memento)
}

module.exports = editMessage
