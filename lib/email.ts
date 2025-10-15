import { Resend } from "resend";
import nodemailer from "nodemailer";

// Email configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "resend"; // 'resend' or 'nodemailer'
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM || "Fellowship Platform <noreply@fellowship.com>";

// Nodemailer configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT
  ? Number.parseInt(process.env.SMTP_PORT)
  : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_SECURE = process.env.SMTP_SECURE === "true"; // true for 465, false for other ports

// Initialize email clients
let resend: Resend | null = null;
let nodemailerTransporter: nodemailer.Transporter | null = null;

if (EMAIL_PROVIDER === "resend" && RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
  console.log("[v0] Email provider: Resend");
} else if (
  EMAIL_PROVIDER === "nodemailer" &&
  SMTP_HOST &&
  SMTP_USER &&
  SMTP_PASSWORD
) {
  nodemailerTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
  console.log("[v0] Email provider: Nodemailer");
} else {
  console.warn(
    "[v0] No email provider configured. Emails will be logged to console only."
  );
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    console.log("[v0] Attempting to send email:", {
      to,
      subject,
      provider: EMAIL_PROVIDER,
    });

    if (EMAIL_PROVIDER === "resend" && resend) {
      // Send via Resend
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      });
      console.log("[v0] Email sent successfully via Resend:", result);
      return { success: true, provider: "resend", result };
    } else if (EMAIL_PROVIDER === "nodemailer" && nodemailerTransporter) {
      // Send via Nodemailer
      const result = await nodemailerTransporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      });
      console.log(
        "[v0] Email sent successfully via Nodemailer:",
        result.messageId
      );
      return { success: true, provider: "nodemailer", result };
    } else {
      // No provider configured - log to console
      console.log("[v0] Email would be sent (no provider configured):", {
        from: EMAIL_FROM,
        to,
        subject,
        htmlPreview: html.substring(0, 200) + "...",
      });
      return {
        success: false,
        provider: "none",
        message: "No email provider configured",
      };
    }
  } catch (error) {
    console.error("[v0] Error sending email:", error);
    throw error;
  }
}

