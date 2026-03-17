const nodemailer = require('nodemailer');

const hasMailConfig = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM
  );

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  if (!hasMailConfig()) {
    throw new Error('Missing SMTP configuration for email delivery');
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedTransporter;
};

const buildResetUrl = (token) => {
  const baseUrl = process.env.PASSWORD_RESET_URL_BASE;
  if (!baseUrl) {
    return null;
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
};

const sendPasswordResetEmail = async ({ to, resetToken, expiresAt }) => {
  const transporter = getTransporter();
  const resetUrl = buildResetUrl(resetToken);
  const expiryText = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(expiresAt);

  const textLines = [
    'Bonjour,',
    '',
    'Une demande de reinitialisation de mot de passe a ete effectuee pour votre compte FinanceME.',
    `Token de reinitialisation: ${resetToken}`,
    `Expiration: ${expiryText}`,
  ];

  if (resetUrl) {
    textLines.push(`Lien de reinitialisation: ${resetUrl}`);
  }

  textLines.push('', "Si vous n'etes pas a l'origine de cette demande, ignorez ce message.");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
      <h2>Reinitialisation du mot de passe FinanceME</h2>
      <p>Une demande de reinitialisation de mot de passe a ete effectuee pour votre compte.</p>
      <p><strong>Token:</strong> ${resetToken}</p>
      <p><strong>Expiration:</strong> ${expiryText}</p>
      ${resetUrl ? `<p><a href="${resetUrl}">Ouvrir le lien de reinitialisation</a></p>` : ''}
      <p>Si vous n'etes pas a l'origine de cette demande, ignorez ce message.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'FinanceME - Reinitialisation du mot de passe',
    text: textLines.join('\n'),
    html,
  });
};

const resetEmailServiceCache = () => {
  cachedTransporter = null;
};

module.exports = {
  hasMailConfig,
  sendPasswordResetEmail,
  resetEmailServiceCache,
};
