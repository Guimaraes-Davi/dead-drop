const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, '../../database.db'))

db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mensagens (
        id TEXT PRIMARY KEY,
        conteudo_criptografado TEXT NOT NULL,
        iv TEXT NOT NULL,
        criado_por INTEGER NOT NULL,
        lida INTEGER DEFAULT 0,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (criado_por) REFERENCES usuarios(id)
    );
`)

module.exports = db