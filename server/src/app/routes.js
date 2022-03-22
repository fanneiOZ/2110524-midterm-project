const { Router } = require('express')
const createNewMessage = require('./controllers/create-new-message')
const deleteMessageById = require('./controllers/delete-message-by-id')
const editMessage = require('./controllers/edit-message')
const logger = require('../libs/logger')
const getMessages = require('./controllers/get-messages')
const router = Router()

router.use((req, res, next) => {
  req.body['start_time'] = Date.now()
  next()
})

router.post('/messages', createNewMessage)
router.delete('/messages/:uuid', deleteMessageById)
router.put('/messages/:uuid', editMessage)
router.get('/messages', getMessages)

router.use((req, res, next) => {
  logger.info(`${res.statusCode} ${req.method} ${req.url}`, { duration_ms: Date.now() - req.body['start_time'] })
})

module.exports = router
