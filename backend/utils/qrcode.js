/**
 * Utilitário de Geração de QR Code
 * Gera QR Code como Data URI (imagem base64 PNG) para renderização instantânea no navegador.
 */
const QRCode = require('qrcode');

async function gerarQRCodeDataURL(texto) {
  try {
    const dataUrl = await QRCode.toDataURL(texto, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 260,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('[QRCode] Erro ao gerar QR Code:', err);
    throw err;
  }
}

module.exports = {
  gerarQRCodeDataURL
};
