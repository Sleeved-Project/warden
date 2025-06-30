import type { HttpContext } from '@adonisjs/core/http'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export default class DocsController {
  /**
   * Serve the Swagger JSON file
   */
  async swaggerJson({ response }: HttpContext) {
    const file = readFileSync(join(process.cwd(), 'resources', 'swagger.json'), 'utf-8')
    return response.header('Content-Type', 'application/json').send(file)
  }

  /**
   * Serve the Swagger UI HTML
   */
  async swaggerUi({ response }: HttpContext) {
    return response.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Warden API Docs</title>
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
          <script>
            window.onload = function() {
              SwaggerUIBundle({
                url: '/docs/json',
                dom_id: '#swagger-ui'
              });
            }
          </script>
        </body>
      </html>
    `)
  }
}
