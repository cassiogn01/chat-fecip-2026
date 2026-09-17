/**
 * Gerenciador de Salas em Memória (RAM - Sessão Volátil)
 * Entidade 3 da especificação:
 * - Onde vive: RAM do servidor Node.js
 * - Permanência: O chat dura SEM LIMITE DE TEMPO enquanto ambos estiverem na sala
 * - Só encerra se: um dos dois clicar em "Sair da Sala" OU a conexão/aba cair definitivamente
 * - Ignora desconexões de sockets antigos de index.html ou sala-entrada.html
 */
const { v4: uuidv4 } = require('uuid');
const { gerarQRCodeDataURL } = require('../utils/qrcode');

class GerenciadorSalas {
  constructor() {
    this.salas = new Map();
    this.socketParaSala = new Map();
  }

  obterSala(salaId) {
    return this.salas.get(salaId);
  }

  async criarSala(socket, dados) {
    const salaId = uuidv4();
    const idioma = dados.idioma || 'pt-BR';
    const nome = (dados.nome || 'Criador').trim().substring(0, 50);

    const baseUrl = dados.baseUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkAcesso = baseUrl + '/sala-entrada.html?sala=' + salaId;

    const qrCodeDataUrl = await gerarQRCodeDataURL(linkAcesso);

    const novaSala = {
      id: salaId,
      status: 'aguardando',
      criadoEm: Date.now(),
      destruirTimeout: null,
      criador: {
        socketId: socket.id,
        nome: nome,
        idioma: idioma,
        conectado: true,
        registrado: !!dados.registrado
      },
      convidado: null
    };

    this.salas.set(salaId, novaSala);
    this.socketParaSala.set(socket.id, salaId);
    socket.join(salaId);

    return {
      salaId,
      link: linkAcesso,
      qrCode: qrCodeDataUrl,
      criador: novaSala.criador
    };
  }

  entrarSala(socket, dados, io) {
    const { salaId, nome, idioma } = dados;
    const sala = this.salas.get(salaId);

    if (!sala) {
      return { erro: 'Sala não encontrada ou já expirada.' };
    }

    const convidadoNome = (nome || 'Convidado').trim().substring(0, 50);
    const convidadoIdioma = idioma || 'en';

    sala.convidado = {
      socketId: socket.id,
      nome: convidadoNome,
      idioma: convidadoIdioma,
      conectado: true,
      registrado: !!dados.registrado
    };

    sala.status = 'ativo';
    this.socketParaSala.set(socket.id, salaId);
    socket.join(salaId);

    // Notifica o criador na tela inicial que o convidado entrou
    io.to(salaId).emit('sala_iniciada', {
      salaId: sala.id,
      criador: sala.criador,
      convidado: sala.convidado
    });

    return { sucesso: true, sala };
  }

  conectarChat(socket, dados, io) {
    const { salaId, nome, idioma, papel } = dados;
    const sala = this.salas.get(salaId);

    if (!sala) {
      return { erro: 'Sala não encontrada ou já encerrada.' };
    }

    // Se havia qualquer agendamento de encerramento, cancela na hora!
    if (sala.destruirTimeout) {
      clearTimeout(sala.destruirTimeout);
      sala.destruirTimeout = null;
    }

    this.socketParaSala.set(socket.id, salaId);
    socket.join(salaId);

    if (papel === 'criador') {
      sala.criador.socketId = socket.id;
      sala.criador.conectado = true;
      if (nome) sala.criador.nome = nome;
      if (idioma) sala.criador.idioma = idioma;
    } else {
      if (!sala.convidado) {
        sala.convidado = {
          socketId: socket.id,
          nome: (nome || 'Convidado').trim().substring(0, 50),
          idioma: idioma || 'en',
          conectado: true
        };
      } else {
        sala.convidado.socketId = socket.id;
        sala.convidado.conectado = true;
        if (nome) sala.convidado.nome = nome;
        if (idioma) sala.convidado.idioma = idioma;
      }
      sala.status = 'ativo';
    }

    console.log('[Sala ' + salaId + '] Chat conectado: ' + papel + ' (' + (papel === 'criador' ? sala.criador.nome : sala.convidado.nome) + ') socket=' + socket.id);

    // Avisa a ambos sobre o status atualizado
    io.to(salaId).emit('sala_pronta', {
      salaId: sala.id,
      status: sala.status,
      criador: sala.criador,
      convidado: sala.convidado
    });

    return {
      sucesso: true,
      sala: {
        id: sala.id,
        status: sala.status,
        criador: sala.criador,
        convidado: sala.convidado
      }
    };
  }

  removerConexao(socketId, io, imediato = false) {
    const salaId = this.socketParaSala.get(socketId);
    if (!salaId) return;

    const sala = this.salas.get(salaId);
    if (!sala) {
      this.socketParaSala.delete(socketId);
      return;
    }

    const ehSocketCriador = sala.criador && sala.criador.socketId === socketId;
    const ehSocketConvidado = sala.convidado && sala.convidado.socketId === socketId;

    // IMPORTANTE: Se o socket que desconectou NÃO é o socket ativo do criador nem do convidado,
    // significa que é um socket antigo de index.html ou sala-entrada.html que foi fechado após o redirecionamento.
    // IGNORA completamente para NÃO encerrar a conversa ativa!
    if (!ehSocketCriador && !ehSocketConvidado) {
      console.log('[Socket ' + socketId + '] Desconexão de socket antigo/navegação. Mantendo sala ' + salaId + ' ativa.');
      this.socketParaSala.delete(socketId);
      return;
    }

    let quemSaiu = 'Participante';
    if (ehSocketCriador) {
      quemSaiu = sala.criador.nome;
      sala.criador.conectado = false;
    } else if (ehSocketConvidado) {
      quemSaiu = sala.convidado.nome;
      sala.convidado.conectado = false;
    }

    const encerrar = () => {
      const s = this.salas.get(salaId);
      if (!s) return;

      // Se ambos voltaram a estar conectados (ex: reconexão breve de internet), NÃO encerra!
      if (s.criador && s.criador.conectado && s.convidado && s.convidado.conectado) {
        console.log('[Sala ' + salaId + '] Ambos continuam conectados. Cancelando encerramento.');
        return;
      }

      console.log('[Sala ' + salaId + '] Encerrando sala porque ' + quemSaiu + ' desconectou.');
      io.to(salaId).emit('participante_saiu', {
        mensagem: '[' + quemSaiu + ' saiu da sala]',
        salaEncerrada: true
      });

      io.in(salaId).socketsLeave(salaId);
      this.salas.delete(salaId);
      this.socketParaSala.delete(socketId);
    };

    if (imediato) {
      // Usuário clicou explicitamente em "Sair da Sala"
      encerrar();
    } else {
      // Queda de conexão ou fechamento de aba: aguarda 15 segundos para confirmar se não foi um micro corte de internet
      console.log('[Sala ' + salaId + '] ' + quemSaiu + ' perdeu conexão. Aguardando 15s antes de encerrar...');
      if (sala.destruirTimeout) clearTimeout(sala.destruirTimeout);
      sala.destruirTimeout = setTimeout(encerrar, 15000);
    }
  }
}

module.exports = GerenciadorSalas;
