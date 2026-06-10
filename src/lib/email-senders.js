export const emailSenderOptions = [
  { email: "hola@kowac.store", label: "Kowac", name: "Kowac" },
  { email: "shop@kowac.store", label: "Kowac Store", name: "Kowac Store" },
  { email: "pedidos@kowac.store", label: "Kowac Pedidos", name: "Kowac Pedidos" },
  { email: "soporte@kowac.store", label: "Kowac Soporte", name: "Kowac Soporte" },
  { email: "devoluciones@kowac.store", label: "Kowac Devoluciones", name: "Kowac Devoluciones" },
  { email: "no-reply@kowac.store", label: "Kowac", name: "Kowac" },
];

export function getEmailSender(value) {
  return emailSenderOptions.find((sender) => sender.email === value) || null;
}
