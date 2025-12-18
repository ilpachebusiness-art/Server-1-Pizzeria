# 📋 Guida: Sistema di Capacità Slot

## Cos'è il Sistema di Capacità Slot?

Il Sistema di Capacità Slot permette di gestire quante pizze il forno può produrre in ogni intervallo di 15 minuti. Questo previene il sovraccarico e garantisce che tu possa soddisfare gli ordini nei tempi previsti.

---

## 🎯 Per l'Admin: Come Configurare

### Accesso
1. Apri il **Pannello Admin**
2. Nel menu laterale, clicca su **🕐 Capacità Slot**

### Configurazione Rapida (Stessa capacità per tutti gli slot)

1. **Imposta la Capacità Globale**
   - Usa i pulsanti **+** e **-** per impostare il numero (es. 30 pizze)
   - Questo rappresenta quante pizze il tuo forno può fare in 15 minuti

2. **Applica a Tutti**
   - Clicca su **"Applica a Tutti"** per usare questa capacità per ogni slot

3. **Salva**
   - Clicca su **"Salva Modifiche"** in alto a destra

### Configurazione Personalizzata (Capacità diversa per slot)

Se sai che in certi orari ricevi più ordini, puoi personalizzare:

**Esempio:**
- 20:00-20:15 → 25 pizze (inizio servizio, partenza lenta)
- 20:15-20:30 → 35 pizze (ora di punta)
- 20:30-20:45 → 35 pizze (ora di punta)
- 20:45-21:00 → 30 pizze (rallentamento)
- 21:00-21:15 → 25 pizze (fine servizio)

**Come fare:**
1. Per ogni slot, usa i pulsanti **+5** / **-5**
2. Osserva la barra di progresso e lo stato (Verde/Blu/Arancione/Rosso)
3. Clicca **"Salva Modifiche"**

---

## 📊 Interpretare gli Indicatori

### Barra di Progresso
- **🟢 Verde (0-40%)**: Ampia disponibilità
- **🔵 Blu (40-70%)**: Disponibilità buona
- **🟠 Arancione (70-90%)**: Slot quasi pieno
- **🔴 Rosso (90-100%)**: Slot quasi/completamente esaurito

### Statistiche
- **Ordini Attuali**: Pizze già ordinate per questo slot
- **Disponibili**: Pizze ancora prenotabili
- **Capacità Totale**: Somma di tutti gli slot nella serata

---

## 👥 Per il Cliente: Cosa Vedono

Quando un cliente ordina:

### Slot Disponibile ✅
```
20:15-20:30
30 pizze disponibili • 2 fattorini
```

### Slot Esaurito ❌
```
20:15-20:30
Capacità esaurita
```
*Lo slot appare disabilitato e non è selezionabile*

---

## 🚨 Gestione Ordini Grandi

### Scenario: Cliente ordina 15 pizze

**Problema**: Lo slot ha solo 10 pizze disponibili

**Soluzioni:**

#### Opzione 1: Aumenta Temporaneamente la Capacità
1. Vai in **Capacità Slot**
2. Trova lo slot richiesto
3. Aumenta la capacità (es. da 30 a 45)
4. Salva e contatta il cliente per confermare

#### Opzione 2: Dividi l'Ordine
1. Suggerisci al cliente di dividere in 2 slot adiacenti
2. Esempio: 10 pizze alle 20:15 + 5 pizze alle 20:30

#### Opzione 3: Slot Personalizzato
1. Crea uno slot dedicato per ordini grandi
2. Imposta capacità elevata (es. 50 pizze)
3. Comunica l'orario al cliente

---

## 💡 Best Practices

### 1. Calibra la Capacità Reale
- Fai dei test per capire quante pizze il tuo forno fa in 15 minuti
- Considera il tempo di infornata, cottura e sfornata
- Esempio realistico: 
  - Forno piccolo: 15-20 pizze/15min
  - Forno medio: 25-35 pizze/15min
  - Forno grande: 40-50 pizze/15min

### 2. Monitora in Tempo Reale
- Controlla il pannello durante il servizio
- Se vedi che accumuli ritardo, riduci la capacità dei prossimi slot
- Se hai margine, puoi aumentarla temporaneamente

