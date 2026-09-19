/**
 * Rota para Tradução Direta de Texto (Estilo Google Tradutor)
 * Suporta tradução instantânea com detecção e pares (pt-BR, en, es)
 */
const express = require('express');
const router = express.Router();
const { traduzirTexto } = require('../utils/traducao');

router.post('/', async (req, res) => {
  try {
    const { texto, origem = 'pt-BR', destino = 'en' } = req.body;

    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({ erro: 'Texto para tradução é obrigatório.' });
    }

    const textoLimpo = texto.trim().substring(0, 5000); // Até 5000 caracteres como no Google Tradutor
    if (!textoLimpo) {
      return res.json({ texto: '', traduzido: false, origem, destino });
    }

    const resultado = await traduzirTexto(textoLimpo, origem, destino);
    return res.json({
      texto: resultado.texto,
      traduzido: resultado.traduzido,
      aviso: resultado.aviso || null,
      origem: resultado.origem || origem,
      destino: resultado.destino || destino
    });
  } catch (err) {
    console.error('[API Tradução Direta] Erro:', err.message);
    return res.status(500).json({
      erro: 'Falha ao processar tradução instantânea.',
      detalhes: err.message
    });
  }
});

module.exports = router;
