/**
 * Rotas do Sistema de Amigos (Favoritos / Atalhos)
 * Cenário C: Apenas usuários registrados têm acesso. Convidado temporário não tem permissão.
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware de autenticação obrigatória
function exigirAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    // Cenário C: Não consegue acessar
    return res.status(403).json({
      erro: 'Apenas usuários registrados podem gerenciar lista de amigos.'
    });
  }
  next();
}

/**
 * GET /api/amigos/buscar?nick=@nickB
 */
router.get('/buscar', exigirAuth, (req, res) => {
  try {
    let { nick } = req.query;
    if (!nick) return res.json({ usuarios: [] });

    const cleanNick = nick.trim().replace(/^@/, '');
    if (cleanNick.length < 2) return res.json({ usuarios: [] });

    // Pesquisa segura usando prepared statement
    const resultados = db.pesquisarPorNickParcial.all(`%${cleanNick}%`);

    // Não retorna o próprio usuário na busca
    const filtrados = resultados
      .filter(u => u.id !== req.session.userId)
      .map(u => ({
        id: u.id,
        nick: '@' + u.nick,
        idioma_padrao: u.idioma_padrao
      }));

    return res.json({ usuarios: filtrados });
  } catch (err) {
    console.error('[Amigos/Buscar]', err);
    return res.status(500).json({ erro: 'Erro ao buscar usuários.' });
  }
});

/**
 * GET /api/amigos/listar
 */
router.get('/listar', exigirAuth, (req, res) => {
  try {
    const usuario = db.buscarPorId.get(req.session.userId);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    let amigosIds = [];
    try {
      amigosIds = JSON.parse(usuario.amigos || '[]');
    } catch (_) {}

    const amigosDetalhes = [];
    for (const amigoId of amigosIds) {
      const amigo = db.buscarPorId.get(amigoId);
      if (amigo) {
        amigosDetalhes.push({
          id: amigo.id,
          nick: '@' + amigo.nick,
          idioma_padrao: amigo.idioma_padrao
        });
      }
    }

    return res.json({ amigos: amigosDetalhes });
  } catch (err) {
    console.error('[Amigos/Listar]', err);
    return res.status(500).json({ erro: 'Erro ao listar amigos.' });
  }
});

/**
 * POST /api/amigos/adicionar
 */
router.post('/adicionar', exigirAuth, (req, res) => {
  try {
    const { amigoId } = req.body;
    if (!amigoId) return res.status(400).json({ erro: 'ID do amigo é obrigatório.' });

    if (amigoId === req.session.userId) {
      return res.status(400).json({ erro: 'Você não pode se adicionar como amigo.' });
    }

    const amigoAlvo = db.buscarPorId.get(amigoId);
    if (!amigoAlvo) {
      return res.status(404).json({ erro: 'Usuário para adicionar não foi encontrado.' });
    }

    const usuario = db.buscarPorId.get(req.session.userId);
    let amigosIds = [];
    try {
      amigosIds = JSON.parse(usuario.amigos || '[]');
    } catch (_) {}

    if (!amigosIds.includes(amigoId)) {
      amigosIds.push(amigoId);
      db.atualizarAmigos.run(JSON.stringify(amigosIds), req.session.userId);
    }

    return res.json({
      sucesso: true,
      mensagem: `@${amigoAlvo.nick} adicionado aos amigos!`,
      amigo: {
        id: amigoAlvo.id,
        nick: '@' + amigoAlvo.nick,
        idioma_padrao: amigoAlvo.idioma_padrao
      }
    });
  } catch (err) {
    console.error('[Amigos/Adicionar]', err);
    return res.status(500).json({ erro: 'Erro ao adicionar amigo.' });
  }
});

/**
 * POST /api/amigos/remover
 */
router.post('/remover', exigirAuth, (req, res) => {
  try {
    const { amigoId } = req.body;
    if (!amigoId) return res.status(400).json({ erro: 'ID do amigo é obrigatório.' });

    const usuario = db.buscarPorId.get(req.session.userId);
    let amigosIds = [];
    try {
      amigosIds = JSON.parse(usuario.amigos || '[]');
    } catch (_) {}

    amigosIds = amigosIds.filter(id => id !== amigoId);
    db.atualizarAmigos.run(JSON.stringify(amigosIds), req.session.userId);

    return res.json({ sucesso: true, mensagem: 'Amigo removido da lista.' });
  } catch (err) {
    console.error('[Amigos/Remover]', err);
    return res.status(500).json({ erro: 'Erro ao remover amigo.' });
  }
});

module.exports = router;
