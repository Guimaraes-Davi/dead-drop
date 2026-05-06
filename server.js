const express = require('express')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
app.use(express.json())

const authRoutes = require('./src/routes/authRoutes')
const mensagemRoutes = require('./src/routes/mensagemRoutes')

app.use('/auth', authRoutes)
app.use('/mensagem', mensagemRoutes)

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
    res.json({ mensagem: 'Dead Drop API no ar' })
})

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
})