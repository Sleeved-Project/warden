import edge from 'edge.js'
import { Message } from '@adonisjs/mail'

/**
 * Configures the Edge template engine for rendering email templates.
 */
Message.templateEngine = {
  async render(templatePath, data) {
    return edge.render(templatePath, data)
  },
}
