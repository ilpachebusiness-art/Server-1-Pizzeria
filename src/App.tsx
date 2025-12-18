import { useMemo, useState } from 'react';
import { Container, Theme } from './settings/types';
import { PizzaFlowAdmin } from './components/generated/PizzaFlowAdmin';
import { PizzaFlowCustomer } from './components/generated/PizzaFlowCustomer';
import { PizzaFlowRider } from './components/generated/PizzaFlowRider';
// %IMPORT_STATEMENT

let theme: Theme = 'light';
// only use 'centered' container for standalone components, never for full page apps or websites.
let container: Container = 'none';

function App() {
  const [viewMode, setViewMode] = useState<'customer' | 'admin' | 'rider'>('customer');

  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  const generatedComponent = useMemo(() => {
    // THIS IS WHERE THE TOP LEVEL GENRATED COMPONENT WILL BE RETURNED!
    return (
      <div className="relative h-full w-full">
        {/* Toggle Button */}
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-white shadow-xl rounded-full p-1 border border-slate-200">
          <button
            onClick={() => setViewMode('customer')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              viewMode === 'customer'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            🍕 App Cliente
          </button>
          <button
            onClick={() => setViewMode('admin')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              viewMode === 'admin'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            👨‍💼 Pannello Admin
          </button>
          <button
            onClick={() => setViewMode('rider')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              viewMode === 'rider'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            🚴 App Fattorino
          </button>
        </div>

        {/* Render Selected Component */}
        {viewMode === 'customer' && <PizzaFlowCustomer />}
        {viewMode === 'admin' && <PizzaFlowAdmin />}
        {viewMode === 'rider' && <PizzaFlowRider />}
      </div>
    );
  }, [viewMode]);

  if (container === 'centered') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        {generatedComponent}
      </div>
    );
  } else {
    return generatedComponent;
  }
}

export default App;