import { NextResponse } from "next/server";

import { renderKowacEmail, sendEmail } from "@/lib/email";
import { getCurrentInternalUser } from "@/lib/session";

export async function POST(request) {
  const user = await getCurrentInternalUser();

  if (!user) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const to = String(body?.to || user.email || "").trim();

    if (!to) {
      return NextResponse.json({ message: "No hay destinatario para la prueba." }, { status: 400 });
    }

    const html = renderKowacEmail({
      title: "Prueba de correo Kowac",
      previewText: "La aplicación de Kowac ya puede enviar correos.",
      children: `
        <h1>Correo de prueba</h1>
        <p>Este mensaje confirma que la aplicación de Kowac puede enviar correos usando Google Workspace.</p>
        <p>Si recibiste este correo, la configuración SMTP está funcionando correctamente.</p>
      `,
    });

    const result = await sendEmail({
      html,
      subject: "Prueba de correo Kowac",
      text: "Este mensaje confirma que la aplicación de Kowac puede enviar correos usando Google Workspace.",
      to,
    });

    return NextResponse.json(
      {
        message: "Correo enviado.",
        messageId: result.messageId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/admin/email-test error", error);

    return NextResponse.json(
      {
        message: "No se pudo enviar el correo de prueba.",
      },
      { status: 500 }
    );
  }
}
