// utils/sendEmail.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (toEmail, displayName) => {
  try {
    await resend.emails.send({
      from: 'JamBlog <onboarding@resend.dev>', // Replace with your custom domain once verified
      to: toEmail,
      subject: 'Welcome to JamBlog!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h1 style="color: #d97706; font-size: 24px; margin-bottom: 16px;">Welcome to JamBlog!</h1>
          
          <p style="font-size: 15px; line-height: 1.6;">Hi <strong>${displayName || 'Writer'}</strong>,</p>
          
          <p style="font-size: 15px; line-height: 1.6;">
            Thank you for creating an account! We're thrilled to have you here reading, writing, and engaging with our community.
          </p>

          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; margin: 20px 0; border-radius: 4px;">
            <p style="font-size: 13px; line-height: 1.5; color: #92400e; margin: 0;">
              <strong>A quick note:</strong> JamBlog is currently in an <em>experimental phase</em> and is maintained by a very small team. Things are growing fast, and we are constantly adding updates!
            </p>
          </div>

          <p style="font-size: 14px; line-height: 1.6;">
            If you run into any bugs, have questions, or want to share feedback, please feel free to reach out directly to our team at 
            <a href="mailto:jahwebproductions+jamblogmedia@gmail.com" style="color: #d97706; font-weight: 600; text-decoration: underline;">
              jahwebproductions+jamblogmedia@gmail.com
            </a>.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

          <p style="font-size: 13px; color: #64748b; margin: 0;">
            Happy writing,<br/>
            <strong>The JamBlog Team</strong>
          </p>
        </div>
      `
    });
    console.log(`Welcome email successfully sent to ${toEmail}`);
  } catch (error) {
    // Log the error without blocking the user's sign-up process
    console.error('Failed to send welcome email:', error);
  }
};