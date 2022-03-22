const winston = require('winston')
const path = require('path')

module.exports = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.metadata(),
    winston.format.timestamp(),
    winston.format.splat(),
    winston.format.printf(
      info => `[${info.timestamp}] - ` +
        `${info.level}: ${info.message}` +
        `${info.metadata ? ' - ' + JSON.stringify(info.metadata) : ''}`,
    ),
  ),
  transports: [
    new winston.transports.File({ dirname: path.join(process.cwd(), 'data/log'), filename: 'app.log' }),
  ],
})
