/**
 * Utilitário de Validação Frontend & Prevenção XSS
 * Limites e regras da Seção 11 da especificação
 */
const Validacao = {
  // Regex do Nick: 3 a 20 caracteres, alfanumérico + underline
  regexNick: /^[a-zA-Z0-9_]{3,20}$/,
  // RFC 5322 simplificado
  regexEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  validarNick(nick) {
    if (!nick) return 'O nick é obrigatório.';
    const limpo = nick.trim().replace(/^@/, '');
    if (limpo.length < 3 || limpo.length > 20) {
      return 'O nick deve ter entre 3 e 20 caracteres.';
    }
    if (!this.regexNick.test(limpo)) {
      return 'O nick só pode conter letras, números e underline (_).';
    }
    return null;
  },

  validarEmail(email) {
    if (!email) return 'O e-mail é obrigatório.';
    const limpo = email.trim();
    if (limpo.length > 100) {
      return 'O e-mail não pode ultrapassar 100 caracteres.';
    }
    if (!this.regexEmail.test(limpo)) {
      return 'Informe um e-mail válido.';
    }
    return null;
  },

  validarSenha(senha) {
    if (!senha) return 'A senha é obrigatória.';
    if (senha.length < 3 || senha.length > 50) {
      return 'A senha deve ter entre 3 e 50 caracteres.';
    }
    return null;
  },

  validarNomeConvidado(nome) {
    if (!nome || !nome.trim()) return 'Informe seu nome para entrar na sala.';
    if (nome.trim().length > 50) return 'O nome pode ter no máximo 50 caracteres.';
    return null;
  },

  validarMensagem(texto) {
    if (!texto || !texto.trim()) return 'Digite uma mensagem.';
    if (texto.trim().length > 500) return 'A mensagem não pode ultrapassar 500 caracteres.';
    return null;
  },

  // Prevenção XSS ao injetar texto no DOM
  escaparHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
