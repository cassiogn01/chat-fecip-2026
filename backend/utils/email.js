const nodemailer = require('nodemailer');

let transporter = null;

function obterTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER || 'cassiognatal01@gmail.com';
  const pass = (process.env.SMTP_PASS || 'scqjyphxtmehxtfi').replace(/\s+/g, '');

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass
    }
  });

  console.log('[Email] Conectado e configurado via Gmail oficial:', user);
  return transporter;
}

async function enviarEmailResetSenha(destinatario, linkReset) {
  const mailer = obterTransporter();
  const remetente = process.env.SMTP_USER || 'cassiognatal01@gmail.com';

  const info = await mailer.sendMail({
    from: '"Chat FECIP 2026" <' + remetente + '>',
    to: destinatario,
    subject: 'Recuperação de Senha — Chat com Tradução Simultânea',
    text: 'Olá!\n\nVocê solicitou a alteração da sua senha no Chat FECIP 2026.\n\nPara cadastrar uma nova senha, clique no link a seguir (válido por 1 hora):\n' + linkReset + '\n\nSe você não solicitou, basta ignorar este e-mail.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2563eb; margin: 0;">Chat FECIP 2026</h2>
          <p style="color: #64748b; font-size: 0.9em; margin-top: 4px;">Chat com Tradução Simultânea em Tempo Real</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;">
        <p style="font-size: 1rem; color: #0f172a;">Olá,</p>
        <p style="font-size: 0.95rem; color: #334155; line-height: 1.5;">Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Chat com Tradução Simultânea</strong>.</p>
        <p style="font-size: 0.95rem; color: #334155; line-height: 1.5;">Clique no botão abaixo para cadastrar sua nova senha. Este link expira em <strong>1 hora</strong>:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${linkReset}" style="background-color: #2563eb; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1rem; display: inline-block;">Redefinir Minha Senha</a>
        </div>
        <p style="font-size: 0.82rem; color: #64748b; line-height: 1.4;">Se você não conseguir clicar no botão, copie e cole o endereço abaixo no seu navegador:<br><a href="${linkReset}" style="color: #2563eb;">${linkReset}</a></p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 0.78rem; color: #94a3b8; text-align: center; margin: 0;">Se você não solicitou a alteração de senha, nenhuma ação é necessária.</p>
      </div>
    `
  });

  console.log('[Email] Notificação real enviada para ' + destinatario + ' | ID: ' + info.messageId);
  return { success: true };
}

module.exports = {
  enviarEmailResetSenha
};
