const useCase = require('../../cores/usecases/edit-message')
const { HttpException } = require('../../libs/exception')

async function editMessage(req, res, next) {
  try {
    await useCase(
      req.params['uuid'],
      { author: req.body['author'], message: req.body['message'], likes: req.body['likes'] },
    )
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

module.exports = editMessage
