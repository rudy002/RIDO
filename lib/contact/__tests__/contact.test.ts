import { callUrl, whatsappShareUrl, whatsappUrl } from '../contact';

describe('contact', () => {
  it('appelle le numéro international', () => {
    expect(callUrl('+972521234567')).toBe('tel:+972521234567');
  });

  it('ouvre WhatsApp avec les chiffres seulement, et un message facultatif', () => {
    expect(whatsappUrl('+972521234567')).toBe('https://wa.me/972521234567');
    expect(whatsappUrl('+33612345678', 'Salut David !')).toBe(
      'https://wa.me/33612345678?text=Salut%20David%20!'
    );
  });

  it('partage un message sans destinataire choisi d’avance', () => {
    expect(whatsappShareUrl('Covoiturage : rido.app/e/lea')).toBe(
      'https://wa.me/?text=Covoiturage%20%3A%20rido.app%2Fe%2Flea'
    );
  });
});
