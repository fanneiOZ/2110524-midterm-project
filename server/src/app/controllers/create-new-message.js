const useCase = require('../../cores/usecases/create-new-message')
const { HttpException } = require('../../libs/exception')

/**
 *
 * @param req
 * @param res
 * @param next
 */
async function createNewMessage(req, res, next) {
  try {
    await useCase({ ...req.body })
    res.status(201).json(req.body)
  } catch (e) {
    if (e instanceof HttpException) {
      res.status(e.statusCode).json(e.errorResponseBody)
    } else {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: e.message })
    }
  }
  next()
}

module.exports = createNewMessage
