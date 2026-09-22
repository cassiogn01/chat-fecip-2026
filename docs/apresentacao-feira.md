# Chat com Tradução Simultânea — FECIP 2026
## Documento de apresentação para professores e visitantes da feira

**Projeto:** `cassiogn01/chat-fecip-2026`  
**Lema:** “Entra, conversa, traduz, tchau”  
**Tipo:** aplicação web de comunicação em tempo real com tradução automática  
**Participantes:** duas pessoas por sala, cada uma podendo escolher seu idioma

---

## 1. Resumo para explicar em poucos minutos

O projeto é um chat temporário individual. Uma pessoa cria uma sala e recebe um link ou QR Code. Outra pessoa acessa esse convite, informa seu nome e escolhe o idioma que deseja utilizar. Quando alguém envia uma mensagem, o sistema mostra o texto original para quem enviou e traduz o conteúdo para o idioma escolhido pelo outro participante.

As mensagens não são salvas no banco de dados. A sala existe somente enquanto a conversa está acontecendo e é removida da memória quando os participantes saem ou quando uma desconexão permanece por determinado tempo. Usuários que desejarem podem criar uma conta para usar favoritos, login e recuperação de senha.

### Exemplo simples

- Cássio escolhe **Português**.
- João escolhe **Inglês**.
- Cássio envia: “Olá, tudo bem?”
- Cássio vê: “Olá, tudo bem?”
- João recebe a tradução em inglês: “Hello, how are you?”

---

## 2. Problema e solução

### Problema

Duas pessoas podem querer conversar, mas não dominar o mesmo idioma. Tradutores comuns normalmente exigem copiar e colar textos, trocar de tela e interromper a conversa.

### Solução

O Chat FECIP integra a tradução diretamente à conversa. Cada participante escolhe seu idioma uma vez e o servidor encaminha a mensagem traduzida automaticamente para a outra pessoa.

### Diferencial

O projeto combina, em uma única aplicação:

- sala privada temporária;
- convite por link e QR Code;
- comunicação instantânea;
- tradução automática;
- indicador de digitação;
- cadastro e autenticação opcional;
- fallback quando o serviço principal de tradução falha;
- proteção básica contra mensagens maliciosas.

---

## 3. Como demonstrar na feira

1. Abrir a página inicial.
2. Informar o nome e o idioma do primeiro participante.
3. Clicar em **Criar Sala Agora**.
4. Mostrar o link ou QR Code gerado.
5. Abrir o link em outro celular ou navegador.
6. O segundo participante informa o nome e escolhe outro idioma.
7. Entrar no chat.
8. Enviar uma mensagem em cada idioma.
9. Mostrar que cada pessoa recebe o conteúdo no idioma escolhido.
10. Demonstrar o indicador “está digitando”.
11. Opcionalmente, sair da sala e mostrar que ela é encerrada.

### Fala curta sugerida

> “Este é um chat 1x1 temporário. O criador gera uma sala por link ou QR Code e o convidado entra sem precisar instalar nada. Cada usuário escolhe seu idioma. Quando uma mensagem é enviada, o servidor verifica os idiomas, traduz o texto e entrega o resultado somente ao destinatário. A conversa não fica armazenada, preservando a ideia de uma comunicação rápida e temporária.”

---

## 4. Arquitetura geral

```text
Navegador do participante A
          │
          │ HTTP / Socket.IO
          ▼
Servidor Node.js
 ├─ Express: páginas e API REST
 ├─ Socket.IO: eventos em tempo real
 ├─ Gerenciador de salas: salas na memória
 ├─ Tradutor: LibreTranslate e fallbacks
 ├─ Sessões: autenticação
 └─ SQLite: usuários e tokens de senha
          │
          ├── LibreTranslate local (Docker)
          └── serviços externos de fallback

Navegador do participante B
```

### Separação entre dados temporários e permanentes

- **Temporários:** salas, participantes e mensagens ficam na memória RAM.
- **Permanentes:** usuários, senhas criptografadas, favoritos e tokens de recuperação ficam no SQLite.
- **Não persistido:** o histórico das mensagens do chat não é salvo.

---

## 5. Estrutura do projeto

