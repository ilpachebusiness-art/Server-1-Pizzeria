# 📱 Build APK con Server Cloud - Guida Completa

## ✅ Sì, Funzionerà!

Dopo aver installato gli APK su tre dispositivi diversi:
- ✅ Le app si connetteranno al server cloud
- ✅ Gli aggiornamenti live funzioneranno via WebSocket
- ✅ Le modifiche su un dispositivo si vedranno sugli altri in tempo reale
- ✅ Non serve che il tuo computer sia acceso

---

## 🔧 Configurazione Pre-Build

### IMPORTANTE: Prima di Buildare gli APK

Devi assicurarti che le app usino l'URL del server cloud invece di localhost.

### Opzione 1: Variabile d'Ambiente (Consigliato)

1. **Crea/Modifica file `.env` nella root:**
   ```env
   VITE_API_URL=https://server1pizzeria.onrender.com/api
   ```

2. **Builda le app:**
   ```powershell
   npm run build
   ```

3. **Le variabili d'ambiente saranno incluse nel build**

### Opzione 2: Modifica Diretta (Se Opzione 1 non funziona)

Se le variabili d'ambiente non vengono incluse nel build APK, devi modificare i file direttamente prima di buildare.

---

## 📋 Processo Build APK

### 1. Assicurati che .env sia Configurato

```env
VITE_API_URL=https://server1pizzeria.onrender.com/api
```

### 2. Builda le App

```powershell
# Builda tutte le app
npm run build
```

### 3. Sincronizza con Capacitor

```powershell
npx cap sync android
```

### 4. Genera APK

**Metodo A: Android Studio (Consigliato)**
1. Apri Android Studio
2. Apri progetto: `android/`
3. Build > Build Bundle(s) / APK(s) > Build APK(s)

**Metodo B: Da Terminale**
```powershell
cd android
.\gradlew.bat assembleDebug
```

### 5. APK Generati

Troverai gli APK in:
- `android/app/build/outputs/apk/debug/app-debug.apk`

---

## ⚠️ Problema: URL Hardcoded

**ATTENZIONE:** Alcuni componenti hanno ancora `localhost:3001` hardcoded.

### Soluzione: Aggiornare i Componenti

Devo aggiornare i componenti per usare la configurazione centralizzata. Vuoi che lo faccia ora?

---

## ✅ Verifica Post-Installazione

Dopo aver installato gli APK sui dispositivi:

1. **Apri l'app**
2. **Apri la console (se possibile) o usa un debugger**
3. **Verifica che le richieste vadano a:**
   - `https://server1pizzeria.onrender.com/api/...`
   - NON `http://localhost:3001/api/...`

4. **Testa WebSocket:**
   - Fai un'azione su un dispositivo
   - Dovrebbe apparire sugli altri dispositivi in tempo reale

---

## 🔄 Aggiornamenti Live

### Come Funzionano

1. **Dispositivo 1** (Admin) crea/modifica ordine
2. **Server** riceve la richiesta
3. **Server** invia aggiornamento via WebSocket
4. **Dispositivo 2** (Rider) e **Dispositivo 3** (Customer) ricevono l'aggiornamento
5. **Tutti i dispositivi** si aggiornano automaticamente

### WebSocket

- ✅ Funziona su mobile
- ✅ Usa `wss://` (WebSocket Secure) per HTTPS
- ✅ Supporta riconnessione automatica
- ✅ Funziona anche quando l'app è in background

---

## 🎯 Checklist Pre-Build

- [ ] File `.env` configurato con URL cloud
- [ ] Variabili d'ambiente verificate
- [ ] Componenti aggiornati (se necessario)
- [ ] Build eseguito: `npm run build`
- [ ] Capacitor sincronizzato: `npx cap sync android`
- [ ] APK generato
- [ ] APK testato su un dispositivo

---

## 🆘 Troubleshooting

### App non si connette al server
- Verifica che `.env` contenga l'URL corretto
- Controlla che il build includa le variabili d'ambiente
- Verifica che il server sia online su Render

### WebSocket non funziona
- Verifica che l'URL WebSocket usi `wss://` (non `ws://`)
- Controlla i log del server su Render
- Verifica che il dispositivo abbia connessione internet

### Aggiornamenti non arrivano
- Verifica che WebSocket sia connesso
- Controlla che il server invii gli aggiornamenti
- Verifica i log su Render

---

## 🎉 Risultato Finale

Dopo aver installato gli APK su tre dispositivi:

- ✅ **Dispositivo 1** (Admin): Gestisce ordini, menu, configurazioni
- ✅ **Dispositivo 2** (Rider): Riceve ordini, aggiorna stato consegne
- ✅ **Dispositivo 3** (Customer): Ordina, vede aggiornamenti in tempo reale

**Tutti collegati al server cloud, aggiornamenti live funzionanti!** 🚀

