/**
 * Email Service for CSOAI Platform
 * Handles sending emails with PDF attachments
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Email configuration from environment
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || "noreply@coai.app";

// For development/demo, use ethereal email (fake SMTP)
let transporter: Transporter | null = null;
let testAccount: { user: string; pass: string } | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  // Check if real SMTP credentials are configured
  if (SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    return transporter;
  }

  // Use ethereal for testing (creates a test account)
  if (!testAccount) {
    testAccount = await nodemailer.createTestAccount();
  }

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
  try {
    const transport = await getTransporter();

    const info = await transport.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    // If using ethereal (test account), get the preview URL
    const previewUrl = testAccount ? nodemailer.getTestMessageUrl(info) : undefined;

    console.log(`[Email] Sent to ${options.to}: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[Email] Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl as string | undefined,
    };
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return { success: false };
  }
}

/**
 * Send certificate email with PDF attachment
 */
export async function sendCertificateEmail(params: {
  to: string;
  recipientName: string;
  certificateTitle: string;
  certificateNumber: string;
  pdfBuffer: Buffer;
}): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a365d;">🎉 Congratulations, ${params.recipientName}!</h1>
      <p>You have successfully completed your certification:</p>
      <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #2d3748; margin: 0;">${params.certificateTitle}</h2>
        <p style="color: #718096; margin: 10px 0 0;">Certificate #${params.certificateNumber}</p>
      </div>
      <p>Your certificate is attached to this email as a PDF. You can also download it from your CSOAI dashboard.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="color: #718096; font-size: 12px;">
        This certificate was issued by CSOAI (Council of Safety of AI).<br/>
        Verify at: https://coai.app/verify/${params.certificateNumber}
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Your CSOAI Certificate: ${params.certificateTitle}`,
    html,
    attachments: [
      {
        filename: `CSOAI-Certificate-${params.certificateNumber}.pdf`,
        content: params.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

/**
 * Send compliance alert email
 */
export async function sendComplianceAlertEmail(params: {
  to: string;
  recipientName: string;
  alertTitle: string;
  alertMessage: string;
  severity: "low" | "medium" | "high" | "critical";
  link?: string;
}): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
  const severityColors = {
    low: "#48bb78",
    medium: "#ecc94b",
    high: "#ed8936",
    critical: "#f56565",
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${severityColors[params.severity]}; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">⚠️ Compliance Alert</h2>
      </div>
      <div style="background: #f7fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Hello ${params.recipientName},</p>
        <h3 style="color: #2d3748;">${params.alertTitle}</h3>
        <p style="color: #4a5568;">${params.alertMessage}</p>
        ${params.link ? `<a href="${params.link}" style="display: inline-block; background: #4299e1; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; margin-top: 15px;">View Details</a>` : ""}
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="color: #718096; font-size: 12px;">
        You're receiving this because you have compliance alerts enabled in your CSOAI notification settings.
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `[${params.severity.toUpperCase()}] ${params.alertTitle}`,
    html,
  });
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a365d;">Welcome to CSOAI, ${params.name}! 🚀</h1>
      <p>Thank you for joining the Council of Safety of AI. You now have access to:</p>
      <ul style="color: #4a5568; line-height: 1.8;">
        <li><strong>AI System Registration</strong> - Register and track your AI systems</li>
        <li><strong>Compliance Dashboard</strong> - Monitor compliance across frameworks</li>
        <li><strong>Training & Certification</strong> - Get certified in AI safety standards</li>
        <li><strong>33-Agent Council</strong> - Byzantine fault-tolerant AI governance</li>
      </ul>
      <a href="https://coai.app/dashboard" style="display: inline-block; background: #4299e1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px;">Go to Dashboard</a>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="color: #718096; font-size: 12px;">
        Questions? Contact us at support@coai.app
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: "Welcome to CSOAI - The Council of Safety of AI",
    html,
  });
}
