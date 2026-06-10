import nodemailer from "nodemailer";

const smtpPort = Number(process.env.EMAIL_SERVER_PORT || 465);

function getEmailConfig() {
  return {
    from: process.env.EMAIL_FROM || "Kowac <hola@kowac.store>",
    host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
    password: process.env.EMAIL_SERVER_PASSWORD || "",
    port: smtpPort,
    secure: String(process.env.EMAIL_SERVER_SECURE || "true") !== "false",
    user: process.env.EMAIL_SERVER_USER || "",
  };
}

function assertEmailConfig(config) {
  const missingKeys = [];

  if (!config.user) {
    missingKeys.push("EMAIL_SERVER_USER");
  }

  if (!config.password) {
    missingKeys.push("EMAIL_SERVER_PASSWORD");
  }

  if (missingKeys.length) {
    throw new Error(`Faltan variables de email: ${missingKeys.join(", ")}`);
  }
}

function createTransporter() {
  const config = getEmailConfig();
  assertEmailConfig(config);

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT || 15000),
    greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT || 15000),
    socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT || 30000),
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

export async function sendEmail({ from, html, replyTo, subject, text, to }) {
  const config = getEmailConfig();
  const transporter = createTransporter();

  return transporter.sendMail({
    from: from || config.from,
    html,
    replyTo: replyTo || process.env.EMAIL_REPLY_TO || undefined,
    subject,
    text,
    to,
  });
}

export function renderKowacEmail({ children, previewText = "", title }) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        background: #f5efe6;
        color: #161412;
        font-family: Arial, Helvetica, sans-serif;
      }
      .shell {
        width: 100%;
        padding: 28px 16px;
      }
      .card {
        max-width: 620px;
        margin: 0 auto;
        border: 1px solid #dfd2c1;
        border-radius: 14px;
        background: #fffaf2;
        overflow: hidden;
      }
      .header {
        padding: 28px 30px 18px;
        border-bottom: 1px solid #e8ddcf;
      }
      .brand {
        margin: 0;
        font-size: 18px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .content {
        padding: 28px 30px 32px;
        line-height: 1.58;
      }
      .content h1 {
        margin: 0 0 14px;
        font-size: 25px;
        line-height: 1.12;
      }
      .content p {
        margin: 0 0 16px;
      }
      .footer {
        padding: 18px 30px 26px;
        color: #746b61;
        font-size: 13px;
      }
      .preview {
        display: none;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
      }
    </style>
  </head>
  <body>
    <div class="preview">${previewText}</div>
    <div class="shell">
      <div class="card">
        <div class="header">
          <p class="brand">Kowac</p>
        </div>
        <div class="content">
          ${children}
        </div>
        <div class="footer">
          Kowac Store · kowac.store
        </div>
      </div>
    </div>
  </body>
</html>`;
}
