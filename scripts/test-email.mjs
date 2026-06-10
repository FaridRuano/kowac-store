import { renderKowacEmail, sendEmail } from "../src/lib/email.js";

const to = process.argv[2] || process.env.EMAIL_TEST_TO || process.env.EMAIL_SERVER_USER;

if (!to) {
  throw new Error("Indica un destinatario: npm run test:email -- correo@dominio.com");
}

console.log(`Preparando correo de prueba para ${to}...`);

const html = renderKowacEmail({
  title: "Prueba de correo Kowac",
  previewText: "La aplicación de Kowac ya puede enviar correos.",
  children: `
    <h1>Correo de prueba</h1>
    <p>Este mensaje confirma que la aplicación de Kowac puede enviar correos usando Google Workspace.</p>
    <p>Si recibiste este correo, la configuración SMTP está funcionando correctamente.</p>
  `,
});

try {
  console.log(`Conectando a ${process.env.EMAIL_SERVER_HOST || "smtp.gmail.com"}:${process.env.EMAIL_SERVER_PORT || "465"}...`);

  const result = await sendEmail({
    html,
    subject: "Prueba de correo Kowac",
    text: "Este mensaje confirma que la aplicación de Kowac puede enviar correos usando Google Workspace.",
    to,
  });

  console.log(`Correo enviado: ${result.messageId}`);
} catch (error) {
  console.error("No se pudo enviar el correo de prueba.");
  console.error(error?.message || error);
  process.exitCode = 1;
}
