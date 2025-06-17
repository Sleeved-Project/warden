import { inject } from '@adonisjs/core'
import mail from '@adonisjs/mail/services/main'
import edge from 'edge.js'
import User from '#models/user'
import env from '#start/env'

@inject()
export default class MailService {
  /**
   * Default email configuration
   */
  private defaultConfig = {
    fromAddress: env.get('MAIL_FROM_ADDRESS', 'no-reply@sleeved.com'),
    fromName: env.get('MAIL_FROM_NAME', 'Sleeved App'),
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(user: User, verificationCode: string): Promise<void> {
    const html = await this.renderTemplate('emails/verify_email', {
      user: this.formatUser(user),
      verificationCode,
      currentYear: new Date().getFullYear(),
    })

    await mail.send((message) => {
      // Format the from address as "Name <email>" which is accepted as a string
      const fromAddress = `${this.defaultConfig.fromName} <${this.defaultConfig.fromAddress}>`

      message
        .to(user.email)
        .from(fromAddress)
        .subject('Sleeved - Your verification code')
        .html(html)
    })
  }

  /**
   * Standard user data format for templates
   */
  private formatUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || null,
    }
  }

  /**
   * Render a template with Edge
   */
  private async renderTemplate(template: string, data: any): Promise<string> {
    try {
      return await edge.render(template, data)
    } catch (error) {
      console.error(`Error rendering email template ${template}:`, error)
      throw error
    }
  }
}
