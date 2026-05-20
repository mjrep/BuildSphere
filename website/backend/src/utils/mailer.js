const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Resolves mail configuration from environmental variables.
 * Prefers MAIL_ variables (e.g. Mailtrap) then SMTP_ variables (e.g. Gmail).
 */
function getMailConfig() {
  if (process.env.MAIL_HOST && process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD) {
    return {
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || '2525'),
      secure: process.env.MAIL_ENCRYPTION === 'ssl' || process.env.MAIL_PORT === '465',
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      },
      from: process.env.MAIL_FROM_ADDRESS || '"BuildSphere" <hello@buildsphere.com>'
    };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      from: process.env.SMTP_FROM || `"BuildSphere Administration" <${process.env.SMTP_USER}>`
    };
  }

  return null;
}

/**
 * Sends a welcome credentials email to newly invited/created personnel.
 * Falls back to console logging if SMTP settings are not configured.
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.name - Recipient full name
 * @param {string} params.password - Preset password
 * @param {string} params.actionLink - Overwrite password (recovery) link
 */
async function sendCredentialsEmail({ to, name, password, actionLink }) {
  const mailConfig = getMailConfig();

  const emailSubject = 'Welcome to BuildSphere - Your Credentials';
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 10px;">
      <h2 style="color: #7c74ff; text-align: center;">Welcome to BuildSphere</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your BuildSphere account has been successfully created. You can log in using the credentials below:</p>
      
      <div style="background-color: #f9f9fd; padding: 15px; border-left: 4px solid #7c74ff; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 5px 0;"><strong>Email Address:</strong> ${to}</p>
        <p style="margin: 5px 0;"><strong>Preset Password:</strong> ${password}</p>
      </div>
      
      <p>You can use these credentials to log in to both the Web and Mobile applications immediately.</p>
      <p><strong>Overwriting your Password:</strong></p>
      <p>We recommend updating your preset password. Click the link below to set a secure new password:</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${actionLink}" style="background-color: #7c74ff; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Set Your New Password</a>
      </p>
      
      <p style="font-size: 11px; color: #a0a0c0; text-align: center; margin-top: 40px; border-t: 1px solid #eee; padding-top: 20px;">
        If you did not expect this email, please contact HR.
      </p>
    </div>
  `;

  if (mailConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.secure,
        auth: mailConfig.auth
      });

      await transporter.sendMail({
        from: mailConfig.from,
        to,
        subject: emailSubject,
        html: emailHtml,
      });

      console.log(`[MAILER] Credentials email sent successfully via SMTP to ${to}`);
      return { success: true, method: 'smtp' };
    } catch (err) {
      console.error('[MAILER] SMTP failed, falling back to console log:', err);
    }
  }

  // Print email nicely to console if SMTP is not set or failed
  console.log(`
================================================================================
📧 [MAIL SIMULATION] Welcome to BuildSphere - Credentials Email
To: ${to} (${name})
--------------------------------------------------------------------------------
Your account has been successfully created.
Here are your credentials:
  - Email: ${to}
  - Password: ${password}

Please log in using the credentials above. To set a new password,
click the link below or paste it into your browser:
  ${actionLink}
================================================================================
  `);

  return { success: true, method: 'console', tempPassword: password, actionLink };
}

/**
 * Sends a password reset recovery link to the user.
 * Falls back to console logging if SMTP settings are not configured.
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.name - Recipient full name
 * @param {string} params.actionLink - Recovery link
 */
async function sendPasswordResetEmail({ to, name, actionLink }) {
  const mailConfig = getMailConfig();

  const emailSubject = 'Reset Your BuildSphere Password';
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #7c74ff; text-align: center;">BuildSphere Password Reset</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We received a request to reset the password for your BuildSphere account. Click the button below to set a new password:</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${actionLink}" style="background-color: #7c74ff; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Reset Password</a>
      </p>
      
      <p>If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
      
      <p style="font-size: 11px; color: #a0a0c0; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
        BuildSphere Administration
      </p>
    </div>
  `;

  if (mailConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.secure,
        auth: mailConfig.auth
      });

      await transporter.sendMail({
        from: mailConfig.from,
        to,
        subject: emailSubject,
        html: emailHtml,
      });

      console.log(`[MAILER] Password reset email sent successfully via SMTP to ${to}`);
      return { success: true, method: 'smtp' };
    } catch (err) {
      console.error('[MAILER] SMTP failed, falling back to console log:', err);
    }
  }

  // Print email nicely to console if SMTP is not set or failed
  console.log(`
================================================================================
📧 [MAIL SIMULATION] Reset Password Email
To: ${to} (${name})
--------------------------------------------------------------------------------
We received a request to reset your password.
To set a new password, click the link below or paste it into your browser:
  ${actionLink}
================================================================================
  `);

  return { success: true, method: 'console', actionLink };
}

module.exports = {
  sendCredentialsEmail,
  sendPasswordResetEmail
};
