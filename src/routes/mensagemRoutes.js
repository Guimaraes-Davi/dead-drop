const express = require('express')
const router = express.Router()
const autenticar = require('../middlewares/auth')
const { criarMensagem, lerMensagem, minhasMensagens } = require('../controllers/mensagemController')

router.post('/', autenticar, criarMensagem)
router.get('/minhas', autenticar, minhasMensagens)
router.get('/:id', lerMensagem)

module.exports = router