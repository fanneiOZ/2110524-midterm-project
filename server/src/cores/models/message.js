const { v4 } = require('uuid')
const cuid = require('cuid')

class Message {
  static create(author, message, likes, uuid = undefined) {
    return new Message({
      uuid: uuid ?? v4(),
      author,
      message,
      likes,
      timestampKey: cuid(),
      active: true,
    })
  }

  constructor({ uuid, author, message, likes, timestampKey, active }) {
    this.uuid = uuid
    this.author = author
    this.message = message
    this.likes = likes
    this.timestampKey = timestampKey
    this.active = active
  }

  get dbState() {
    return Object.freeze({
      uuid: this.uuid,
      author: this.author,
      message: this.message,
      likes: this.likes,
      timestamp_key: this.timestampKey,
      active: this.active,
    })
  }
}

module.exports = { Message }
