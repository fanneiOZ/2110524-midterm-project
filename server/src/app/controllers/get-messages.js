const useCase = require('../../cores/usecases/get-messages')
const { HttpException } = require('../../libs/exception')

async function getMessages(req, res, next) {
  try {
    const {
      limit,
      create_cursor: createCursor = undefined,
      update_cursor: updateCursor = undefined,
      delete_cursor: deleteCursor = undefined,
    } = req.query
    const result = await useCase(limit, createCursor, deleteCursor, updateCursor)
    res.status(200)
      .set({
        'x-create-cursor': result.nextCreateCursor ?? null,
        'x-delete-cursor': result.nextDeleteCursor ?? null,
        'x-update-cursor': result.nextUpdateCursor ?? null,
      })
      .json({
        c: result.createdData,
        u: result.updatedData,
        d: result.deletedData,
      })
  } catch (e) {
    if (e instanceof HttpException) {
      res.status(e.statusCode).json(e.errorResponseBody)
    } else {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: e.message })
    }
  }
  next()
}

module.exports = getMessages
