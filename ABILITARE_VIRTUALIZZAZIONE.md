# Come abilitare la virtualizzazione per WSA

## Stato attuale
✅ Virtualizzazione abilitata nel BIOS  
❌ Hyper-V non attivo

## Soluzione 1: Abilitare Hyper-V tramite PowerShell (come Amministratore)

1. **Apri PowerShell come Amministratore:**
   - Clicca destro sul menu Start
   - Seleziona "Windows PowerShell (Amministratore)" o "Terminale (Amministratore)"

2. **Esegui questi comandi:**

```powershell
# Abilita Hyper-V
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All

# Abilita la piattaforma di virtualizzazione
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All

# Abilita Hypervisor Platform
Enable-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform -All
```

3. **Riavvia il computer** quando richiesto

## Soluzione 2: Abilitare tramite Pannello di Controllo

1. Apri **Pannello di Controllo** > **Programmi** > **Attiva o disattiva funzionalità di Windows**
2. Seleziona:
   - ☑ **Hyper-V**
   - ☑ **Piattaforma Hyper-V**
   - ☑ **Piattaforma di virtualizzazione**
   - ☑ **Windows Hypervisor Platform**
3. Clicca **OK** e riavvia il computer

## Soluzione 3: Verificare nel BIOS/UEFI

Se la virtualizzazione non è abilitata nel BIOS:

1. **Riavvia il computer** e entra nel BIOS/UEFI (solitamente premendo F2, F10, F12, Del o Esc durante l'avvio)
2. Cerca le opzioni:
   - **Intel**: "Intel Virtualization Technology" o "Intel VT-x"
   - **AMD**: "AMD-V" o "SVM Mode"
3. **Abilita** l'opzione
4. **Salva** e **esci** dal BIOS

## Dopo aver abilitato Hyper-V

1. Riavvia il computer
2. Avvia WSA dal menu Start
3. Attendi che WSA si avvii completamente
4. Esegui lo script per installare l'APK:

```powershell
.\install-apk-wsa.ps1
```

## Verifica che Hyper-V sia attivo

Dopo il riavvio, esegui:

```powershell
Get-ComputerInfo | Select-Object HyperVisorPresent
```

Dovrebbe mostrare: `HyperVisorPresent : True`

## Note importanti

- **Hyper-V richiede Windows 10 Pro/Enterprise/Education o Windows 11 Pro/Enterprise/Education**
- Se hai Windows Home, potresti dover usare un'alternativa come **BlueStacks** o **Android Emulator**
- Alcuni antivirus possono interferire con Hyper-V

## Alternativa: Usare un emulatore Android

Se non puoi abilitare Hyper-V, puoi usare:
- **BlueStacks** (https://www.bluestacks.com/)
- **Android Studio Emulator** (già installato con Android Studio)
- **Genymotion** (https://www.genymotion.com/)




