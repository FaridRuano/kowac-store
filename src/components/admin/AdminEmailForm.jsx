"use client";

import { Mail, Send } from "lucide-react";
import { useActionState } from "react";

import { sendSalesEmail } from "@/app/admin/ventas/actions";
import { emailSenderOptions } from "@/lib/email-senders";

const initialState = {
  errors: {},
  message: "",
  status: "idle",
};

function FieldError({ errors }) {
  return errors?.length ? <small className="admin-customer-form__error">{errors[0]}</small> : null;
}

export default function AdminEmailForm() {
  const [state, formAction, isPending] = useActionState(sendSalesEmail, initialState);

  return (
    <form action={formAction} className="admin-customer-form admin-email-form">
      <section className="admin-customer-form__section">
        <div>
          <span className="eyebrow">Correo</span>
          <h2 className="admin-email-form__title">
            <Mail size={18} strokeWidth={1.8} aria-hidden="true" />
            Enviar correo
          </h2>
          <p className="admin-page__section-summary">
            Envía un correo manual desde los aliases de Kowac. Este panel sirve para probar Google Workspace en producción y para mensajes rápidos.
          </p>
        </div>

        <div className="admin-customer-form__grid">
          <label>
            <span>Enviar desde</span>
            <select name="from" defaultValue="hola@kowac.store" required>
              {emailSenderOptions.map((sender) => (
                <option key={sender.email} value={sender.email}>
                  {sender.label} &lt;{sender.email}&gt;
                </option>
              ))}
            </select>
            <FieldError errors={state.errors?.from} />
          </label>

          <label>
            <span>Destinatario</span>
            <input type="email" name="to" placeholder="cliente@correo.com" required />
            <FieldError errors={state.errors?.to} />
          </label>

          <label className="admin-customer-form__wide">
            <span>Asunto</span>
            <input name="subject" placeholder="Asunto del correo" required />
            <FieldError errors={state.errors?.subject} />
          </label>

          <label className="admin-customer-form__wide">
            <span>Mensaje</span>
            <textarea name="message" rows={8} placeholder="Escribe el mensaje que recibirá el cliente." required />
            <FieldError errors={state.errors?.message} />
          </label>
        </div>

        {state.message ? (
          <div className={`admin-customer-form__message admin-customer-form__message--${state.status}`} aria-live="polite">
            {state.message}
          </div>
        ) : null}

        <div className="admin-product-form__footer">
          <button type="submit" className="admin-button admin-button--primary admin-button--lg" disabled={isPending}>
            <Send size={16} strokeWidth={1.8} aria-hidden="true" />
            {isPending ? "Enviando..." : "Enviar correo"}
          </button>
        </div>
      </section>
    </form>
  );
}
