export function renderErrorPage(): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Erro Interno - Precifika</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
          .container { text-align: center; padding: 2rem; max-width: 400px; }
          h1 { font-size: 1.5rem; margin-bottom: 1rem; }
          p { color: #6b7280; margin-bottom: 2rem; }
          .button { background: #000; color: #fff; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Internal Server Error</h1>
          <p>Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.</p>
          <a href="/" class="button">Voltar para a Home</a>
        </div>
      </body>
    </html>
  `;
}
