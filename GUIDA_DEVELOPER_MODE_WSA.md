# Guida passo-passo: Abilitare Developer Mode in WSA

## Metodo 1: Tramite l'interfaccia WSA (consigliato)

### Passo 1: Avvia Windows Subsystem for Android

1. **Premi il tasto Windows** sulla tastiera (o clicca sul menu Start)
2. **Digita**: `Windows Subsystem for Android` oppure `WSA`
3. **Clicca** sull'app "Windows Subsystem for Android"
4. **Attendi** che l'app si apra completamente (può richiedere 30-60 secondi)

### Passo 2: Accedi alle Impostazioni

Una volta che WSA è aperto, vedrai l'interfaccia principale. Cerca:

- **Icona ingranaggio** (⚙️) nell'angolo superiore destro, oppure
- **Menu a tre linee** (☰) nell'angolo superiore sinistro, oppure
- **Pulsante "Settings"** o **"Impostazioni"**

Clicca su uno di questi per aprire le impostazioni.

### Passo 3: Trova Developer Mode

Nelle impostazioni, scorri verso il basso fino a trovare:

- **"Developer Mode"** (in inglese)
- **"Modalità sviluppatore"** (in italiano)
- **"Developer options"** o **"Opzioni sviluppatore"**

Potrebbe essere nella sezione "Advanced" o "Avanzate".

### Passo 4: Abilita Developer Mode

1. **Trova l'interruttore** accanto a "Developer Mode"
2. **Clicca sull'interruttore** per attivarlo (dovrebbe diventare blu/verde)
3. Potrebbe apparire un **avviso di sicurezza** - clicca "OK" o "Consenti"
4. Potrebbe essere richiesto di **riavviare WSA**

### Passo 5: Verifica la porta ADB

Dopo aver abilitato Developer Mode, dovresti vedere:

- Un numero di porta (solitamente **58526**)
- Un messaggio che dice "ADB debugging enabled" o simile
- Un indirizzo IP come `127.0.0.1:58526`

**Annota questo numero** - ti servirà per la connessione ADB.

## Metodo 2: Tramite PowerShell (alternativo)

Se non riesci a trovare Developer Mode nell'interfaccia, puoi provare ad abilitarlo tramite PowerShell:

```powershell
# Avvia WSA
Start-Process "shell:AppsFolder\MicrosoftCorporationII.WindowsSubsystemForAndroid_8wekyb3d8bbwe!App"

# Attendi che WSA si avvii
Start-Sleep -Seconds 15

# Prova a connettere ADB (potrebbe non funzionare se Developer Mode non è abilitato)
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adbPath connect 127.0.0.1:58526
```

## Metodo 3: Verifica tramite Registro di Windows (avanzato)

⚠️ **ATTENZIONE**: Modificare il registro può danneggiare il sistema. Procedi con cautela.

1. Premi **Win + R**
2. Digita `regedit` e premi Invio
3. Naviga a: `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock`
4. Cerca la chiave `EnableDevelopmentMode`
5. Se non esiste, creala come DWORD con valore `1`

## Troubleshooting

### Non trovo Developer Mode nelle impostazioni

1. **Assicurati che WSA sia completamente avviato** - Attendi almeno 1 minuto dopo l'apertura
2. **Riavvia WSA** - Chiudi completamente e riapri
3. **Aggiorna WSA** - Vai su Microsoft Store e verifica aggiornamenti
4. **Reinstalla WSA** - Disinstalla e reinstalla dal Microsoft Store

### Developer Mode è grigio/non cliccabile

- Verifica che **Hyper-V sia abilitato** (vedi `ABILITARE_VIRTUALIZZAZIONE.md`)
- Riavvia il computer
- Verifica che WSA sia aggiornato all'ultima versione

### Dopo aver abilitato Developer Mode, ADB non si connette

1. **Riavvia WSA** completamente
2. **Verifica la porta** - Potrebbe essere diversa da 58526 (controlla nelle impostazioni WSA)
3. **Disconnetti e riconnetti**:
   ```powershell
   $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
   & $adbPath disconnect
   & $adbPath connect 127.0.0.1:58526
   & $adbPath devices
   ```

## Verifica che Developer Mode sia attivo

Dopo aver abilitato Developer Mode, esegui questo comando:

```powershell
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adbPath connect 127.0.0.1:58526
& $adbPath devices
```

Se vedi `127.0.0.1:58526    device`, Developer Mode è attivo e funzionante! ✅

## Screenshot di riferimento

L'interfaccia WSA può variare in base alla versione, ma generalmente:

```
┌─────────────────────────────────┐
│  Windows Subsystem for Android  │
├─────────────────────────────────┤
│                                 │
│  [Impostazioni] [⚙️]           │
│                                 │
│  Developer Mode                 │
│  [  ]  ← Interruttore OFF       │
│  [██]  ← Interruttore ON        │
│                                 │
│  ADB: 127.0.0.1:58526          │
└─────────────────────────────────┘
```

## Prossimi passi

Una volta che Developer Mode è abilitato:

1. Esegui: `.\install-apk-wsa.ps1`
2. Lo script installerà automaticamente l'APK su WSA
3. Troverai l'app nel menu Start o nella schermata WSA



