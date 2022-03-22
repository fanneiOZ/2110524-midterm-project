const useCase = require('../../cores/usecases/delete-message-by-id')
const { HttpException } = require('../../libs/exception')

async function deleteMessageById(req, res, next) {
  try {
    await useCase(req.params['uuid'])
    res.status(204).send()
  } catch (e) {
    if (e instanceof HttpException) {
      res.status(e.statusCode).json(e.errorResponseBody)
    } else {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: e.message })
    }
  }
  next()
}

module.exports = deleteMessageById
