# Dead Drop

Serviço de mensagens criptografadas com autodestruição após leitura.

## Como funciona

1. Escreva uma mensagem secreta
2. Receba um código único
3. Compartilhe o código com quem deve ler
4. A mensagem é destruída após a primeira leitura

## Segurança

- Criptografia AES-256-CBC no conteúdo
- Senhas protegidas com bcrypt
- Autenticação via JWT
- Mensagens inacessíveis após leitura (HTTP 410)

## Tecnologias

- Node.js
- Express
- SQLite (better-sqlite3)
- JWT, bcryptjs, crypto

## Rotas da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | /auth/registrar | Não | Criar conta |
| POST | /auth/login | Não | Login |
| POST | /mensagem | Opcional | Criar dead drop |
| GET | /mensagem/:codigo | Não | Ler mensagem |
| GET | /mensagem/minhas | Sim | Histórico |

## Autor

Davi Guimarães