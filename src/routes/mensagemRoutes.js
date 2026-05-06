const express = require('express')
const router = express.Router()
const autenticar = require('../middlewares/auth')
const { criarMensagem, lerMensagem, minhasMensagens } = require('../controllers/mensagemController')

const autenticarOpcional = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token) {
        const jwt = require('jsonwebtoken')
        try {
            req.usuario = jwt.verify(token, process.env.JWT_SECRET)
        } catch (e) {}
    }
    next()
}

router.post('/', autenticarOpcional, criarMensagem)
router.get('/minhas', autenticar, minhasMensagens)
router.get('/:id', lerMensagem)

module.exports = router