/**
 * Handler de Indicador de Digitação em Tempo Real
 * Eventos: 'digitando' e 'parou_digitacao'
 */
module.exports = function configurarDigitacao(socket, io, gerenciadorSalas) {
  socket.on('digitando', () => {
    const salaId = gerenciadorSalas.socketParaSala.get(socket.id);
    if (!salaId) return;

    const sala = gerenciadorSalas.obterSala(salaId);
    if (!sala) return;

    const ehCriador = sala.criador && sala.criador.socketId === socket.id;
    const remetenteNome = ehCriador ? sala.criador.nome : (sala.convidado ? sala.convidado.nome : 'Outro');

    // Notifica o parceiro de sala
    socket.to(salaId).emit('usuario_digitando', {
      nome: remetenteNome
    });
  });

  socket.on('parou_digitacao', () => {
    const salaId = gerenciadorSalas.socketParaSala.get(socket.id);
    if (!salaId) return;

    socket.to(salaId).emit('usuario_parou_digitacao');
  });
};
