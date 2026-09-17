/**
 * Rótulos e Bandeiras para os 3 Idiomas Suportados
 * pt-BR (Português Brasileiro 🇧🇷), en (Inglês 🇺🇸), es (Espanhol 🇪🇸)
 */
const TradutorUI = {
  idiomas: {
    'pt-BR': { nome: 'Português BR', bandeira: '🇧🇷', iso: 'pt' },
    'en': { nome: 'English', bandeira: '🇺🇸', iso: 'en' },
    'es': { nome: 'Español', bandeira: '🇪🇸', iso: 'es' }
  },

  obterInfo(codigo) {
    return this.idiomas[codigo] || { nome: codigo, bandeira: '🌐', iso: codigo };
  },

  obterBandeira(codigo) {
    return (this.idiomas[codigo] && this.idiomas[codigo].bandeira) || '🌐';
  },

  obterNome(codigo) {
    return (this.idiomas[codigo] && this.idiomas[codigo].nome) || codigo;
  }
};
