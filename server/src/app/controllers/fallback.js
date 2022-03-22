const { HttpException } = require('../../libs/exception')

function fallbackRoute(req, res, next) {
  const e = new HttpException(500, 'INTERFACE_NOT_EXISTED', `Requested resource not supported`)
  res.status(e.statusCode).send(e.errorResponseBody)
}

module.exports = fallbackRoute
