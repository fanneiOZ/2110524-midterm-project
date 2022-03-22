const logger = require('./libs/logger')
const express = require('express')
const router = require('./app/routes')
const fallbackRoute = require('./app/controllers/fallback')
const app = express()

const listeningPort = process.env['HTTP_PORT'] || 3000

app.use(express.json())
app.use('/api', router)
app.all('/*', fallbackRoute)

app.listen(listeningPort, () => {
  logger.info(`Service started. Listening via ${listeningPort}`, {k: 1})
})
