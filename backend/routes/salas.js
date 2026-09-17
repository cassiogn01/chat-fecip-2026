/**
 * Rota auxiliar para consulta de informações prévias da sala
 * Usado pelo frontend do Convidado em sala-entrada.html (T=4s)
 */
const express = require('express');
const router = express.Router();

module.exports = (gerenciadorSalas) => {
  router.get('/:salaId', (req, res) => {
    const { salaId } = req.params;
    const sala = gerenciadorSalas.obterSala(salaId);

    if (!sala) {
      return res.status(404).json({
        existe: false,
        erro: 'Esta sala não existe ou já foi encerrada.'
      });
    }

    // Retorna apenas dados públicos necessários para a tela de entrada
    return res.json({
      existe: true,
      salaId: sala.id,
      criadorNick: sala.criador ? sala.criador.nome : 'Anônimo',
      criadorIdioma: sala.criador ? sala.criador.idioma : 'pt-BR',
      ocupada: !!sala.convidado,
      status: sala.status
    });
  });

  return router;
};
