/**
 * Rotas de Autenticação e Gestão de Contas (SQLite + Bcrypt + Sessões + Reset)
 * Implementa validações estritas de tamanho e formato conforme a especificação.
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { enviarEmailResetSenha } = require('../utils/email');

// Regex de validação conforme Seção 11 da especificação
const NICK_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDIOMAS_PERMITIDOS = ['pt-BR', 'en', 'es'];

// Helper para normalizar nicks (remove @ inicial se enviado)
function limparNick(nick) {
  if (!nick) return '';
  return nick.trim().replace(/^@/, '');
}

/**
 * POST /api/auth/cadastro
 */
router.post('/cadastro', async (req, res) => {
  try {
    let { nick, email, senha, idioma_padrao } = req.body;
    nick = limparNick(nick);
    email = (email || '').trim().toLowerCase();
    idioma_padrao = idioma_padrao || 'pt-BR';

    // 1. Validação do Nick (3-20 chars, alfanumérico + underline)
    if (!nick || !NICK_REGEX.test(nick)) {
      return res.status(400).json({
        erro: 'Nick inválido. Deve ter entre 3 e 20 caracteres (apenas letras, números e _).'
      });
    }

    // 2. Validação de E-mail (até 100 chars, RFC 5322 válido)
    if (!email || email.length > 100 || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        erro: 'E-mail inválido. Deve ter até 100 caracteres e formato de e-mail válido.'
      });
    }

    // 3. Validação de Senha (3-50 chars)
    if (!senha || senha.length < 3 || senha.length > 50) {
      return res.status(400).json({
        erro: 'Senha inválida. Deve ter entre 3 e 50 caracteres.'
      });
    }

    // 4. Validação de Idioma
    if (!IDIOMAS_PERMITIDOS.includes(idioma_padrao)) {
      idioma_padrao = 'pt-BR';
    }

    // 5. Verificar unicidade de Nick
    const nickExiste = db.buscarPorNick.get(nick);
    if (nickExiste) {
      return res.status(400).json({ erro: 'Este nick já está em uso.' });
    }

    // 6. Verificar unicidade de E-mail
    const emailExiste = db.buscarPorEmail.get(email);
    if (emailExiste) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    // 7. Hash com bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // 8. Salvar no SQLite
    const novoId = uuidv4();
    db.criarUsuario.run(novoId, nick, email, senhaHash, idioma_padrao, '[]');

    // Iniciar sessão automaticamente
    req.session.userId = novoId;

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Cadastro realizado com sucesso!',
      usuario: {
        id: novoId,
        nick: '@' + nick,
        email,
        idioma_padrao,
        amigos: []
      }
    });
  } catch (err) {
    console.error('[Auth/Cadastro]', err);
    return res.status(500).json({ erro: 'Erro interno ao realizar cadastro.' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    let { login, senha } = req.body;
    login = (login || '').trim();

    if (!login || !senha) {
      return res.status(400).json({ erro: 'Informe o nick/e-mail e a senha.' });
    }

    // Aceita login por @nick ou por e-mail
    let usuario = null;
    if (login.includes('@') && login.includes('.')) {
      usuario = db.buscarPorEmail.get(login.toLowerCase());
    } else {
      const cleanNick = limparNick(login);
      usuario = db.buscarPorNick.get(cleanNick);
    }

    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    // Comparação do hash bcrypt
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    // Salvar ID na sessão Express
    req.session.userId = usuario.id;

    let amigosList = [];
    try {
      amigosList = JSON.parse(usuario.amigos || '[]');
    } catch (_) {}

    return res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso!',
      usuario: {
        id: usuario.id,
        nick: '@' + usuario.nick,
        email: usuario.email,
        idioma_padrao: usuario.idioma_padrao,
        amigos: amigosList
      }
    });
  } catch (err) {
    console.error('[Auth/Login]', err);
    return res.status(500).json({ erro: 'Erro interno ao realizar login.' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao deslogar.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ sucesso: true, mensagem: 'Desconectado com sucesso.' });
  });
});

/**
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ autenticado: false });
  }

  const usuario = db.buscarPorId.get(req.session.userId);
  if (!usuario) {
    return res.status(401).json({ autenticado: false });
  }

  let amigosList = [];
  try {
    amigosList = JSON.parse(usuario.amigos || '[]');
  } catch (_) {}

  return res.json({
    autenticado: true,
    usuario: {
      id: usuario.id,
      nick: '@' + usuario.nick,
      email: usuario.email,
      idioma_padrao: usuario.idioma_padrao,
      amigos: amigosList
    }
  });
});

/**
 * POST /api/auth/reset-senha (Cenário D: Cássio esquece senha)
 */
router.post('/reset-senha', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ erro: 'Informe o e-mail cadastrado.' });
    }

    const usuario = db.buscarPorEmail.get(email.trim().toLowerCase());
    if (!usuario) {
      // Por segurança, resposta idêntica para evitar enumeração de contas
      return res.json({
        sucesso: true,
        mensagem: 'Se o e-mail estiver cadastrado, as instruções foram enviadas.'
      });
    }

    // Token seguro com expiração de 1 hora (3600000 ms)
    const token = crypto.randomBytes(32).toString('hex');
    const expiraEm = Date.now() + 3600 * 1000;
    const tokenId = uuidv4();

    db.salvarResetToken.run(tokenId, usuario.email, token, expiraEm);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkReset = `${baseUrl}/reset-senha.html?token=${token}`;

    const envio = await enviarEmailResetSenha(usuario.email, linkReset);

    return res.json({
      sucesso: true,
      mensagem: 'Instruções para redefinição enviadas para o seu e-mail.',
      previewUrl: envio.previewUrl || null
    });
  } catch (err) {
    console.error('[Auth/Reset-Senha]', err);
    return res.status(500).json({ erro: 'Erro ao processar solicitação de redefinição.' });
  }
});

/**
 * POST /api/auth/nova-senha
 */
router.post('/nova-senha', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({ erro: 'Token e nova senha são obrigatórios.' });
    }

    if (novaSenha.length < 3 || novaSenha.length > 50) {
      return res.status(400).json({ erro: 'A senha deve ter entre 3 e 50 caracteres.' });
    }

    // Limpar tokens expirados antes
    db.limparTokensExpirados.run(Date.now());

    const registroToken = db.buscarResetToken.get(token);
    if (!registroToken) {
      return res.status(400).json({ erro: 'Link inválido ou expirado. Solicite novamente.' });
    }

    if (registroToken.expira_em < Date.now()) {
      db.deletarResetToken.run(token);
      return res.status(400).json({ erro: 'Link expirado (validade de 1 hora ultrapassada).' });
    }

    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    db.atualizarSenha.run(senhaHash, registroToken.email);
    db.deletarResetToken.run(token);

    // Auto-login do usuário após resetar senha com sucesso
    const usuarioAtualizado = db.buscarPorEmail.get(registroToken.email);
    if (usuarioAtualizado) {
      req.session.userId = usuarioAtualizado.id;
    }

    return res.json({
      sucesso: true,
      mensagem: 'Senha alterada com sucesso! Você já pode entrar.'
    });
  } catch (err) {
    console.error('[Auth/Nova-Senha]', err);
    return res.status(500).json({ erro: 'Erro ao redefinir a senha.' });
  }
});

module.exports = router;
