const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid')
const db = require('../models/database')

const ALGORITMO = 'aes-256-cbc'
const CHAVE = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32)

const criptografar = (texto) => {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITMO, CHAVE, iv)
    const criptografado = Buffer.concat([cipher.update(texto), cipher.final()])
    return {
        iv: iv.toString('hex'),
        conteudo: criptografado.toString('hex')
    }
}

const descriptografar = (conteudoHex, ivHex) => {
    const iv = Buffer.from(ivHex, 'hex')
    const conteudo = Buffer.from(conteudoHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITMO, CHAVE, iv)
    const descriptografado = Buffer.concat([decipher.update(conteudo), decipher.final()])
    return descriptografado.toString()
}

const criarMensagem = (req, res) => {
    const { conteudo } = req.body

    if (!conteudo) {
        return res.status(400).json({ erro: 'Conteúdo é obrigatório' })
    }

    const { iv, conteudo: criptografado } = criptografar(conteudo)
    const id = uuidv4()

    const stmt = db.prepare(`
        INSERT INTO mensagens (id, conteudo_criptografado, iv, criado_por)
        VALUES (?, ?, ?, ?)
    `)
    stmt.run(id, criptografado, iv, req.usuario.id)

    res.status(201).json({
        mensagem: 'Dead drop criado com sucesso',
        id,
        aviso: 'Esta mensagem será destruída após a primeira leitura'
    })
}

const lerMensagem = (req, res) => {
    const { id } = req.params

    const mensagem = db.prepare('SELECT * FROM mensagens WHERE id = ?').get(id)

    if (!mensagem) {
        return res.status(404).json({ erro: 'Mensagem não encontrada ou já foi destruída' })
    }

    if (mensagem.lida) {
        return res.status(410).json({ erro: 'Esta mensagem já foi lida e destruída' })
    }

    const conteudo = descriptografar(mensagem.conteudo_criptografado, mensagem.iv)

    db.prepare('UPDATE mensagens SET lida = 1 WHERE id = ?').run(id)

    res.json({
        conteudo,
        criado_em: mensagem.criado_em,
        aviso: 'Esta mensagem foi destruída e não poderá ser lida novamente'
    })
}

const minhasMensagens = (req, res) => {
    const mensagens = db.prepare(`
        SELECT id, criado_em, lida FROM mensagens WHERE criado_por = ?
    `).all(req.usuario.id)

    res.json(mensagens)
}

module.exports = { criarMensagem, lerMensagem, minhasMensagens }