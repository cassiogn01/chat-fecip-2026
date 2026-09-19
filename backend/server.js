/**
 * Servidor Principal - Node.js + Express + Socket.io + SQLite
 * Chat com Tradução Simultânea — FECIP 2026
 * Autor: Cássio Roberto Monteiro Guimarães Natal
 */
require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const amigosRoutes = require('./routes/amigos');
const salasRoutes = require('./routes/salas');
const GerenciadorSalas = require('./socket-handlers/salas');
const configurarMensagens = require('./socket-handlers/mensagens');
const configurarDigitacao = require('./socket-handlers/digitacao');

const app = express();
const server = http.createServer(app);

// Configuração do Socket.io com reconexão ativada (Seção 15)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 10000,
  pingInterval: 5000
});

const PORT = process.env.PORT || 3000;

// Middlewares Express
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão Express simples para autenticação
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fecip_chat_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

// Instância do Gerenciador de Salas em Memória (RAM)
const gerenciadorSalas = new GerenciadorSalas();

const traduzirRoutes = require('./routes/traduzir');

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/amigos', amigosRoutes);
app.use('/api/salas', salasRoutes(gerenciadorSalas));
app.use('/api/traduzir', traduzirRoutes);

// Servir arquivos estáticos do Frontend
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// Rota de fallback para SPA e páginas diretas
app.get('/sala/:id', (req, res) => {
  res.redirect(`/sala-entrada.html?sala=${req.params.id}`);
});

// Mapa de controle de taxa (Rate Limit de 500ms por socket)
const ultimosEnvios = new Map();

// Handlers de Conexão Socket.io
io.on('connection', (socket) => {
  console.log(`[Socket] Novo cliente conectado: ${socket.id}`);

  // Evento: Criar Sala (T=1s, T=2s, T=3s)
  socket.on('criar_sala', async (dados, callback) => {
    try {
      const resultado = await gerenciadorSalas.criarSala(socket, dados);
      if (callback) callback({ sucesso: true, ...resultado });
    } catch (err) {
      console.error('[Socket/criar_sala]', err);
      if (callback) callback({ sucesso: false, erro: 'Falha ao criar sala.' });
    }
  });

  // Evento: Entrar na Sala (T=5s, T=6s)
  socket.on('conectar_chat', (dados, callback) => {
    try {
      const resultado = gerenciadorSalas.conectarChat(socket, dados, io);
      if (callback) callback(resultado);
    } catch (err) {
      console.error('[Socket/conectar_chat]', err);
      if (callback) callback({ erro: 'Falha ao conectar no chat.' });
    }
  });

  socket.on('entrar_sala', (dados, callback) => {
    try {
      const resultado = gerenciadorSalas.entrarSala(socket, dados, io);
      if (callback) callback(resultado);
    } catch (err) {
      console.error('[Socket/entrar_sala]', err);
      if (callback) callback({ erro: 'Falha ao entrar na sala.' });
    }
  });

  // Evento: Sair da Sala voluntariamente
  socket.on('sair_sala', () => {
    gerenciadorSalas.removerConexao(socket.id, io, true);
  });

  // Módulos de Mensagens e Digitação
  configurarMensagens(socket, io, gerenciadorSalas, ultimosEnvios);
  configurarDigitacao(socket, io, gerenciadorSalas);

  // Cenário A: Desconexão por fechamento de aba ou queda de rede
  socket.on('disconnect', () => {
    console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    ultimosEnvios.delete(socket.id);
    gerenciadorSalas.removerConexao(socket.id, io);
  });
});

// Início do Servidor
server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  CHAT COM TRADUÇÃO SIMULTÂNEA - FECIP 2026`);
  console.log(`  Servidor rodando em: http://localhost:${PORT}`);
  console.log(`  Lema: "Entra, conversa, traduz, tchau"`);
  console.log(`===================================================`);
});
