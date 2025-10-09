// Email notification utility using Resend
// To use this, add RESEND_API_KEY to your environment variables

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  // Check if Resend API key is configured
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[v0] RESEND_API_KEY not configured. Email not sent:", {
      to,
      subject,
    });
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from:
          process.env.EMAIL_FROM ||
          "Fellowship Platform <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[v0] Failed to send email:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }

    console.log("[v0] Email sent successfully:", { to, subject, id: data.id });
    return { success: true, id: data.id };
  } catch (error) {
    console.error("[v0] Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

// Email templates
export const emailTemplates = {
  applicationSubmitted: (
    applicantName: string,
    institutionName: string,
    applicationUrl: string
  ) => ({
    subject: `New Fellowship Application from ${applicantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Fellowship Application</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${applicantName}</strong> has submitted an application to join <strong>${institutionName}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                Please review the application and take appropriate action.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${applicationUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Review Application
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Best regards,<br>
              Fellowship Platform Team
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  applicationApproved: (
    applicantName: string,
    institutionName: string,
    dashboardUrl: string
  ) => ({
    subject: `Congratulations! Your Fellowship Application has been Approved`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Application Approved!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${applicantName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Congratulations! Your application to join <strong>${institutionName}</strong> has been approved.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                You now have access to all fellowship content, sessions, and resources. We're excited to have you as part of our community!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Access Your Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Welcome aboard!<br>
              Fellowship Platform Team
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  applicationRejected: (applicantName: string, institutionName: string) => ({
    subject: `Update on Your Fellowship Application`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${applicantName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for your interest in joining <strong>${institutionName}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                After careful consideration, we regret to inform you that we are unable to accept your application at this time. We appreciate the time and effort you put into your application.
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We encourage you to apply again in the future as new opportunities become available.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Best wishes,<br>
              Fellowship Platform Team
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  fellowshipInvitation: (
    inviterName: string,
    institutionName: string,
    inviteUrl: string
  ) => ({
    subject: `You've been invited to join ${institutionName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">You're Invited!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${inviterName}</strong> has invited you to apply to <strong>${institutionName}</strong> fellowship program.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                This is an exclusive opportunity to join a community of learners and professionals dedicated to growth and excellence.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Fellowship & Apply
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Best regards,<br>
              Fellowship Platform Team
            </p>
          </div>
        </body>
      </html>
    `,
  }),
};
