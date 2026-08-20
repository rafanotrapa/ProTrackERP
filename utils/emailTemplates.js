const fs = require('fs');
const path = require('path');

/**
 * Template HTML untuk email yang dikirim ProTrack ERP.
 *
 * Logo dikirim sebagai CID attachment (nempel di body email), bukan URL atau
 * base64 — Gmail & Outlook blokir gambar base64, sedangkan URL butuh hosting.
 * Kalau file logo nggak ada, header otomatis balik ke versi teks biar email
 * nggak nampilin ikon gambar rusak.
 */

const LOGO_CID = 'protrack-logo';
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo-protrack.png');

const hasLogo = () => fs.existsSync(LOGO_PATH);

const buildHeader = () =>
  hasLogo()
    ? `<img src="cid:${LOGO_CID}" alt="ProTrack ERP" width="160" height="116"
            style="display: block; margin: 0 auto; width: 160px; height: auto; max-width: 100%;">`
    : `<h2 style="color: #1e293b; margin: 0; font-weight: 800;">ProTrack ERP</h2>`;

const buildAttachments = () =>
  hasLogo()
    ? [{ filename: 'logo-protrack.png', path: LOGO_PATH, cid: LOGO_CID }]
    : [];

const resetPasswordTemplate = ({ username, resetUrl, expireMinutes = 10 }) => ({
  subject: '🔐 Reset your ProTrack password',
  attachments: buildAttachments(),
  text:
    `Hi ${username},\n\n` +
    `We received a request to reset the password for your ProTrack account.\n` +
    `Open the link below to continue:\n\n${resetUrl}\n\n` +
    `This link expires in ${expireMinutes} minutes.\n` +
    `If you did not request a password reset, you can safely ignore this email.`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        ${buildHeader()}
      </div>

      <h3 style="color: #1e293b;">Hi ${username},</h3>
      <p style="color: #475569; line-height: 1.6;">
        We received a request to reset the password for your ProTrack account.
        Click the button below to continue:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="background-color: #3b4aa0; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 12px; font-weight: bold;
                  display: inline-block;">
          🔐 Reset my password
        </a>
      </div>

      <p style="color: #475569; font-size: 12px; margin-top: 20px;">
        This link expires in <strong>${expireMinutes} minutes</strong>.
        If you did not request a password reset, you can safely ignore this email.
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
      <p style="color: #94a3b8; font-size: 10px; text-align: center;">
        &copy; ${new Date().getFullYear()} ProTrack ERP
      </p>
    </div>
  `
});

module.exports = { resetPasswordTemplate, LOGO_PATH };
