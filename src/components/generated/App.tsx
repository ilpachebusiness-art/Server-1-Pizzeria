import { useState, useEffect } from 'react';
import { Theme } from '../../settings/types';
import { PizzaFlowAdmin } from './PizzaFlowAdmin';
import { PizzaFlowCustomer } from './PizzaFlowCustomer';
import { PizzaFlowRider } from './PizzaFlowRider';
import { Authentication, UserRole } from './Authentication';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('customer');

  // Initial App Loading Simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('customer');
  };

  // Splash Screen
  if (loading) {
    return <div className="fixed inset-0 bg-orange-600 flex flex-col items-center justify-center z-50">
        <motion.div initial={{
        scale: 0.8,
        opacity: 0
      }} animate={{
        scale: 1,
        opacity: 1
      }} transition={{
        duration: 0.5
      }} className="bg-white p-6 rounded-3xl shadow-2xl mb-8">
          <UtensilsCrossed className="w-16 h-16 text-orange-600" />
        </motion.div>
        <motion.h1 initial={{
        y: 20,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        delay: 0.3
      }} className="text-4xl font-bold text-white mb-2">
          PizzaFlow
        </motion.h1>
        <motion.p initial={{
        opacity: 0
      }} animate={{
        opacity: 0.8
      }} transition={{
        delay: 0.6
      }} className="text-orange-100 text-lg font-medium">
          La tua pizza, perfetta.
        </motion.p>
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 1
      }} className="absolute bottom-10">
          <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
        </motion.div>
      </div>;
  }

  // Authentication Screen
  if (!isAuthenticated) {
    return <Authentication onLogin={handleLogin} />;
  }

  // Authenticated App Content
  return <div className="relative h-full w-full">
      {/* Role Indicator / Logout (Optional - usually inside the layout, but kept here for easy dev/testing access if needed, or we can rely on internal logouts) */}
      {/* We won't add a floating logout button to keep UI clean, assuming internal components have their own navigation/logout or we rely on browser refresh for this demo */}
      
      <AnimatePresence mode="wait">
        <motion.div key={userRole} initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="h-full w-full">
          {userRole === 'customer' && <PizzaFlowCustomer />}
          {userRole === 'admin' && <PizzaFlowAdmin />}
          {userRole === 'rider' && <PizzaFlowRider />}
        </motion.div>
      </AnimatePresence>
    </div>;
}
export default App;