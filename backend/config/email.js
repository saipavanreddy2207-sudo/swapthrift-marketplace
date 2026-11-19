import nodemailer from "nodemailer";

let transporter = null;
let initializationAttempted = false;

/**
 * Reads SMTP settings lazily so dotenv has already populated process.env.
 */
function getTransporter() {
  if (initializationAttempted) return transporter;
  initializationAttempted = true;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;

  const portNumber = Number(port);
  transporter = nodemailer.createTransport({
    host,
    port: portNumber,
    secure: portNumber === 465,
    auth: { user, pass },
  });
  return transporter;
}

export function isEmailConfigured() {
  return getTransporter() !== null;
}

/**
 * Sends an email. In development, an unconfigured SMTP server only logs a
 * warning instead of throwing, so local registration still works.
 */
export async function sendEmail({ to, subject, html, text }) {
  const mailer = getTransporter();
  if (!mailer) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[email] SMTP nicht konfiguriert. E-Mail an ${to} entfällt: ${subject}`);
    }
    return { skipped: true };
  }

  const from = process.env.SMTP_FROM || `"SwapThrift" <${process.env.SMTP_USER}>`;
  return mailer.sendMail({ from, to, subject, html, text });
}

export default { sendEmail, isEmailConfigured };
