const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../models/database')

const registrar = (req, res) => {
    const { username, senha } = req.body

    if (!username || !senha) {
        return res.status(400).json({ erro: 'Username e senha são obrigatórios' })
    }

    const senhaHash = bcrypt.hashSync(senha, 10)

    try {
        const stmt = db.prepare('INSERT INTO usuarios (username, senha) VALUES (?, ?)')
        stmt.run(username, senhaHash)
        res.status(201).json({ mensagem: `Usuário ${username} criado com sucesso` })
    } catch (erro) {
        res.status(409).json({ erro: 'Username já existe' })
    }
}

const login = (req, res) => {
    const { username, senha } = req.body

    const usuario = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username)

    if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
        return res.status(401).json({ erro: 'Credenciais inválidas' })
    }

    const token = jwt.sign(
        { id: usuario.id, username: usuario.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    )

    res.json({ token })
}

module.exports = { registrar, login }