// Email templates
export const emailTemplates = {
  applicationSubmitted: (
    applicantName: string,
    institutionName: string,
    applicationUrl: string
  ) => ({
    subject: `New Fellowship Application - ${applicantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Fellowship Application</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">New Fellowship Application</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${applicantName}</strong> has submitted an application to join <strong>${institutionName}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Please review the application and take appropriate action.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${applicationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Review Application
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification from the Fellowship Platform.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  applicationApproved: (
    fellowName: string,
    institutionName: string,
    dashboardUrl: string
  ) => ({
    subject: `Congratulations! Your Fellowship Application Has Been Approved`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Approved</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Application Approved!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${fellowName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Congratulations! Your application to join <strong>${institutionName}</strong> has been approved.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                You now have full access to all fellowship content, sessions, and resources. Welcome to the community!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification from the Fellowship Platform.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  applicationRejected: (fellowName: string, institutionName: string) => ({
    subject: `Update on Your Fellowship Application`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Update</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Application Update</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${fellowName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for your interest in joining <strong>${institutionName}</strong>.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              After careful consideration, we regret to inform you that we are unable to accept your application at this time.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #6b7280;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                We encourage you to continue pursuing your goals and wish you the best in your future endeavors.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification from the Fellowship Platform.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  invitation: (
    inviterName: string,
    institutionName: string,
    message: string,
    signupUrl: string
  ) => ({
    subject: `You're Invited to Join ${institutionName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fellowship Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${inviterName}</strong> has invited you to join <strong>${institutionName}</strong> on the Fellowship Platform.
            </p>
            
            ${
              message
                ? ``
                : `<div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
                <p style="margin: 0; font-size: 14px; color: #374151; font-style: italic;">
                  "${message}"
                </p>
              </div>`
            }
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Join us to access exclusive content, connect with fellow members, and participate in engaging sessions.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Apply Now
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated invitation from the Fellowship Platform.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  adminPendingApproval: (adminName: string, institutionName: string) => ({
    subject: `Your Admin Request is Pending Approval`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin Request Pending</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏳ Request Pending</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${adminName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for registering <strong>${institutionName}</strong> on the Fellowship Platform.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Your admin request is currently pending approval from our root administrator. You will receive an email notification once your request has been reviewed.
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We typically review requests within 24-48 hours. Thank you for your patience!
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification from the Fellowship Platform.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  rootAdminNewRequest: (
    adminName: string,
    adminEmail: string,
    institutionName: string,
    reviewUrl: string
  ) => ({
    subject: `New Admin Approval Request - ${institutionName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Admin Request</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔔 New Admin Request</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello Root Admin,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              A new institution admin is requesting approval to join the Fellowship Platform.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #374151;">Admin Name:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${adminName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${adminEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #374151;">Institution:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${institutionName}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Review Request
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification from the Fellowship Platform.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  adminApproved: (
    adminName: string,
    institutionName: string,
    dashboardUrl: string
  ) => ({
    subject: `🎉 Your Admin Request Has Been Approved!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin Request Approved</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Request Approved!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${adminName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Congratulations! Your admin request for <strong>${institutionName}</strong> has been approved.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                You now have full access to your admin dashboard. You can start creating cohorts, scheduling sessions, and managing your fellowship program.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Go to Admin Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification from the Fellowship Platform.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  adminRejected: (adminName: string, institutionName: string) => ({
    subject: `Update on Your Admin Request`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin Request Update</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Request Update</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${adminName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for your interest in managing <strong>${institutionName}</strong> on the Fellowship Platform.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              After careful review, we are unable to approve your admin request at this time.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #6b7280;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                If you have questions about this decision, please contact our support team.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification from the Fellowship Platform.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  sessionUpdated: (
    fellowName: string,
    sessionTitle: string,
    oldDateTime: string,
    newDateTime: string,
    meetLink: string,
    changes: string[]
  ) => ({
    subject: `Session Updated: ${sessionTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Updated</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📅 Session Updated</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${fellowName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              The session <strong>${sessionTitle}</strong> has been updated.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #374151;">What Changed:</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #6b7280;">
                ${changes.map((change) => `<li>${change}</li>`).join("")}
              </ul>
            </div>
            
            ${
              oldDateTime !== newDateTime
                ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #374151;">Previous Time:</td>
                  <td style="padding: 8px 0; color: #6b7280; text-decoration: line-through;">${oldDateTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #374151;">New Time:</td>
                  <td style="padding: 8px 0; color: #10b981; font-weight: 600;">${newDateTime}</td>
                </tr>
              </table>
            </div>
            `
                : ""
            }
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${meetLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Session Details
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification from the Fellowship Platform.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  sessionCancelled: (
    fellowName: string,
    sessionTitle: string,
    sessionDateTime: string,
    reason: string
  ) => ({
    subject: `Session Cancelled: ${sessionTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Cancelled</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">❌ Session Cancelled</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${fellowName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We regret to inform you that the session <strong>${sessionTitle}</strong> scheduled for <strong>${sessionDateTime}</strong> has been cancelled.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ef4444;">
              <h3 style="margin-top: 0; color: #374151;">Reason for Cancellation:</h3>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                ${reason}
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We apologize for any inconvenience this may cause. Please check your dashboard for upcoming sessions.
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification from the Fellowship Platform.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  contentUploaded: (
    fellowName: string,
    contentTitle: string,
    cohortName: string,
    contentLink: string,
    description: string
  ) => ({
    subject: `New Content Available: ${contentTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Content Available</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📚 New Content Available</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${fellowName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              New content has been uploaded to <strong>${cohortName}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; color: #374151;">${contentTitle}</h3>
              ${
                description
                  ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">${description}</p>`
                  : ""
              }
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${contentLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Content
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification from the Fellowship Platform.
            </p>
          </div>
        </body>
      </html>
    `,
  }),
};
