/**
 * Handler de Mensagens em Tempo Real (Socket.io)
 * Regra de Ouro: "Ninguém lê em idioma que não escolheu."
 * Rate limit: máx 1 mensagem a cada 500ms por socket
 * Validação: máx 500 caracteres, sem linhas consecutivas vazias
 * Prevenção XSS: Escapa caracteres no backend
 */
const { traduzirTexto } = require('../utils/traducao');

// Escape XSS de segurança
function escaparHTML(texto) {
  if (!texto) return '';
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Sanitização de linhas consecutivas em branco (Seção 11)
function sanitizarTexto(texto) {
  if (!texto) return '';
  return texto
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .substring(0, 500); // máx 500 chars
}

module.exports = function configurarMensagens(socket, io, gerenciadorSalas, ultimosEnvios) {
  socket.on('enviar_mensagem', async (dados) => {
    try {
      const agora = Date.now();
      const ultimoEnvio = ultimosEnvios.get(socket.id) || 0;

      // Rate limit: máx 1 mensagem a cada 500ms por socket (Seção 12)
      if (agora - ultimoEnvio < 500) {
        socket.emit('erro_mensagem', {
          erro: 'Aguarde meio segundo antes de enviar outra mensagem (Rate limit).'
        });
        return;
      }
      ultimosEnvios.set(socket.id, agora);

      const salaId = gerenciadorSalas.socketParaSala.get(socket.id);
      if (!salaId) {
        socket.emit('erro_mensagem', { erro: 'Você não está em nenhuma sala ativa.' });
        return;
      }

      const sala = gerenciadorSalas.obterSala(salaId);
      if (!sala || sala.status !== 'ativo') {
        socket.emit('erro_mensagem', { erro: 'A sala precisa de 2 participantes para iniciar o chat.' });
        return;
      }

      let { texto } = dados;
      if (!texto || typeof texto !== 'string') return;

      // Sanitização de caracteres e quebras de linha
      const textoLimpo = sanitizarTexto(texto);
      if (!textoLimpo) return;

      // Identifica remetente e destinatário
      const ehCriador = sala.criador.socketId === socket.id;
      const remetente = ehCriador ? sala.criador : sala.convidado;
      const destinatario = ehCriador ? sala.convidado : sala.criador;

      const textoEscapado = escaparHTML(textoLimpo);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // 1. O Remetente sempre recebe sua mensagem exatamente como digitou (T=8s)
      socket.emit('mensagem_recebida', {
        lado: 'me',
        autor: remetente.nome,
        idiomaOriginal: remetente.idioma,
        texto: textoEscapado,
        traduzido: false,
        hora: timestamp
      });

      // 2. Tradução para o idioma escolhido pelo destinatário (T=9s e T=10s)
      const resultadoTraducao = await traduzirTexto(textoLimpo, remetente.idioma, destinatario.idioma);
      const textoFinalDestinatario = escaparHTML(resultadoTraducao.texto);

      // 3. Destinatário recebe no idioma que escolheu (lado esquerdo)
      io.to(destinatario.socketId).emit('mensagem_recebida', {
        lado: 'other',
        autor: remetente.nome,
        idiomaOriginal: remetente.idioma,
        idiomaDestino: destinatario.idioma,
        texto: textoFinalDestinatario,
        traduzido: resultadoTraducao.traduzido,
        aviso: resultadoTraducao.aviso || null,
        hora: timestamp
      });
    } catch (err) {
      console.error('[Socket/Mensagem] Erro ao processar:', err);
      socket.emit('erro_mensagem', { erro: 'Ocorreu um erro ao enviar a mensagem.' });
    }
  });
};
