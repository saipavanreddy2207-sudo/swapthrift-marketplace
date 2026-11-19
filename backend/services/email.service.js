import { sendEmail } from "../config/email.js";
import { escapeHtml } from "../utils/sanitize.js";

function clientUrl() {
  return (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
}

async function deliver(options) {
  try {
    return await sendEmail(options);
  } catch (error) {
    console.warn(`[email] Versand fehlgeschlagen: ${error.message}`);
    return { skipped: true, error: error.message };
  }
}

function layout(content) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h1 style="color:#0f766e">SwapThrift</h1>
      ${content}
      <p style="font-size:12px;color:#6b7280;margin-top:32px">
        Diese Nachricht wurde automatisch erstellt. Bitte antworte nicht direkt darauf.
      </p>
    </div>`;
}

export async function sendVerificationEmail(user, token) {
  const link = `${clientUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return deliver({
    to: user.email,
    subject: "SwapThrift – E-Mail-Adresse bestätigen",
    text: `Hallo ${user.firstName}, bitte bestätige deine E-Mail-Adresse: ${link}`,
    html: layout(`
      <p>Hallo ${escapeHtml(user.firstName)},</p>
      <p>willkommen bei SwapThrift! Bitte bestätige deine E-Mail-Adresse.</p>
      <p><a href="${link}" style="background:#0f766e;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block">E-Mail bestätigen</a></p>
      <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>${escapeHtml(link)}</p>
      <p>Der Link ist 24 Stunden gültig.</p>
    `),
  });
}

export async function sendPasswordResetEmail(user, token) {
  const link = `${clientUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return deliver({
    to: user.email,
    subject: "SwapThrift – Passwort zurücksetzen",
    text: `Hallo ${user.firstName}, nutze diesen Link zum Zurücksetzen deines Passworts: ${link}`,
    html: layout(`
      <p>Hallo ${escapeHtml(user.firstName)},</p>
      <p>wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten.</p>
      <p><a href="${link}" style="background:#0f766e;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block">Passwort zurücksetzen</a></p>
      <p>Falls du das nicht warst, kannst du diese Nachricht ignorieren. Der Link ist 1 Stunde gültig.</p>
    `),
  });
}

export async function sendWelcomeEmail(user) {
  return deliver({
    to: user.email,
    subject: "Willkommen bei SwapThrift",
    text: `Hallo ${user.firstName}, dein Konto ist jetzt verifiziert. Viel Spaß beim Tauschen und Verschenken!`,
    html: layout(`
      <p>Hallo ${escapeHtml(user.firstName)},</p>
      <p>deine E-Mail-Adresse ist bestätigt. Du kannst jetzt Angebote erstellen und Schönes weitergeben.</p>
      <p>Viel Spaß bei SwapThrift!</p>
    `),
  });
}

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
