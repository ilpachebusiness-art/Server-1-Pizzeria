import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, ChevronRight, Loader2, ShieldCheck, Bike, Menu, CheckCircle, ArrowRight, FileText } from 'lucide-react';
import { PrivacyPolicyModal, TermsOfServiceModal } from './LegalDocs';
export type UserRole = 'customer' | 'admin' | 'rider';
interface AuthenticationProps {
  onLogin: (role: UserRole) => void;
}
export const Authentication: React.FC<AuthenticationProps> = ({
  onLogin
}) => {
  const [authMode, setAuthMode] = useState<UserRole>('customer');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Customer Flow State
  const [customerStep, setCustomerStep] = useState<'email' | 'verify' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Admin/Rider State
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    if (customerStep === 'email') {
      setCustomerStep('verify');
    } else if (customerStep === 'verify') {
      setCustomerStep('password');
    } else {
      onLogin('customer');
    }
  };
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    // In a real app, validate credentials here
    onLogin('admin');
  };
  const handleRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    // In a real app, validate invite code here
    onLogin('rider');
  };
  const switchMode = (mode: UserRole) => {
    setAuthMode(mode);
    setIsMenuOpen(false);
    setCustomerStep('email');
    setEmail('');
    setCode('');
    setPassword('');
    setUsername('');
    setInviteCode('');
    setAgreedToTerms(false);
  };
  return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Top Left Menu */}
      <div className="absolute top-6 left-6 z-50">
        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2 bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-lg shadow-sm hover:bg-white transition-all text-slate-700 font-medium">
            <Menu className="w-4 h-4" />
            <span>Accedi come...</span>
          </button>

          <AnimatePresence>
            {isMenuOpen && <motion.div initial={{
            opacity: 0,
            y: 10,
            scale: 0.95
          }} animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }} exit={{
            opacity: 0,
            y: 10,
            scale: 0.95
          }} className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-1">
                  <button onClick={() => switchMode('customer')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${authMode === 'customer' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <User className="w-4 h-4" />
                    <span>Cliente</span>
                  </button>
                  <button onClick={() => switchMode('rider')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${authMode === 'rider' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Bike className="w-4 h-4" />
                    <span>Fattorino</span>
                  </button>
                  <button onClick={() => switchMode('admin')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${authMode === 'admin' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Amministratore</span>
                  </button>
                </div>
              </motion.div>}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Card */}
      <motion.div key={authMode} initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} exit={{
      opacity: 0,
      y: -20
    }} className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg shadow-orange-100 bg-gradient-to-br from-orange-500 to-red-600 text-white">
              {authMode === 'customer' && <User className="w-8 h-8" />}
              {authMode === 'admin' && <ShieldCheck className="w-8 h-8" />}
              {authMode === 'rider' && <Bike className="w-8 h-8" />}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {authMode === 'customer' && 'Benvenuto in PizzaFlow'}
              {authMode === 'admin' && 'Accesso Amministratore'}
              {authMode === 'rider' && 'Accesso Fattorino'}
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              {authMode === 'customer' && 'Accedi o registrati per ordinare la tua pizza preferita.'}
              {authMode === 'admin' && 'Inserisci le tue credenziali per gestire la pizzeria.'}
              {authMode === 'rider' && 'Inserisci il codice invito per iniziare il turno.'}
            </p>
          </div>

          {/* Customer Form */}
          {authMode === 'customer' && <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {customerStep === 'email' && <motion.div key="email" initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -20
            }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" placeholder="nome@esempio.com" />
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 pt-2">
                      <div className="relative flex items-center h-5">
                        <input id="terms" type="checkbox" required checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500" />
                      </div>
                      <div className="text-xs text-slate-600">
                        <label htmlFor="terms" className="font-medium text-slate-700">Accetto i Termini e la Privacy Policy</label>
                        <p className="mt-1">
                          Leggi i <button type="button" onClick={() => setShowTermsModal(true)} className="text-orange-600 underline hover:text-orange-700">Termini di Utilizzo</button> e 
                          l'<button type="button" onClick={() => setShowPrivacyModal(true)} className="text-orange-600 underline hover:text-orange-700 ml-1">Informativa Privacy</button>.
                        </p>
                      </div>
                    </div>

                    <button type="submit" disabled={loading || !email || !agreedToTerms} className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center space-x-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Continua</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </motion.div>}

                {customerStep === 'verify' && <motion.div key="verify" initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -20
            }} className="space-y-4">
                    <div className="text-center mb-2">
                      <div className="text-sm text-slate-600">Abbiamo inviato un codice a <span className="font-semibold">{email}</span></div>
                      <button type="button" onClick={() => setCustomerStep('email')} className="text-xs text-orange-600 hover:underline mt-1">Cambia email</button>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Codice di Verifica</label>
                      <input type="text" required value={code} onChange={e => setCode(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl tracking-widest font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" placeholder="000000" maxLength={6} />
                    </div>
                    <button type="submit" disabled={loading || code.length < 4} className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center space-x-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verifica Codice</span>}
                    </button>
                  </motion.div>}

                {customerStep === 'password' && <motion.div key="password" initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -20
            }} className="space-y-4">
                     <div className="text-center mb-2">
                      <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Email verificata</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" placeholder="••••••••" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading || !password} className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center space-x-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Accedi</span>}
                    </button>
                  </motion.div>}
              </AnimatePresence>
            </form>}

          {/* Admin Form */}
          {authMode === 'admin' && <form onSubmit={handleAdminSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all" placeholder="admin" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={loading || !username || !password} className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center space-x-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Login Admin</span>}
              </button>
            </form>}

          {/* Rider Form */}
          {authMode === 'rider' && <form onSubmit={handleRiderSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Codice Invito</label>
                <div className="relative">
                  <Bike className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" required value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono tracking-wide placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="INVITE-CODE-000" />
                </div>
              </div>
              <button type="submit" disabled={loading || !inviteCode} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center space-x-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Accedi come Fattorino</span>}
              </button>
            </form>}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} PizzaFlow. All rights reserved.
          </p>
        </div>
      </motion.div>

      {/* Legal Modals */}
      {showPrivacyModal && <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />}
      {showTermsModal && <TermsOfServiceModal onClose={() => setShowTermsModal(false)} />}
    </div>;
};