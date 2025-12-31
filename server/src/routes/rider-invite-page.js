import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadFromFile } from '../models/persistence.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pagina download app rider tramite invito
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Carica inviti
    const invites = await loadFromFile('riderInvites') || [];
    const invite = invites.find(inv => inv.code === code.toUpperCase());
    
    if (!invite) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invito Non Valido</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui; text-align: center; padding: 2rem; background: #f3f4f6; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invito Non Valido</h1>
            <p>Il codice invito non è valido o non esiste.</p>
            <p>Contatta l'amministratore per ottenere un nuovo link.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Verifica se scaduto
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    if (now > expiresAt) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invito Scaduto</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui; text-align: center; padding: 2rem; background: #f3f4f6; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏰ Invito Scaduto</h1>
            <p>Questo invito è scaduto il ${expiresAt.toLocaleDateString('it-IT')}.</p>
            <p>Contatta l'amministratore per ottenere un nuovo link.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Verifica se già usato
    if (invite.used) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invito Già Utilizzato</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui; text-align: center; padding: 2rem; background: #f3f4f6; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Invito Già Utilizzato</h1>
            <p>Questo invito è già stato utilizzato.</p>
            <p>Se hai già installato l'app, apri l'app e inserisci il tuo nome.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Mostra pagina download
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const apiUrl = process.env.API_BASE_URL || baseUrl;
    
    res.send(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Scarica App Fattorino</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .container {
            background: white;
            border-radius: 1.5rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
            padding: 2rem;
            text-align: center;
          }
          .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            font-size: 2.5rem;
          }
          h1 {
            color: #1f2937;
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
          }
          .subtitle {
            color: #6b7280;
            margin-bottom: 2rem;
            font-size: 0.95rem;
          }
          .code-box {
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            border-radius: 0.75rem;
            padding: 1rem;
            margin: 1.5rem 0;
          }
          .code {
            font-family: 'Courier New', monospace;
            font-size: 1.5rem;
            font-weight: bold;
            color: #1f2937;
            letter-spacing: 0.2em;
          }
          .download-btn {
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.75rem;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.1rem;
            margin: 1.5rem 0;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
          }
          .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
          }
          .download-btn:active {
            transform: translateY(0);
          }
          .info-box {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1.5rem 0;
            text-align: left;
          }
          .info-box p {
            color: #1e40af;
            font-size: 0.9rem;
            line-height: 1.6;
          }
          .steps {
            text-align: left;
            margin: 1.5rem 0;
          }
          .step {
            display: flex;
            align-items: start;
            margin-bottom: 1rem;
            color: #4b5563;
          }
          .step-number {
            background: #667eea;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: bold;
            margin-right: 0.75rem;
            flex-shrink: 0;
          }
          .footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.875rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🚴</div>
          <h1>Scarica App Fattorino</h1>
          <p class="subtitle">Benvenuto! Usa questo link per scaricare l'app e iniziare a ricevere ordini</p>
          
          ${invite.riderName ? `<p style="color: #059669; font-weight: 600; margin-bottom: 1rem;">Invito per: <strong>${invite.riderName}</strong></p>` : ''}
          
          <div class="code-box">
            <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem;">CODICE INVITO</div>
            <div class="code">${invite.code}</div>
          </div>
          
          <div class="info-box">
            <p><strong>📱 Come funziona:</strong></p>
            <div class="steps">
              <div class="step">
                <div class="step-number">1</div>
                <div>Scarica l'app cliccando il pulsante qui sotto</div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div>Installa l'app sul tuo telefono Android</div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div>Apri l'app e inserisci il tuo nome</div>
              </div>
              <div class="step">
                <div class="step-number">4</div>
                <div>Inizia a ricevere ordini!</div>
              </div>
            </div>
          </div>
          
          <a href="/api/rider-invites/${invite.code}/download" class="download-btn">
            📥 Scarica App Fattorino
          </a>
          
          <div class="footer">
            <p>Questo invito scade il ${new Date(invite.expiresAt).toLocaleDateString('it-IT')}</p>
            <p style="margin-top: 0.5rem; font-size: 0.75rem;">Hai bisogno di aiuto? Contatta l'amministratore</p>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error serving invite page:', error);
    res.status(500).send('Errore nel caricamento della pagina');
  }
});

export default router;

