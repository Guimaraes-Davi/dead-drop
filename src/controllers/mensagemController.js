const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid')
const db = require('../models/database')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/')
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, uuidv4() + ext)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const permitidos = /jpeg|jpg|png|gif|pdf|txt/
        const ext = permitidos.test(path.extname(file.originalname).toLowerCase())
        if (ext) cb(null, true)
        else cb(new Error('Tipo de arquivo não permitido'))
    }
})

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
    const conteudo = req.body.conteudo || ''
    const arquivo = req.file || null

    if (!conteudo && !arquivo) {
        return res.status(400).json({ erro: 'Mensagem ou arquivo é obrigatório' })
    }

    const textoParaCriptografar = conteudo || ' '
    const { iv, conteudo: criptografado } = criptografar(textoParaCriptografar)
    const id = uuidv4()
    const codigo = gerarCodigoCurto()

    const stmt = db.prepare(`
        INSERT INTO mensagens (id, codigo, conteudo_criptografado, iv, arquivo, arquivo_nome, criado_por)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const criado_por = req.usuario ? req.usuario.id : null
    const arquivoPath = arquivo ? arquivo.filename : null
    const arquivoNome = arquivo ? arquivo.originalname : null

    stmt.run(id, codigo, criptografado, iv, arquivoPath, arquivoNome, criado_por)

    res.status(201).json({
        mensagem: 'Dead drop criado com sucesso',
        codigo,
        aviso: 'Esta mensagem será destruída após a primeira leitura'
    })
}

const lerMensagem = (req, res) => {
    const { id } = req.params

    const mensagem = db.prepare('SELECT * FROM mensagens WHERE codigo = ?').get(id)

    if (!mensagem) {
        return res.status(404).json({ erro: 'Mensagem não encontrada ou já foi destruída' })
    }

    if (mensagem.lida) {
        return res.status(410).json({ erro: 'Esta mensagem já foi lida e destruída' })
    }

    const conteudo = descriptografar(mensagem.conteudo_criptografado, mensagem.iv)

    db.prepare('UPDATE mensagens SET lida = 1 WHERE codigo = ?').run(id)

    const resposta = {
        conteudo: conteudo.trim(),
        criado_em: mensagem.criado_em,
        aviso: 'Esta mensagem foi destruída e não poderá ser lida novamente'
    }

    if (mensagem.arquivo) {
        resposta.arquivo = mensagem.arquivo
        resposta.arquivo_nome = mensagem.arquivo_nome

        setTimeout(() => {
            const filePath = path.join(__dirname, '../../public/uploads/', mensagem.arquivo)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }, 60000)
    }

    res.json(resposta)
}

const minhasMensagens = (req, res) => {
    const mensagens = db.prepare(`
        SELECT id, criado_em, lida FROM mensagens WHERE criado_por = ?
    `).all(req.usuario.id)

    res.json(mensagens)
}

const gerarCodigoCurto = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let codigo = ''
    for (let i = 0; i < 8; i++) {
        if (i === 4) codigo += '-'
        codigo += chars[Math.floor(Math.random() * chars.length)]
    }
    return codigo
}

module.exports = { criarMensagem, lerMensagem, minhasMensagens, upload }