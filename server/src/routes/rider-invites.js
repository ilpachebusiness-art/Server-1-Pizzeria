import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { saveToFile, loadFromFile } from '../models/persistence.js';
import { auditLogStore } from '../models/auditLog.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Carica inviti da file
async function loadInvites() {
  try {
    const invites = await loadFromFile('riderInvites');
    return invites || [];
  } catch (error) {
    return [];
  }
}

// Salva inviti su file
async function saveInvites(invites) {
  await saveToFile('riderInvites', invites);
}

// Genera nuovo invito
router.post('/', async (req, res) => {
  try {
    const { riderName, expiresInDays = 30 } = req.body;
    
    const inviteCode = uuidv4().substring(0, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    const invite = {
      id: uuidv4(),
      code: inviteCode,
      riderName: riderName || null,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false,
      usedAt: null,
      usedByDeviceId: null
    };
    
    const invites = await loadInvites();
    invites.push(invite);
    await saveInvites(invites);
    
    await auditLogStore.log('rider_invite_created', {
      inviteCode: inviteCode,
      riderName: riderName
    });
    
    res.status(201).json(invite);
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ottieni tutti gli inviti
router.get('/', async (req, res) => {
  try {
    const invites = await loadInvites();
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verifica e usa invito
router.post('/:code/use', async (req, res) => {
  try {
    const { code } = req.params;
    const { deviceId } = req.body;
    
    const invites = await loadInvites();
    const invite = invites.find(inv => inv.code === code.toUpperCase());
    
    if (!invite) {
      return res.status(404).json({ error: 'Codice invito non valido' });
    }
    
    if (invite.used) {
      return res.status(400).json({ error: 'Codice invito già utilizzato' });
    }
    
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    if (now > expiresAt) {
      return res.status(400).json({ error: 'Codice invito scaduto' });
    }
    
    // Marca invito come usato
    invite.used = true;
    invite.usedAt = new Date().toISOString();
    invite.usedByDeviceId = deviceId;
    
    await saveInvites(invites);
    
    await auditLogStore.log('rider_invite_used', {
      inviteCode: code,
      deviceId: deviceId
    });
    
    res.json({ 
      success: true, 
      message: 'Invito utilizzato con successo',
      riderName: invite.riderName
    });
  } catch (error) {
    console.error('Error using invite:', error);
    res.status(500).json({ error: error.message });
  }
});

// Elimina invito
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invites = await loadInvites();
    const filtered = invites.filter(inv => inv.id !== id);
    await saveInvites(filtered);
    
    await auditLogStore.log('rider_invite_deleted', {
      inviteId: id
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting invite:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download APK tramite codice invito
router.get('/:code/download', async (req, res) => {
  try {
    const { code } = req.params;
    const invites = await loadInvites();
    const invite = invites.find(inv => inv.code === code.toUpperCase());
    
    if (!invite) {
      return res.status(404).json({ error: 'Codice invito non valido' });
    }
    
    // Verifica se scaduto
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    if (now > expiresAt) {
      return res.status(400).json({ error: 'Codice invito scaduto' });
    }
    
    // Verifica se già usato (opzionale - permettere download multipli)
    // if (invite.used) {
    //   return res.status(400).json({ error: 'Codice invito già utilizzato' });
    // }
    
    // Path APK rider (assumendo che sia nella cartella apk/)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const apkPath = join(__dirname, '..', '..', '..', 'apk', 'pizzaflow-rider.apk');
    
    try {
      await fs.access(apkPath);
      res.download(apkPath, 'pizzaflow-rider.apk', (err) => {
        if (err) {
          console.error('Error downloading APK:', err);
          res.status(500).json({ error: 'Errore nel download dell\'app' });
        }
      });
    } catch (error) {
      // Se APK non esiste, reindirizza a Play Store o mostra istruzioni
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>App Non Disponibile</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui; text-align: center; padding: 2rem; background: #f3f4f6; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 2rem; border-radius: 1rem; }
            h1 { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>App Non Disponibile</h1>
            <p>L'app non è ancora disponibile per il download.</p>
            <p>Contatta l'amministratore per maggiori informazioni.</p>
          </div>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error downloading APK:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