```text
chat-fecip-2026/
├── backend/
│   ├── server.js                 # servidor principal
│   ├── db.js                     # banco SQLite e consultas
│   ├── routes/
│   │   ├── auth.js               # cadastro, login e senha
│   │   ├── amigos.js             # favoritos de usuários
│   │   ├── salas.js              # consulta pública da sala
│   │   └── traduzir.js           # tradutor direto
│   ├── socket-handlers/
│   │   ├── salas.js              # ciclo de vida das salas
│   │   ├── mensagens.js          # mensagens e tradução
│   │   └── digitacao.js          # indicador de digitação
│   ├── utils/
│   │   ├── traducao.js           # integração com tradutores
│   │   ├── email.js              # recuperação por e-mail
│   │   └── qrcode.js             # geração de QR Code
│   └── test-suite.js             # testes automatizados
├── frontend/
│   ├── index.html                # criação de salas
│   ├── sala-entrada.html         # entrada pelo convite
│   ├── chat.html                 # tela da conversa
│   ├── login.html                # login
│   ├── cadastro.html             # cadastro
│   └── tradutor.html             # tradução direta
├── docker-compose.yml             # LibreTranslate
└── package.json                   # scripts do projeto
```

---

# 6. Ferramentas utilizadas, explicadas para leigos

## Node.js

**O que é:** ambiente que permite executar JavaScript fora do navegador.  
**O que faz aqui:** executa o servidor, recebe requisições, controla as salas e chama os serviços de tradução.

## JavaScript

**O que é:** linguagem de programação usada no navegador e no servidor.  
**O que faz aqui:** implementa a interface, valida formulários, envia mensagens e controla os eventos do chat.

## Express

**O que é:** biblioteca para criar servidores web e APIs em Node.js.  
**O que faz aqui:** cria endpoints como `/api/auth/login`, serve os arquivos do frontend e recebe dados em JSON.

## Socket.IO

**O que é:** biblioteca para comunicação bidirecional em tempo real.  
**O que faz aqui:** envia mensagens, avisos de entrada/saída, eventos de digitação e atualizações da sala sem recarregar a página.

**Analogia:** HTTP é como enviar uma carta e esperar uma resposta; Socket.IO é como manter uma ligação aberta.

## HTML

**O que é:** linguagem que define a estrutura de uma página.  
**O que faz aqui:** cria formulários, botões, área de mensagens, telas de login e telas de entrada na sala.

## CSS

**O que é:** linguagem de aparência e layout.  
**O que faz aqui:** define cores, cartões, responsividade, botões e adaptação para celular.

## SQLite

**O que é:** banco de dados leve armazenado em um arquivo.  
**O que faz aqui:** guarda usuários, hashes de senha, idiomas, favoritos e tokens de recuperação.

## bcryptjs

**O que é:** biblioteca para transformar senhas em hashes irreversíveis.  
**O que faz aqui:** nunca salva a senha original; compara a senha informada com o hash salvo.

## express-session

**O que é:** sistema de sessão baseado em cookie.  
**O que faz aqui:** mantém o usuário autenticado entre as páginas e identifica quem pode usar favoritos.

## LibreTranslate

**O que é:** serviço de tradução automática que pode ser executado localmente.  
**O que faz aqui:** traduz mensagens entre português, inglês e espanhol.

## Docker e Docker Compose

**O que são:** ferramentas para executar aplicações isoladas em containers.  
**O que fazem aqui:** iniciam o LibreTranslate sem exigir uma instalação manual complexa.

## Nodemailer

**O que é:** biblioteca para envio de e-mails pelo Node.js.  
**O que faz aqui:** envia o link de redefinição de senha.

## QR Code

**O que é:** código visual que pode ser lido pela câmera.  
**O que faz aqui:** transforma o convite da sala em um acesso rápido pelo celular.

## PowerShell e Batch

**O que são:** linguagens de automação do Windows.  
**O que fazem aqui:** iniciam o projeto, verificam o LibreTranslate e fazem backup do banco SQLite.

---

# 7. Fluxo técnico completo

## Criação da sala

1. O navegador abre uma conexão Socket.IO.
2. O frontend envia `criar_sala`.
3. O backend gera um UUID.
4. A sala é colocada em um `Map` na memória.
5. Um link e um QR Code são gerados.
6. O criador recebe os dados da sala.

## Entrada do convidado

1. O convidado abre `sala-entrada.html?sala=ID`.
2. O frontend consulta informações públicas da sala.
3. O convidado escolhe nome e idioma.
4. O evento `entrar_sala` é enviado ao servidor.
5. O servidor associa o socket à sala.
6. O status muda de `aguardando` para `ativo`.
7. Os dois participantes são avisados.

## Envio da mensagem

1. O usuário digita no navegador.
2. O frontend envia `enviar_mensagem`.
3. O backend aplica rate limit.
4. O texto é validado e sanitizado.
5. O remetente recebe o texto original.
6. O servidor traduz para o idioma do destinatário.
7. O destinatário recebe a tradução.
8. Se a tradução falhar, recebe o original com um aviso.

## Encerramento

- Ao clicar em **Sair da Sala**, a sala é encerrada imediatamente.
- Em uma queda temporária, o servidor aguarda até 120 segundos para permitir reconexão.
- Depois disso, a sala e seus dados temporários são removidos da memória.

