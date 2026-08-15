/* Réception du formulaire de devis → envoi d'un mail via Resend.
   La clé API reste côté serveur : elle ne doit jamais partir dans le HTML. */

const DESTINATAIRE = 'ateliers@maison-carlier.fr';

// Sans domaine vérifié chez Resend, c'est le seul expéditeur autorisé,
// et il n'envoie que vers l'adresse du compte Resend.
// Une fois maison-carlier.fr vérifié : remplacer par 'Site Maison Carlier <contact@maison-carlier.fr>'.
const EXPEDITEUR = 'Site Maison Carlier <onboarding@resend.dev>';

const SUJETS = ['Couverture', 'Charpente', 'Zinguerie', 'Rénovation / isolation', 'Autre'];

function echapper(valeur) {
  return String(valeur).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const nom = (body.nom || '').trim();
  const email = (body.email || '').trim();
  const tel = (body.tel || '').trim();
  const sujet = (body.sujet || '').trim();
  const message = (body.message || '').trim();

  // Honeypot : un humain ne voit pas ce champ. Rempli = bot.
  // On répond 200 pour ne pas lui signaler qu'il est repéré.
  if ((body.societe || '').trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  if (!nom || !email || !message || !sujet) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }
  if (nom.length > 100 || email.length > 200 || tel.length > 40 || message.length > 5000) {
    return res.status(400).json({ error: 'Contenu trop long.' });
  }
  if (sujet && !SUJETS.includes(sujet)) {
    return res.status(400).json({ error: 'Type de projet invalide.' });
  }

  const cle = process.env.RESEND_API_KEY;
  if (!cle) {
    console.error('RESEND_API_KEY absente des variables d’environnement');
    return res.status(500).json({ error: 'Service d’envoi non configuré.' });
  }

  const html = `
    <h2>Nouvelle demande de devis</h2>
    <p><strong>Nom :</strong> ${echapper(nom)}</p>
    <p><strong>Email :</strong> <a href="mailto:${echapper(email)}">${echapper(email)}</a></p>
    <p><strong>Téléphone :</strong> ${tel ? echapper(tel) : '—'}</p>
    <p><strong>Type de projet :</strong> ${echapper(sujet)}</p>
    <p><strong>Message :</strong></p>
    <p style="white-space:pre-wrap">${echapper(message)}</p>
  `;

  try {
    const reponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cle}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EXPEDITEUR,
        to: [DESTINATAIRE],
        // Répondre au mail répond directement au client.
        reply_to: email,
        subject: `Demande de devis — ${sujet} — ${nom}`,
        html,
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error('Erreur Resend', reponse.status, detail);
      return res.status(502).json({ error: 'L’envoi a échoué.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Appel Resend impossible', err);
    return res.status(502).json({ error: 'L’envoi a échoué.' });
  }
}
