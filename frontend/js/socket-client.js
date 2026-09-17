/**
 * Cliente Socket.io com Reconexão Automática Ativada (Seção 15)
 */
function inicializarSocket() {
  if (typeof io === 'undefined') {
    console.error('Biblioteca Socket.io não carregada.');
    return null;
  }

  const socket = io('/', {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('[Socket] Conectado ao servidor. ID:', socket.id);
  });

  socket.on('disconnect', (razao) => {
    console.warn('[Socket] Desconectado:', razao);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Erro de conexão:', err.message);
  });

  return socket;
}
