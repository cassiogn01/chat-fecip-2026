/**
 * Gerenciador de Banco de Dados SQLite
 * Utiliza o módulo nativo DatabaseSync do Node.js (SQLite 3 nativo embutido)
 * Proporciona chamadas síncronas, rápidas e seguras sem necessitar de build tools C++.
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'usuarios.db');
const db = new DatabaseSync(dbPath);

// Inicialização do Schema do Banco
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nick TEXT UNIQUE NOT NULL COLLATE NOCASE,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    senha TEXT NOT NULL,
    idioma_padrao TEXT NOT NULL DEFAULT 'pt-BR',
    amigos TEXT NOT NULL DEFAULT '[]',
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reset_tokens (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expira_em INTEGER NOT NULL
  );
`);

// Helpers preparados para consultas seguras (Prevenção de SQL Injection)
const dbQueries = {
  // Usuários
  criarUsuario: db.prepare(`
    INSERT INTO usuarios (id, nick, email, senha, idioma_padrao, amigos)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  buscarPorNick: db.prepare(`
    SELECT id, nick, email, senha, idioma_padrao, amigos, criado_em
    FROM usuarios WHERE nick = ?
  `),
  buscarPorEmail: db.prepare(`
    SELECT id, nick, email, senha, idioma_padrao, amigos, criado_em
    FROM usuarios WHERE email = ?
  `),
  buscarPorId: db.prepare(`
    SELECT id, nick, email, senha, idioma_padrao, amigos, criado_em
    FROM usuarios WHERE id = ?
  `),
  pesquisarPorNickParcial: db.prepare(`
    SELECT id, nick, idioma_padrao
    FROM usuarios WHERE nick LIKE ? LIMIT 10
  `),
  atualizarSenha: db.prepare(`
    UPDATE usuarios SET senha = ? WHERE email = ?
  `),
  atualizarAmigos: db.prepare(`
    UPDATE usuarios SET amigos = ? WHERE id = ?
  `),
  atualizarIdioma: db.prepare(`
    UPDATE usuarios SET idioma_padrao = ? WHERE id = ?
  `),

  // Reset de Senha
  salvarResetToken: db.prepare(`
    INSERT INTO reset_tokens (id, email, token, expira_em)
    VALUES (?, ?, ?, ?)
  `),
  buscarResetToken: db.prepare(`
    SELECT * FROM reset_tokens WHERE token = ?
  `),
  deletarResetToken: db.prepare(`
    DELETE FROM reset_tokens WHERE token = ?
  `),
  limparTokensExpirados: db.prepare(`
    DELETE FROM reset_tokens WHERE expira_em < ?
  `)
};

module.exports = {
  db,
  ...dbQueries
};
