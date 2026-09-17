/**
 * Utilitário de Tradução em Tempo Real
 * Conecta ao servidor local LibreTranslate (Docker na porta 5000)
 * Regra de Ouro: "Ninguém lê em idioma que não escolheu."
 * Cenário B: Se o LibreTranslate cair, repassa mensagem original com aviso.
 */
function obterUrlLibreTranslate() { return process.env.LIBRETRANSLATE_URL || 'http://localhost:5000'; }

// Mapeia idiomas da especificação (pt-BR, en, es) para códigos ISO aceitos pelo LibreTranslate
function normalizarIdioma(lang) {
  if (!lang) return 'pt';
  const clean = lang.toLowerCase().trim();
  if (clean.startsWith('pt')) return 'pt';
  if (clean.startsWith('en')) return 'en';
  if (clean.startsWith('es')) return 'es';
  return 'pt';
}

/**
 * Traduz um texto de um idioma para outro
 * @param {string} texto Texto original
 * @param {string} origem Idioma do remetente (pt-BR, en, es)
 * @param {string} destino Idioma do destinatário (pt-BR, en, es)
 * @returns {Promise<{ texto: string, traduzido: boolean, aviso?: string }>}
 */
async function traduzirTexto(texto, origem, destino) {
  const src = normalizarIdioma(origem);
  const tgt = normalizarIdioma(destino);

  // Se ambos falam a mesma língua, não necessita chamar a API
  if (src === tgt) {
    return { texto, traduzido: false };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const response = await fetch(`${obterUrlLibreTranslate()}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: texto,
        source: src,
        target: tgt,
        format: 'text'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LibreTranslate respondeu com status ${response.status}`);
    }

    const data = await response.json();
    if (data && data.translatedText) {
      return {
        texto: data.translatedText,
        traduzido: true,
        origem: src,
        destino: tgt
      };
    }

    throw new Error('Resposta de tradução sem campo translatedText');
  } catch (err) {
    // Se o Docker local falhar (como acontece na nuvem Render), tenta o servidor comunitário LibreTranslate na nuvem:
    try {
      const fallbackUrl = 'https://translate.disroot.org/translate';
      const fbController = new AbortController();
      const fbTimeout = setTimeout(() => fbController.abort(), 4000);

      const fbResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: texto,
          source: src,
          target: tgt,
          format: 'text'
        }),
        signal: fbController.signal
      });

      clearTimeout(fbTimeout);

      if (fbResponse.ok) {
        const fbData = await fbResponse.json();
        if (fbData && fbData.translatedText) {
          return {
            texto: fbData.translatedText,
            traduzido: true,
            origem: src,
            destino: tgt
          };
        }
      }
    } catch (fbErr) {
      console.warn('[Tradutor] Instância LibreTranslate nuvem também indisponível:', fbErr.message);
    }

    console.warn('[Tradutor] LibreTranslate indisponível:', err.message);

    return {
      texto: texto,
      traduzido: false,
      aviso: 'Tradução indisponível (LibreTranslate offline).'
    };
  }
}

module.exports = {
  traduzirTexto,
  normalizarIdioma
};
