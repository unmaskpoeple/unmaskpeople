import nodemailer from "nodemailer";
import { SettingsService } from "./settings.service";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  activationUrl?: string;
  error?: string;
}

export class EmailService {
  /**
   * Create nodemailer transporter from system settings or env
   */
  private static async getTransporter() {
    const settings = await SettingsService.getAllSettings();

    const host = settings.smtp_host || process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(settings.smtp_port || process.env.SMTP_PORT || 587);
    const secure = settings.smtp_secure || process.env.SMTP_SECURE === "true" || port === 465;
    const user = settings.smtp_user || process.env.SMTP_USER || "";
    const pass = settings.smtp_pass || process.env.SMTP_PASS || "";

    const isEnabled = settings.smtp_enabled && Boolean(user && pass);

    if (!isEnabled) {
      return { transporter: null, settings, isConfigured: false };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return { transporter, settings, isConfigured: true };
  }

  /**
   * Send Account Activation Email with verification link
   */
  static async sendVerificationEmail(params: {
    email: string;
    name: string;
    token: string;
  }): Promise<SendEmailResult> {
    const { email, name, token } = params;
    const settings = await SettingsService.getAllSettings();

    const baseUrl = (settings.app_url || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const activationUrl = `${baseUrl}/verify-email?token=${token}`;

    const { transporter, isConfigured } = await this.getTransporter();

    const fromName = settings.smtp_from_name || "NumVerge OTP Security";
    const fromEmail = settings.smtp_from_email || "no-reply@numverge.com";

    // HTML Email Template with Cyber Dark Theme
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activate Your NumVerge Account</title>
  <style>
    body { margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; }
    .container { max-width: 600px; margin: 40px auto; background-color: #0b0f19; border: 1px solid #1f2937; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 40px 32px; text-align: center; border-bottom: 1px solid #1f2937; }
    .logo-badge { display: inline-block; padding: 12px 24px; border-radius: 16px; background: linear-gradient(135deg, #06b6d4, #6366f1, #d946ef); color: #ffffff; font-weight: 900; font-size: 20px; letter-spacing: -0.5px; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4); margin-bottom: 16px; }
    .title { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0; }
    .content { padding: 40px 32px; }
    .greeting { font-size: 16px; color: #e2e8f0; margin-bottom: 16px; font-weight: 600; }
    .message { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
    .bonus-box { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 16px 20px; margin-bottom: 30px; text-align: center; }
    .bonus-title { color: #10b981; font-weight: 800; font-size: 15px; margin-bottom: 4px; }
    .bonus-desc { color: #6ee7b7; font-size: 12px; margin: 0; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%); color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 12px 28px -6px rgba(59, 130, 246, 0.5); }
    .fallback-link { background: #030712; border: 1px solid #1e293b; border-radius: 12px; padding: 14px; word-break: break-all; font-family: monospace; font-size: 12px; color: #38bdf8; margin: 20px 0; }
    .notice { font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 30px; }
    .footer { background: #030712; padding: 24px 32px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1f2937; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">⚡ NumVerge OTP</div>
      <h1 class="title">Verify Your Email Address</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${name || "Subscriber"},</p>
      <p class="message">
        Thank you for joining NumVerge Virtual Number & SMS Platform! To activate your account and secure your prepaid wallet, please confirm your email address by clicking the button below:
      </p>

      <div class="bonus-box">
        <div class="bonus-title">🎁 ₹15.00 Instant Free Credit Waiting</div>
        <p class="bonus-desc">Your promotional ₹15.00 welcome balance will be ready immediately upon account verification.</p>
      </div>

      <div class="btn-container">
        <a href="${activationUrl}" class="btn" target="_blank">Activate My Account</a>
      </div>

      <p class="message" style="margin-bottom: 8px; font-size: 12px;">Or copy and paste this verification link into your browser:</p>
      <div class="fallback-link">
        <a href="${activationUrl}" style="color: #38bdf8; text-decoration: none;">${activationUrl}</a>
      </div>

      <div class="notice">
        <strong>Security Notice:</strong> This activation link is strictly valid for 24 hours. If you did not sign up for a NumVerge account, please ignore this email or contact support.
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">© 2026 NumVerge OTP. All rights reserved.</p>
      <p style="margin: 0;">Automated cryptographic notification. Do not reply to this address.</p>
    </div>
  </div>
</body>
</html>
`;

    const textContent = `
Hi ${name || "Subscriber"},

Welcome to NumVerge OTP! Please verify your email address to activate your account:

${activationUrl}

This activation link will expire in 24 hours.

If you did not register for an account, please ignore this email.

© 2026 NumVerge OTP
`;

    if (isConfigured && transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: email,
          subject: "⚡ Activate your NumVerge OTP Account",
          text: textContent,
          html: htmlContent,
        });

        console.log(`[EmailService] Activation email dispatched to ${email}: ${info.messageId}`);
        return {
          success: true,
          messageId: info.messageId,
          activationUrl,
        };
      } catch (err: any) {
        console.error(`[EmailService] Failed to send email via SMTP:`, err.message);
        // Fall back to simulation so user flow is never blocked
        return {
          success: true,
          simulated: true,
          activationUrl,
          error: `SMTP delivery failed (${err.message}). Activation link generated in sandbox mode.`,
        };
      }
    } else {
      // SMTP not configured yet: log activation link for testing
      console.log(`\n======================================================`);
      console.log(`⚡ [NUMVERGE OTP EMAIL SIMULATOR] Activation Email`);
      console.log(`To: ${email} (${name})`);
      console.log(`Activation Link: ${activationUrl}`);
      console.log(`Token: ${token}`);
      console.log(`======================================================\n`);

      return {
        success: true,
        simulated: true,
        activationUrl,
      };
    }
  }

  /**
   * Test SMTP Connection and optionally send a test email
   */
  static async testConnection(targetEmail?: string): Promise<{ success: boolean; message: string }> {
    const { transporter, isConfigured, settings } = await this.getTransporter();

    if (!isConfigured || !transporter) {
      return {
        success: false,
        message: "SMTP is not fully configured. Please provide SMTP Host, Port, Username, and Password.",
      };
    }

    try {
      await transporter.verify();

      if (targetEmail) {
        await transporter.sendMail({
          from: `"${settings.smtp_from_name || "NumVerge OTP"}" <${settings.smtp_from_email || "no-reply@numverge.com"}>`,
          to: targetEmail,
          subject: "NumVerge OTP SMTP Test Message",
          text: "Congratulations! Your NumVerge OTP SMTP mail server is configured properly and successfully sending emails.",
          html: `
            <div style="font-family: sans-serif; background: #0f172a; color: #fff; padding: 30px; border-radius: 16px;">
              <h2 style="color: #10b981;">SMTP Connection Successful!</h2>
              <p>Your mail server settings in NumVerge OTP are functioning correctly.</p>
              <p style="font-size: 12px; color: #94a3b8;">Sent at: ${new Date().toISOString()}</p>
            </div>
          `,
        });
      }

      return {
        success: true,
        message: "SMTP connection verified successfully! Test email dispatched.",
      };
    } catch (err: any) {
      return {
        success: false,
        message: `SMTP Connection failed: ${err.message}`,
      };
    }
  }
}
