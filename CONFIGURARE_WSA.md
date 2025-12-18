# Come configurare WSA per installare APK

## Errore comune
```
The app failed to connect WSA to ADB because the target machine actively refused it 
with error code 10061 - Connection failed. This issue may have been caused by 
Developer Mode not being turned on in the WSA system settings.
```

## Soluzione: Abilitare Developer Mode in WSA

### Passo 1: Avvia Windows Subsystem for Android

1. Apri il **Menu Start**
2. Cerca **"Windows Subsystem for Android"** o **"WSA"**
3. Avvia l'applicazione
4. **Attendi** che WSA si avvii completamente (può richiedere 30-60 secondi)

### Passo 2: Abilita Developer Mode

1. **Dentro WSA**, apri le **Impostazioni** (icona ingranaggio)
2. Scorri fino a trovare **"Developer Mode"** o **"Modalità sviluppatore"**
3. **Attiva** l'interruttore per Developer Mode
4. Potrebbe essere richiesto di riavviare WSA

### Passo 3: Verifica la porta ADB

Dopo aver abilitato Developer Mode, WSA mostrerà una porta ADB (solitamente **58526**).

### Passo 4: Installa l'APK

Una volta abilitata la Developer Mode, esegui:

```powershell
.\install-apk-wsa.ps1
```

## Metodo alternativo: Configurazione manuale ADB

Se lo script automatico non funziona:

1. **Trova la porta ADB** nelle impostazioni WSA (solitamente 58526)
2. **Apri PowerShell** e esegui:

```powershell
# Trova ADB
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    $adbPath = "$env:LOCALAPPDATA\Microsoft\WindowsApps\platform-tools\adb.exe"
}

# Connetti a WSA (sostituisci 58526 con la tua porta se diversa)
& $adbPath connect 127.0.0.1:58526

# Verifica connessione
& $adbPath devices

# Installa APK
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
& $adbPath install -r $apkPath
```

## Troubleshooting

### WSA non si avvia
- Verifica che Hyper-V sia abilitato
- Riavvia il computer
- Reinstalla WSA dal Microsoft Store

### ADB non trova dispositivi
- Assicurati che WSA sia completamente avviato
- Verifica che Developer Mode sia attivo
- Controlla che la porta ADB sia corretta nelle impostazioni WSA

### Connessione rifiutata (errore 10061)
- **Developer Mode NON è abilitato** - Segui il Passo 2 sopra
- WSA non è completamente avviato - Attendi qualche secondo e riprova
- Firewall potrebbe bloccare la connessione - Aggiungi eccezione per ADB

## Verifica rapida

Esegui questo comando per verificare lo stato:

```powershell
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    $adbPath = "$env:LOCALAPPDATA\Microsoft\WindowsApps\platform-tools\adb.exe"
}

& $adbPath devices
```

Se vedi `127.0.0.1:58526    device`, la connessione è OK!



