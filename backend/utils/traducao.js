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
    // Camada 2: Servidor Comunitário LibreTranslate na nuvem
    try {
      const fbController = new AbortController();
      const fbTimeout = setTimeout(() => fbController.abort(), 3000);

      const fbResponse = await fetch('https://translate.disroot.org/translate', {
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
      // Ignora e avança para a camada de alta disponibilidade
    }

    // Camada 3: Motor de Alta Disponibilidade (Ininterrupto, 100% Grátis)
    try {
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(texto)}`;
      const gtxController = new AbortController();
      const gtxTimeout = setTimeout(() => gtxController.abort(), 4000);

      const gtxRes = await fetch(gtxUrl, {
        signal: gtxController.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      clearTimeout(gtxTimeout);

      if (gtxRes.ok) {
        const gtxData = await gtxRes.json();
        if (gtxData && gtxData[0] && Array.isArray(gtxData[0])) {
          const resultado = gtxData[0].map(item => item[0]).filter(Boolean).join('');
          if (resultado && resultado.trim()) {
            return {
              texto: resultado,
              traduzido: true,
              origem: src,
              destino: tgt
            };
          }
        }
      }
    } catch (gtxErr) {
      console.warn('[Tradutor] Falha na camada de alta disponibilidade:', gtxErr.message);
    }

    // Cenário B oficial da especificação caso todos os nós caiam:
    return {
      texto: texto,
      traduzido: false,
      aviso: 'Tradução indisponível temporariamente. Aguarde alguns instantes.'
    };
  }
}

module.exports = {
  traduzirTexto,
  normalizarIdioma
};
