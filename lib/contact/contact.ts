/** Numéro au format E.164 (« +972521234567 »), tel qu'enregistré à l'inscription. */
type E164 = string;

/** Lien d'appel, ouvert par l'application Téléphone (mobile) ou le système (web). */
export function callUrl(phone: E164): string {
  return `tel:${phone}`;
}

/** Conversation WhatsApp : wa.me fonctionne avec ou sans l'application, et dans un navigateur. */
export function whatsappUrl(phone: E164, message?: string): string {
  const url = `https://wa.me/${phone.replace(/\D/g, '')}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

/** Partage d'un message dans WhatsApp : l'utilisateur choisit la conversation (groupe des invités…). */
export function whatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
