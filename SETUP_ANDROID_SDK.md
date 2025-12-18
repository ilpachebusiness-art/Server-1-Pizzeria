# Setup Android SDK

## Passi da seguire

Android Studio è stato installato, ma l'SDK deve essere inizializzato.

### 1. Avvia Android Studio

1. Apri Android Studio dal menu Start
2. Alla prima apertura, segui la procedura guidata di setup
3. Accetta i termini e condizioni
4. Scegli "Standard" installation type
5. Lascia che Android Studio scarichi e installi l'SDK (questo può richiedere diversi minuti)

### 2. Verifica l'installazione dell'SDK

Dopo che Android Studio ha completato il setup, l'SDK dovrebbe essere disponibile in:
```
C:\Users\Utente\AppData\Local\Android\Sdk
```

### 3. Genera l'APK

Una volta che l'SDK è installato, puoi generare l'APK eseguendo:

```powershell
.\build-apk.ps1
```

Oppure manualmente:

```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

L'APK sarà disponibile in: `android\app\build\outputs\apk\debug\app-debug.apk`

## Alternativa: Solo Command Line Tools

Se preferisci non installare Android Studio completo, puoi installare solo le Android SDK Command Line Tools, ma richiede configurazione manuale più complessa.




