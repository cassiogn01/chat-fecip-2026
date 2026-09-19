/**
 * Rótulos e Bandeiras para os 3 Idiomas Suportados
 * pt-BR (Português Brasileiro 🇧🇷), en (Inglês 🇺🇸), es (Espanhol 🇪🇸)
 */
const TradutorUI = {
  idiomas: {
    'pt-BR': { nome: 'Português', pais: 'Brasil', bandeira: '🇧🇷', iso: 'pt' },
    'en': { nome: 'English', pais: 'Estados Unidos', bandeira: '🇺🇸', iso: 'en' },
    'es': { nome: 'Español', pais: 'Espanha', bandeira: '🇪🇸', iso: 'es' }
  },

  obterInfo(codigo) {
    return this.idiomas[codigo] || { nome: codigo, pais: 'Global', bandeira: '🌐', iso: codigo };
  },

  obterBandeira(codigo) {
    return (this.idiomas[codigo] && this.idiomas[codigo].bandeira) || '🌐';
  },

  obterNome(codigo) {
    return (this.idiomas[codigo] && this.idiomas[codigo].nome) || codigo;
  },

  obterPaisComBandeira(codigo) {
    const item = this.idiomas[codigo];
    if (item) return `${item.bandeira} ${item.pais} (${item.nome})`;
    return `🌐 ${codigo}`;
  }
};