### 3. Gestisci i Picchi
- Identifica gli orari di punta (es. 20:00-21:00)
- Aumenta leggermente la capacità in questi slot
- Riduci negli orari più tranquilli

### 4. Coordina con i Fattorini
- La capacità deve considerare anche i fattorini disponibili
- Esempio: 3 fattorini × 3 ordini = 9 consegne max
- Se hai ordini grandi, potrebbe servire più tempo

---

## ⚙️ Esempi Pratici

### Esempio 1: Pizzeria Piccola (1 Forno, 2 Fattorini)
```
Capacità consigliata: 20 pizze/slot
Motivo: Forno limitato, pochi fattorini
Orari di punta: aumenta a 25
```

### Esempio 2: Pizzeria Media (2 Forni, 4 Fattorini)
```
Capacità consigliata: 35 pizze/slot
Motivo: Buona capacità produttiva
Orari di punta: aumenta a 40-45
```

### Esempio 3: Pizzeria Grande (3 Forni, 6 Fattorini)
```
Capacità consigliata: 50 pizze/slot
Motivo: Alta capacità produttiva
Orari di punta: aumenta a 60
```

---

## 🔧 Risoluzione Problemi

### "Gli slot si riempiono troppo velocemente"
**Soluzione**: Aumenta la capacità globale di 5-10 pizze

### "Abbiamo troppo margine, pochi ordini"
**Soluzione**: Va bene! Meglio avere margine che sovraccarico

### "Un ordine grande blocca tutto lo slot"
**Soluzione**: Crea slot speciali per ordini >15 pizze con capacità dedicata

### "I clienti non trovano slot disponibili"
**Soluzione**: 
1. Aumenta la capacità
2. Aggiungi più slot nell'orario
3. Considera di assumere più fattorini

---

## 📞 Consigli per Comunicare con i Clienti

### Quando uno slot è pieno
❌ **Non dire**: "Non possiamo prendere il tuo ordine"
✅ **Dì**: "Per quell'orario siamo al completo, posso proporti lo slot successivo alle 20:30?"

### Per ordini grandi
❌ **Non dire**: "Sono troppe pizze"
✅ **Dì**: "Per un ordine così importante, voglio garantirti la massima qualità. Possiamo preparare metà per le 20:15 e metà per le 20:30?"

---

## 📈 Monitoraggio e Ottimizzazione

### Dati da Tracciare
1. **Tasso di riempimento slot** (quanti slot raggiungono il 100%)
2. **Ordini rifiutati** (clienti che non trovano slot)
3. **Tempi di consegna reali** vs. previsti
4. **Ordini completati per slot**

### Ottimizza Settimanalmente
- Analizza i dati della settimana
- Identifica pattern (es. Venerdì/Sabato più intensi)
- Adatta le capacità di conseguenza

---

## ✅ Checklist Settimanale

**Lunedì** (Preparazione)
- [ ] Rivedi le capacità della settimana precedente
- [ ] Adatta le capacità per la settimana corrente
- [ ] Verifica la disponibilità dei fattorini

**Venerdì** (Pre-Weekend)
- [ ] Aumenta la capacità per weekend
- [ ] Controlla che ci siano fattorini extra
- [ ] Comunica eventuali cambiamenti al team

**Domenica** (Revisione)
- [ ] Analizza i dati del weekend
- [ ] Identifica problemi o colli di bottiglia
- [ ] Pianifica migliorie per la prossima settimana

---

## 🎯 Obiettivo Finale

Il sistema di capacità slot mira a:
- ✅ **Evitare sovraccarico** del forno
- ✅ **Garantire tempi di consegna** realistici
- ✅ **Ottimizzare il lavoro** di pizzaioli e fattorini
- ✅ **Migliorare la soddisfazione** del cliente

Quando configurato correttamente, permette di accettare il massimo numero di ordini senza compromettere la qualità del servizio!

---

**Hai domande? Il sistema è intuitivo e puoi sempre modificare le impostazioni in tempo reale!** 🍕
