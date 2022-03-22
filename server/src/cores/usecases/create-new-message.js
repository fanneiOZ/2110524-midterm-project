const { Message } = require('../models/message')
const messageRepo = require('../repos/message-repo')
const { HttpException } = require('../../libs/exception')

/**
 *
 * @param {string} uuid
 * @param {string} message
 * @param {string} author
 * @param {number} likes
 */
async function createNewMessage({ uuid = undefined, message, author, likes }) {
  const entity = Message.create(author, message, likes, uuid)
  const result = await messageRepo.insert(entity)
  if (!result.affectedRows) {
    throw new HttpException(409, 'DUPLICATED_REFERENCE', `Message with uuid#${uuid} is already created.`)
  }
}

module.exports = createNewMessage
