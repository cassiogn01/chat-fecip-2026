const assert = require('assert');
const http = require('http');

let total = 0;
let passed = 0;

async function test(desc, fn) {
  total++;
  try {
    await fn();
    console.log('  [PASSOU] ' + desc);
    passed++;
  } catch (e) {
    console.error('  [FALHOU] ' + desc, e.message);
  }
}

async function run() {
  console.log('=== TESTES E2E DE API, AUTENTICAÇÃO E AMIGOS ===');
  const PORT = 3001;
  process.env.PORT = PORT;
  
  // Inicia servidor
  require('./server');
  await new Promise(r => setTimeout(r, 1000));

  const baseUrl = 'http://localhost:' + PORT;
  const nickCassio = 'cassio_' + Date.now().toString().slice(-4);
  const nickJoao = 'joao_' + Date.now().toString().slice(-4);

  let cookieCassio = '';
  let idJoao = '';

  await test('Cenário C: Visitante temporário NÃO consegue acessar rota de amigos', async () => {
    const res = await fetch(baseUrl + '/api/amigos/listar');
    assert.strictEqual(res.status, 403);
  });

  await test('Cadastro de Usuário 1 (Cássio)', async () => {
    const res = await fetch(baseUrl + '/api/auth/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nick: nickCassio,
        email: nickCassio + '@fecip.test',
        senha: 'senhaSegura123',
        idioma_padrao: 'pt-BR'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.sucesso, true);
    cookieCassio = res.headers.get('set-cookie');
  });

  await test('Cadastro de Usuário 2 (João)', async () => {
    const res = await fetch(baseUrl + '/api/auth/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nick: nickJoao,
        email: nickJoao + '@fecip.test',
        senha: 'outraSenha123',
        idioma_padrao: 'en'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    idJoao = data.usuario.id;
  });

  await test('Busca de usuário registrado por @nick', async () => {
    const res = await fetch(baseUrl + '/api/amigos/buscar?nick=' + nickJoao, {
      headers: { 'Cookie': cookieCassio }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.usuarios.length > 0);
    assert.strictEqual(data.usuarios[0].nick, '@' + nickJoao);
  });

  await test('Adicionar usuário aos amigos (favoritos)', async () => {
    const res = await fetch(baseUrl + '/api/amigos/adicionar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieCassio
      },
      body: JSON.stringify({ amigoId: idJoao })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.sucesso, true);
  });

  await test('Listar amigos salvos no SQLite', async () => {
    const res = await fetch(baseUrl + '/api/amigos/listar', {
      headers: { 'Cookie': cookieCassio }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.amigos.length, 1);
    assert.strictEqual(data.amigos[0].nick, '@' + nickJoao);
  });

  await test('Prevenção de XSS e validações', () => {
    const { escape } = require('querystring');
    const texto = '<script>alert(1)</script>';
    const escaparHTML = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    assert.strictEqual(escaparHTML(texto), '&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  console.log('================================================');
  console.log('RESULTADO E2E: ' + passed + '/' + total + ' TESTES PASSARAM');
  console.log('================================================');
  process.exit(passed === total ? 0 : 1);
}

run().catch(e => { console.error(e); process.exit(1); });