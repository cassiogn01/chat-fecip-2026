const assert = require('assert');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');
const { traduzirTexto, normalizarIdioma } = require('./utils/traducao');
const { gerarQRCodeDataURL } = require('./utils/qrcode');
const { enviarEmailResetSenha } = require('./utils/email');
const GerenciadorSalas = require('./socket-handlers/salas');

let totalTestes = 0;
let testesPassados = 0;

async function test(descricao, fn) {
  totalTestes++;
  try {
    await fn();
    console.log('  [PASSOU] ' + descricao);
    testesPassados++;
  } catch (err) {
    console.error('  [FALHOU] ' + descricao);
    console.error('     Detalhe:', err.message);
  }
}

async function run() {
  console.log('=== TESTES DO BANCO DE DADOS (SQLite) ===');
  await test('Criar e consultar usuario no SQLite', async () => {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const testId = uuidv4();
    const nick = 'teste_' + Date.now().toString().slice(-6);
    const email = nick + '@fecip.test';
    const hash = await bcrypt.hash('senha123', 10);
    db.criarUsuario.run(testId, nick, email, hash, 'pt-BR', '[]');
    const u = db.buscarPorId.get(testId);
    assert.ok(u, 'Usuario deve existir');
    assert.strictEqual(u.nick, nick);
    assert.strictEqual(u.email, email);
    const ok = await bcrypt.compare('senha123', u.senha);
    assert.strictEqual(ok, true);
  });

  console.log('=== TESTES DE TRADUÇÃO SIMULTANEA ===');
  await test('Normalizacao de idiomas', () => {
    assert.strictEqual(normalizarIdioma('pt-BR'), 'pt');
    assert.strictEqual(normalizarIdioma('en'), 'en');
    assert.strictEqual(normalizarIdioma('es'), 'es');
  });

  await test('Traducao pt-BR -> en via LibreTranslate', async () => {
    const res = await traduzirTexto('Ola, voce fala ingles?', 'pt-BR', 'en');
    console.log('    Traducao pt->en:', res.texto);
    assert.ok(res.texto.length > 0);
    assert.strictEqual(res.traduzido, true);
  });

  await test('Traducao en -> pt-BR via LibreTranslate', async () => {
    const res = await traduzirTexto('Yes, I speak English', 'en', 'pt-BR');
    console.log('    Traducao en->pt:', res.texto);
    assert.ok(res.texto.length > 0);
    assert.strictEqual(res.traduzido, true);
  });

  await test('Otimizacao: Mesmo idioma nao chama API', async () => {
    const res = await traduzirTexto('Mensagem igual', 'pt-BR', 'pt-BR');
    assert.strictEqual(res.texto, 'Mensagem igual');
    assert.strictEqual(res.traduzido, false);
  });

  await test('Cenario B: Fallback se LibreTranslate cair', async () => {
    const original = process.env.LIBRETRANSLATE_URL;
    process.env.LIBRETRANSLATE_URL = 'http://localhost:59999';
    const res = await traduzirTexto('Mensagem de teste', 'pt-BR', 'en');
    process.env.LIBRETRANSLATE_URL = original;
    assert.strictEqual(res.texto, 'Mensagem de teste');
    assert.strictEqual(res.traduzido, false);
    assert.ok(res.aviso && res.aviso.includes('Aguarde'));
  });

  console.log('=== TESTES DE QR CODE E EMAIL ===');
  await test('Gerar QR Code data URI', async () => {
    const qr = await gerarQRCodeDataURL('http://localhost:3000/sala-entrada.html?sala=test');
    assert.ok(qr.startsWith('data:image/png;base64,'));
  });

  await test('Envio de email de reset (Cenario D)', async () => {
    const envio = await enviarEmailResetSenha('cassio@exemplo.com', 'http://localhost:3000/reset-senha.html?token=123');
    assert.strictEqual(envio.success, true);
  });

  console.log('=== TESTES DE SALA EM MEMORIA RAM ===');
  await test('Criar sala e entrada de convidado', async () => {
    const salas = new GerenciadorSalas();
    const sockA = { id: 'sockA', join: () => {} };
    const sockB = { id: 'sockB', join: () => {} };
    const io = { to: () => ({ emit: () => {} }) };
    const criacao = await salas.criarSala(sockA, { nome: 'Cassio', idioma: 'pt-BR', registrado: true });
    assert.ok(criacao.salaId);
    const entrada = salas.entrarSala(sockB, { salaId: criacao.salaId, nome: 'Joao', idioma: 'en' }, io);
    assert.strictEqual(entrada.sucesso, true);
    assert.strictEqual(salas.obterSala(criacao.salaId).status, 'ativo');
  });

  await test('Cenario A: Desconexao mata a sala e apaga da RAM', async () => {
    const salas = new GerenciadorSalas();
    const sockA = { id: 'sockA', join: () => {} };
    const sockB = { id: 'sockB', join: () => {} };
    let avisoEmitido = null;
    const io = { to: () => ({ emit: (ev, p) => { avisoEmitido = p; } }), in: () => ({ socketsLeave: () => {} }) };
    const criacao = await salas.criarSala(sockA, { nome: 'Cassio', idioma: 'pt-BR' });
    salas.entrarSala(sockB, { salaId: criacao.salaId, nome: 'Joao', idioma: 'en' }, io);
    salas.removerConexao('sockA', io);
    assert.ok(avisoEmitido.mensagem.includes('Cassio saiu da sala'));
    assert.strictEqual(salas.obterSala(criacao.salaId), undefined);
  });

  console.log('================================================');
  console.log('RESULTADO FINAL: ' + testesPassados + '/' + totalTestes + ' TESTES PASSARAM');
  console.log('================================================');
  if (testesPassados !== totalTestes) process.exit(1);
}

run().catch(e => { console.error(e); process.exit(1); });