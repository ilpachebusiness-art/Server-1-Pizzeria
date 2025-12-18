# Come generare l'APK

## Prerequisiti

Per generare l'APK Android, è necessario installare:

1. **Java JDK** (versione 17 o superiore) ✅ Installato
   - Scarica da: https://adoptium.net/ o https://www.oracle.com/java/technologies/downloads/
   - Assicurati di impostare la variabile d'ambiente `JAVA_HOME`

2. **Android SDK** ✅ Android Studio installato
   - Android Studio è stato installato
   - **IMPORTANTE**: Avvia Android Studio almeno una volta per scaricare e configurare l'SDK
   - L'SDK verrà scaricato automaticamente al primo avvio

## Metodo 1: Usando Gradle (da terminale)

Dopo aver installato Java e configurato `JAVA_HOME`:

```bash
# Assicurati di aver costruito l'app web
npm run build

# Sincronizza con Capacitor
npx cap sync android

# Genera l'APK debug
cd android
.\gradlew.bat assembleDebug

# L'APK sarà disponibile in:
# android/app/build/outputs/apk/debug/app-debug.apk
```

## Metodo 2: Usando Android Studio (consigliato)

1. Apri Android Studio
2. Seleziona "Open an Existing Project"
3. Naviga alla cartella `android` del progetto
4. Attendi che Gradle sincronizzi il progetto
5. Vai su **Build > Build Bundle(s) / APK(s) > Build APK(s)**
6. L'APK sarà generato in `android/app/build/outputs/apk/debug/`

## Metodo 3: APK Release (per pubblicazione)

Per generare un APK firmato per la pubblicazione:

```bash
cd android
.\gradlew.bat assembleRelease
```

**Nota:** Per l'APK release è necessario configurare la firma dell'app in `android/app/build.gradle`.

## Posizione dell'APK

Dopo la build, l'APK si trova in:
- **Debug:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release:** `android/app/build/outputs/apk/release/app-release.apk`


