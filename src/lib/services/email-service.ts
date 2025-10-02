import nodemailer from 'nodemailer';
import { type Notification, type NotificationType } from './notification-service';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const config: EmailConfig = {
        host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_SERVER_USER || '',
          pass: process.env.EMAIL_SERVER_PASSWORD || ''
        }
      };

      this.transporter = nodemailer.createTransporter(config);
    }

    return this.transporter;
  }

  /**
   * Send notification email
   */
  static async sendNotificationEmail(
    userEmail: string,
    userName: string,
    notification: Notification
  ): Promise<boolean> {
    try {
      if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
        console.log('Email service not configured, skipping email notification');
        return false;
      }

      const template = this.getEmailTemplate(notification, userName);
      const transporter = this.getTransporter();

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@gameforge.dev',
        to: userEmail,
        subject: template.subject,
        text: template.text,
        html: template.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;

    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Get email template based on notification type
   */
  private static getEmailTemplate(notification: Notification, userName: string): EmailTemplate {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    switch (notification.type) {
      case 'achievement':
        return this.getAchievementTemplate(notification, userName, baseUrl);
      
      case 'mention':
        return this.getMentionTemplate(notification, userName, baseUrl);
      
      case 'event_reminder':
        return this.getEventReminderTemplate(notification, userName, baseUrl);
      
      case 'quest_available':
        return this.getQuestAvailableTemplate(notification, userName, baseUrl);
      
      case 'system':
        return this.getSystemTemplate(notification, userName, baseUrl);
      
      default:
        return this.getDefaultTemplate(notification, userName, baseUrl);
    }
  }

  /**
   * Achievement notification template
   */
  private static getAchievementTemplate(notification: Notification, userName: string, baseUrl: string): EmailTemplate {
    const subject = `🎉 ${notification.title} - Game Forge`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">${notification.message}</p>
            
            ${notification.metadata?.xpEarned ? `
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #1976d2;">
                  🌟 XP Earned: ${notification.metadata.xpEarned}
                </p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Your Progress
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Keep up the great work! 🚀
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>Game Forge - Where Developers Level Up</p>
            <p>
              <a href="${baseUrl}/settings/notifications" style="color: #667eea;">Manage Email Preferences</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Congratulations ${userName}!
      
      ${notification.message}
      
      ${notification.metadata?.xpEarned ? `XP Earned: ${notification.metadata.xpEarned}` : ''}
      
      View your progress: ${baseUrl}/dashboard
      
      Keep up the great work!
      
      ---
      Game Forge - Where Developers Level Up
      Manage your email preferences: ${baseUrl}/settings/notifications
    `;

    return { subject, html, text };
  }

  /**
   * Mention notification template
   */
  private static getMentionTemplate(notification: Notification, userName: string, baseUrl: string): EmailTemplate {
    const subject = `💬 You were mentioned - Game Forge`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #2196f3; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">💬 You were mentioned!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">${notification.message}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/community" style="background: #2196f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Discussion
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>Game Forge - Where Developers Level Up</p>
            <p>
              <a href="${baseUrl}/settings/notifications" style="color: #2196f3;">Manage Email Preferences</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Hi ${userName},
      
      ${notification.message}
      
      View the discussion: ${baseUrl}/community
      
      ---
      Game Forge - Where Developers Level Up
      Manage your email preferences: ${baseUrl}/settings/notifications
    `;

    return { subject, html, text };
  }

  /**
   * Event reminder template
   */
  private static getEventReminderTemplate(notification: Notification, userName: string, baseUrl: string): EmailTemplate {
    const subject = `⏰ Event Reminder - ${notification.metadata?.eventTitle || 'Game Forge Event'}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #ff9800; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">⏰ Event Starting Soon!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">${notification.message}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/events" style="background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Event Details
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>Game Forge - Where Developers Level Up</p>
            <p>
              <a href="${baseUrl}/settings/notifications" style="color: #ff9800;">Manage Email Preferences</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Hi ${userName},
      
      ${notification.message}
      
      View event details: ${baseUrl}/events
      
      ---
      Game Forge - Where Developers Level Up
      Manage your email preferences: ${baseUrl}/settings/notifications
    `;

    return { subject, html, text };
  }

  /**
   * Quest available template
   */
  private static getQuestAvailableTemplate(notification: Notification, userName: string, baseUrl: string): EmailTemplate {
    const subject = `🎯 New Quest Available - Game Forge`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #4caf50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎯 New Quest Available!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">${notification.message}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/dashboard" style="background: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Quests
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>Game Forge - Where Developers Level Up</p>
            <p>
              <a href="${baseUrl}/settings/notifications" style="color: #4caf50;">Manage Email Preferences</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Hi ${userName},
      
      ${notification.message}
      
      View your quests: ${baseUrl}/dashboard
      
      ---
      Game Forge - Where Developers Level Up
      Manage your email preferences: ${baseUrl}/settings/notifications
    `;

    return { subject, html, text };
  }

  /**
   * System notification template
   */
  private static getSystemTemplate(notification: Notification, userName: string, baseUrl: string): EmailTemplate {
    const subject = `📢 ${notification.title} - Game Forge`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #607d8b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">📢 ${notification.title}</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">${notification.message}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/dashboard" style="background: #607d8b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>Game Forge - Where Developers Level Up</p>
            <p>
              <a href="${baseUrl}/settings/notifications" style="color: #607d8b;">Manage Email Preferences</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Hi ${userName},
      
      ${notification.title}
      
      ${notification.message}
      
      Go to dashboard: ${baseUrl}/dashboard
      
      ---
      Game Forge - Where Developers Level Up
      Manage your email preferences: ${baseUrl}/settings/notifications
    `;

    return { subject, html, text };
  }

  /**
   * Default notification template
   */
  private static getDefaultTemplate(notification: Notification, userName: string, baseUrl: string): EmailTemplate {
    const subject = `🔔 ${notification.title} - Game Forge`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #6c757d; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🔔 ${notification.title}</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">${notification.message}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/dashboard" style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>Game Forge - Where Developers Level Up</p>
            <p>
              <a href="${baseUrl}/settings/notifications" style="color: #6c757d;">Manage Email Preferences</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Hi ${userName},
      
      ${notification.title}
      
      ${notification.message}
      
      Go to dashboard: ${baseUrl}/dashboard
      
      ---
      Game Forge - Where Developers Level Up
      Manage your email preferences: ${baseUrl}/settings/notifications
    `;

    return { subject, html, text };
  }
}