---

# 8. Códigos principais separados

## 8.1 Inicialização do servidor — `backend/server.js`

```javascript
require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'fecip_chat_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

server.listen(process.env.PORT || 3000, () => {
  console.log('Chat FECIP 2026 iniciado');
});
```

**Como explicar:** este arquivo liga a aplicação, configura o servidor web, ativa sessões e disponibiliza o frontend.

## 8.2 Criação de sala — `backend/socket-handlers/salas.js`

```javascript
async criarSala(socket, dados) {
  const salaId = uuidv4();
  const nome = (dados.nome || 'Criador').trim().substring(0, 50);
  const idioma = dados.idioma || 'pt-BR';

  const link = `${dados.baseUrl}/sala-entrada.html?sala=${salaId}`;
  const qrCode = await gerarQRCodeDataURL(link);

  const sala = {
    id: salaId,
    status: 'aguardando',
    criadoEm: Date.now(),
    criador: {
      socketId: socket.id,
      nome,
      idioma,
      conectado: true
    },
    convidado: null
  };

  this.salas.set(salaId, sala);
  this.socketParaSala.set(socket.id, salaId);
  socket.join(salaId);

  return { salaId, link, qrCode, criador: sala.criador };
}
```

**Como explicar:** gera um identificador único, cria a sala na memória e devolve o convite ao criador.

## 8.3 Envio e tradução — `backend/socket-handlers/mensagens.js`

```javascript
socket.on('enviar_mensagem', async (dados) => {
  const salaId = gerenciadorSalas.socketParaSala.get(socket.id);
  const sala = gerenciadorSalas.obterSala(salaId);

  if (!sala || sala.status !== 'ativo') return;
  if (!dados.texto || typeof dados.texto !== 'string') return;

  const textoLimpo = sanitizarTexto(dados.texto);
  const ehCriador = sala.criador.socketId === socket.id;
  const remetente = ehCriador ? sala.criador : sala.convidado;
  const destinatario = ehCriador ? sala.convidado : sala.criador;

  socket.emit('mensagem_recebida', {
    lado: 'me',
    texto: escaparHTML(textoLimpo),
    traduzido: false
  });

  const traducao = await traduzirTexto(
    textoLimpo,
    remetente.idioma,
    destinatario.idioma
  );

  io.to(destinatario.socketId).emit('mensagem_recebida', {
    lado: 'other',
    texto: escaparHTML(traducao.texto),
    traduzido: traducao.traduzido,
    aviso: traducao.aviso || null
  });
});
```

**Como explicar:** o servidor não manda a mesma mensagem diretamente para os dois. Ele manda o original para quem escreveu e traduz uma cópia para o parceiro.

## 8.4 Fallback de tradução — `backend/utils/traducao.js`

```javascript
async function traduzirTexto(texto, origem, destino) {
  const src = normalizarIdioma(origem);
  const tgt = normalizarIdioma(destino);

  if (src === tgt) {
    return { texto, traduzido: false };
  }

  try {
    const response = await fetch(
      `${process.env.LIBRETRANSLATE_URL}/translate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: texto, source: src, target: tgt })
      }
    );

    const data = await response.json();
    return { texto: data.translatedText, traduzido: true };
  } catch (_) {
    return {
      texto,
      traduzido: false,
      aviso: 'Tradução indisponível temporariamente.'
    };
  }
}
```

**Como explicar:** primeiro tenta o tradutor local. Caso ele não responda, o sistema mantém a conversa funcionando e informa que a tradução está temporariamente indisponível.

## 8.5 Banco de dados — `backend/db.js`

```javascript
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'usuarios.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nick TEXT UNIQUE NOT NULL COLLATE NOCASE,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    senha TEXT NOT NULL,
    idioma_padrao TEXT NOT NULL DEFAULT 'pt-BR',
    amigos TEXT NOT NULL DEFAULT '[]',
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const buscarPorEmail = db.prepare(
  'SELECT * FROM usuarios WHERE email = ?'
);
```

**Como explicar:** cria o arquivo do banco, define a tabela de usuários e usa consultas preparadas, que são mais seguras contra SQL injection.

## 8.6 Senha segura — `backend/routes/auth.js`

```javascript
const salt = await bcrypt.genSalt(10);
const senhaHash = await bcrypt.hash(senha, salt);

