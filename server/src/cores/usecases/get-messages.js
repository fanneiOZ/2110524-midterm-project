const messageRepo = require('../repos/message-repo')
const mementoRepo = require('../repos/entity-memento-repo')
const avro = require('avro-js')

const avroParser = avro.parse({
  name: 'message',
  type: 'record',
  fields: [
    { name: 'uuid', type: 'string', logicalType: 'uuid' },
    { name: 'author', type: 'string' },
    { name: 'message', type: 'string' },
    { name: 'likes', type: 'long' },
  ],
})

async function getMessages(limit, createCursor, deleteCursor, updateCursor) {
  const [ createChange, deleteChange, updateChange ] = await Promise.all([
    messageRepo.get(limit, createCursor)
      .then(result => ({ result, nextCreateCursor: result.at(-1)?.timestampKey }))
      .catch(e => {
        throw e
      }),
    mementoRepo.getDeleteChange(limit, deleteCursor)
      .then(result => ({ result: result.map(row => row.entity_id), nextDeleteCursor: result.at(-1)?.id }))
      .catch(e => {
        throw e
      }),
    mementoRepo.getUpdateChange(updateCursor)
      .then(result => ({ result, nextUpdateCursor: result.at(-1)?.id }))
      .catch(e => {
        throw e
      }),
  ])

  return {
    createdData: createChange.result.map(row => avroParser.toBuffer(row).toString('binary')),
    nextCreateCursor: createChange.nextCreateCursor,
    deletedData: deleteChange.result.join(','),
    nextDeleteCursor: deleteChange.nextDeleteCursor,
    updatedData: updateChange.result
      .map(({ entity_id, state, }) => avroParser.toBuffer({ uuid: entity_id, ...state }).toString('binary')),
    nextUpdateCursor: updateChange.nextUpdateCursor,
  }
}

module.exports = getMessages
