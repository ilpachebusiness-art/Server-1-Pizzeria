import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';
interface ModalProps {
  onClose: () => void;
}
export const PrivacyPolicyModal: React.FC<ModalProps> = ({
  onClose
}) => {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2 text-slate-900">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold">Informativa Privacy GDPR</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>
          
          <h4 className="text-base font-bold text-slate-900 mt-4">1. Titolare del Trattamento</h4>
          <p>
            Il titolare del trattamento dei dati è PizzaFlow S.r.l., con sede legale in Via Roma 1, Milano.
            Per qualsiasi informazione: privacy@pizzaflow.it.
          </p>

          <h4 className="text-base font-bold text-slate-900 mt-4">2. Dati Raccolti</h4>
          <p>
            Raccogliamo i seguenti dati personali necessari per l'erogazione del servizio:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Nome e Cognome (per identificare il cliente)</li>
            <li>Numero di telefono (per comunicazioni sull'ordine)</li>
            <li>Indirizzo di consegna (per la consegna a domicilio)</li>
            <li>Storico degli ordini (per finalità statistiche e di servizio)</li>
            <li>Email (per l'autenticazione e ricevute)</li>
          </ul>

          <h4 className="text-base font-bold text-slate-900 mt-4">3. Finalità del Trattamento</h4>
          <p>
            I dati vengono trattati esclusivamente per:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Gestione ed evasione degli ordini</li>
            <li>Comunicazioni di servizio (ritardi, conferme)</li>
            <li>Adempimenti fiscali e legali</li>
          </ul>

          <h4 className="text-base font-bold text-slate-900 mt-4">4. Diritti dell'Utente</h4>
          <p>
            In conformità al GDPR, hai il diritto di:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Accedere ai tuoi dati</li>
            <li>Chiederne la rettifica o la cancellazione</li>
            <li>Opporti al trattamento</li>
            <li>Richiedere la portabilità dei dati</li>
          </ul>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors">
            Ho capito
          </button>
        </div>
      </div>
    </div>;
};
export const TermsOfServiceModal: React.FC<ModalProps> = ({
  onClose
}) => {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2 text-slate-900">
            <FileText className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold">Termini e Condizioni di Utilizzo</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600">
          <h4 className="text-base font-bold text-slate-900 mt-2">1. Accettazione del Servizio</h4>
          <p>
            Utilizzando l'app PizzaFlow, l'utente accetta integralmente i presenti termini e condizioni.
            Il servizio è riservato a utenti maggiorenni.
          </p>

          <h4 className="text-base font-bold text-slate-900 mt-4">2. Ordinazioni e Consegne</h4>
          <p>
            PizzaFlow si impegna a rispettare gli orari di consegna stimati. Tuttavia, in caso di 
            forza maggiore (traffico intenso, maltempo), i tempi potrebbero subire variazioni.
            Il cliente verrà tempestivamente informato.
          </p>

          <h4 className="text-base font-bold text-slate-900 mt-4">3. Politica di Rimborso</h4>
          <p>
            In caso di ordine errato, mancante o non conforme, il cliente ha diritto al rimborso parziale o totale,
            oppure a un buono sconto per ordini futuri, previa verifica da parte del gestore.
          </p>

          <h4 className="text-base font-bold text-slate-900 mt-4">4. Comportamento dell'Utente</h4>
          <p>
            L'utente si impegna a fornire dati veritieri e corretti (indirizzo, telefono).
            Ordini falsi o "scherzi" comporteranno il ban immediato dell'account e segnalazione alle autorità competenti.
          </p>
          
          <h4 className="text-base font-bold text-slate-900 mt-4">5. Responsabilità</h4>
          <p>
            PizzaFlow non è responsabile per disservizi imputabili a terzi (es. provider internet, banche).
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors">
            Accetto
          </button>
        </div>
      </div>
    </div>;
};