db.criarUsuario.run(
  novoId,
  nick,
  email,
  senhaHash,
  idioma_padrao,
  '[]'
);
```

**Como explicar:** a senha original não é armazenada. O banco guarda apenas um hash, que é uma representação protegida da senha.

## 8.7 Cliente Socket.IO — `frontend/js/socket-client.js`

```javascript
function inicializarSocket() {
  const socket = io('/', {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('Conectado ao servidor');
  });

  socket.on('disconnect', (razao) => {
    console.warn('Desconectado:', razao);
  });

  return socket;
}
```

**Como explicar:** cria o canal em tempo real e tenta reconectar automaticamente se a internet cair por alguns instantes.

## 8.8 Proteção contra XSS

```javascript
function escaparHTML(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**Como explicar:** transforma caracteres que poderiam ser interpretados como código HTML em texto comum. Assim, alguém não consegue enviar um script no lugar de uma mensagem.

---

# 9. Segurança e confiabilidade

O projeto possui as seguintes proteções:

- senha com bcrypt;
- consultas preparadas no SQLite;
- validação de nick, e-mail, senha e idioma;
- limite de 500 caracteres por mensagem;
- rate limit de uma mensagem a cada 500 ms por socket;
- escape de HTML para reduzir risco de XSS;
- tokens de recuperação com expiração de uma hora;
- resposta genérica no reset de senha para evitar descobrir quais e-mails existem;
- reconexão automática do Socket.IO;
- fallback de tradução;
- backup do arquivo SQLite por PowerShell ou Batch.

### Observação importante para apresentação

O projeto está adequado para demonstração e feira. Em um ambiente de produção, ainda seria recomendável configurar HTTPS, restringir CORS, usar um armazenamento de sessão externo, retirar segredos do código, adicionar proteção CSRF, limitar tentativas de login e usar monitoramento.

---

# 10. Testes

O projeto possui testes para:

- criação e consulta de usuário;
- comparação de senha com bcrypt;
- normalização de idiomas;
- tradução entre português, inglês e espanhol;
- comportamento quando a tradução falha;
- geração de QR Code;
- gerenciamento de salas na memória;
- entrada de convidado;
- encerramento após desconexão;
- bloqueio de visitante nas rotas de amigos;
- cadastro de usuários;
- busca e adição de favoritos;
- proteção contra XSS.

Para executar os testes do backend:

```bash
cd backend
npm test
```

---

# 11. Como iniciar o projeto

Com Docker e Node.js instalados:

```bash
docker compose up -d
cd backend
npm install
npm start
```

Depois, abrir:

```text
http://localhost:3000
```

No Windows, também podem ser usados os arquivos:

- `iniciar_projeto.ps1`
- `iniciar_projeto.bat`

O script PowerShell verifica se o LibreTranslate está funcionando. Se não estiver, tenta iniciar o container Docker antes de iniciar o servidor Node.js.

---

# 12. Perguntas que os professores podem fazer

### As mensagens ficam salvas?

Não. As mensagens são transmitidas em tempo real e não são gravadas no banco. A sala também fica na memória do servidor.

### O que acontece se o tradutor cair?

O sistema tenta alternativas. Se nenhuma funcionar, entrega a mensagem original e mostra um aviso de indisponibilidade da tradução.

### Por que usar Socket.IO?

Porque o chat precisa enviar e receber eventos imediatamente, sem atualizar a página a cada mensagem.

### Por que usar SQLite?

Porque é simples, leve e suficiente para guardar contas e favoritos sem exigir um servidor de banco separado.

### Qual é a diferença entre a sala e o usuário?

A sala é temporária e fica na RAM. O usuário cadastrado é permanente e fica no SQLite.

### Como o QR Code funciona?

Ele contém o link da sala. A câmera do celular abre esse link e leva o convidado diretamente à tela de entrada.

### Como o sistema evita que alguém envie código malicioso?

O texto é sanitizado e os caracteres HTML são escapados antes de serem exibidos.

### O convidado precisa criar conta?

Não. A conta é opcional. O convidado temporário pode entrar apenas com nome e idioma.

### Por que cada usuário recebe um idioma diferente?

Para cumprir a ideia principal do projeto: cada pessoa lê a mensagem no idioma que escolheu, mesmo que o parceiro tenha escrito em outra língua.

---

# 13. Conclusão

O Chat com Tradução Simultânea FECIP 2026 é uma aplicação web que aproxima pessoas que falam idiomas diferentes. Ele usa comunicação em tempo real, tradução automática, convite por QR Code e salas temporárias para oferecer uma experiência simples: entrar, conversar, traduzir e sair.

O projeto demonstra conhecimentos de:

- desenvolvimento web;
- programação cliente-servidor;
- APIs REST;
- comunicação em tempo real;
- banco de dados;
- autenticação;
- segurança básica;
- containers e automação;
- testes de software;
- acessibilidade da explicação tecnológica para usuários leigos.

**Mensagem final para a feira:**

> “A tecnologia não substitui a conversa: ela remove a barreira do idioma para que a conversa aconteça.”
