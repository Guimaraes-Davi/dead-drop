const express = require('express')
const router = express.Router()
const autenticar = require('../middlewares/auth')
const { criarMensagem, lerMensagem, minhasMensagens, upload } = require('../controllers/mensagemController')
const fs = require('fs')
const path = require('path')

router.get('/arquivo/:filename', (req, res) => {
    const { filename } = req.params
    const db = require('../models/database')
    
    const mensagem = db.prepare('SELECT * FROM mensagens WHERE arquivo = ?').get(filename)
    
    if (!mensagem) {
        return res.status(404).json({ erro: 'Arquivo não encontrado' })
    }

    if (mensagem.lida === 0) {
        return res.status(403).json({ erro: 'Leia a mensagem primeiro' })
    }

    const filePath = path.join(__dirname, '../../public/uploads/', filename)
    
    if (!fs.existsSync(filePath)) {
        return res.status(410).json({ erro: 'Arquivo já destruído' })
    }

    res.sendFile(filePath)
})

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

router.post('/', autenticarOpcional, upload.single('arquivo'), criarMensagem)
router.get('/minhas', autenticar, minhasMensagens)
router.get('/:id', lerMensagem)

module.exports = router