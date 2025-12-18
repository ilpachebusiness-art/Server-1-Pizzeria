"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Bike, MapPin, Phone, Package, DollarSign, Clock, Navigation, CheckCircle, AlertCircle, TrendingUp, CreditCard, Pizza, ArrowUp, ArrowDown, GripVertical, AlertTriangle, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { getApiUrl, getWsUrl } from '../../../shared/config/api';

// --- Types ---

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
}
interface Customer {
  name: string;
  phone: string;
  address: string;
  zoneId: number;
  buzzerNote?: string;
}
interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  total: number;
  paymentMethod: 'cash' | 'pos_on_pickup';
  slot: string;
  isPrepaid: boolean; // New: flag for pre-paid orders
  deliveryOrder: number; // Order in the delivery queue
}

// --- Mock Data ---

const INITIAL_RIDER_ORDERS: Order[] = [{
  id: 'ORD-001',
  customer: {
    name: 'Mario Rossi',
    phone: '+39 333 1234567',
    address: 'Via Roma 12',
    zoneId: 1,
    buzzerNote: 'Citofonare Rossi'
  },
  items: [{
    id: 101,
    name: 'Margherita',
    quantity: 2,
    price: 8.5,
    modifiers: ['Mozzarella extra']
  }, {
    id: 202,
    name: 'Coca Cola',
    quantity: 1,
    price: 2.5,
    modifiers: []
  }],
  total: 19.5,
  paymentMethod: 'cash',
  slot: '20:00-20:15',
  isPrepaid: false,
  deliveryOrder: 1
}, {
  id: 'ORD-002',
  customer: {
    name: 'Luigi Verdi',
    phone: '+39 333 9876543',
    address: 'Corso Italia 45',
    zoneId: 1,
    buzzerNote: 'Piano 3, scala B'
  },
  items: [{
    id: 103,
    name: 'Diavola',
    quantity: 1,
    price: 9.5,
    modifiers: []
  }],
  total: 9.5,
  paymentMethod: 'pos_on_pickup',
  slot: '20:00-20:15',
  isPrepaid: false,
  deliveryOrder: 2
}, {
  id: 'ORD-005',
  customer: {
    name: 'Carla Neri',
    phone: '+39 333 8887776',
    address: 'Via Dante 22',
    zoneId: 1,
    buzzerNote: 'Portone verde'
  },
  items: [{
    id: 104,
    name: '4 Formaggi',
    quantity: 3,
    price: 11.0,
    modifiers: []
  }],
  total: 33.0,
  paymentMethod: 'cash',
  slot: '20:15-20:30',
  isPrepaid: true,
  // Pre-paid order
  deliveryOrder: 3
}];

// --- Helpers ---

const formatCurrency = (val: number) => `€${val.toFixed(2)}`;

// --- Components ---

const StatCard = ({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) => <div className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm`}>
    <div className="flex items-center justify-between">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  </div>;
const OrderCard = ({
  order,
  onComplete,
  onReorder
}: {
  order: Order;
  onComplete: () => void;
  onReorder: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalPizzas = order.items.filter(item => item.id < 200).reduce((sum, item) => sum + item.quantity, 0);
  return <motion.div layout initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} exit={{
    opacity: 0,
    x: -100
  }} className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Order Header */}
      <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-mono text-sm font-bold text-slate-900">{order.id}</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                #{order.deliveryOrder}
              </span>
              {order.isPrepaid && <span className="flex items-center space-x-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle className="w-3 h-3" />
                  <span>PAGATO</span>
                </span>}
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              <span>{order.slot}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900">{formatCurrency(order.total)}</div>
            <div className="text-xs text-slate-500 capitalize">
              {order.paymentMethod === 'cash' ? '💵 Contanti' : '💳 POS'}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-slate-900">{order.customer.address}</div>
              {order.customer.buzzerNote && <div className="text-xs text-slate-500 mt-0.5">📝 {order.customer.buzzerNote}</div>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <a href={`tel:${order.customer.phone}`} className="text-sm text-blue-600 hover:underline">
              {order.customer.phone}
            </a>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-1 text-sm text-slate-600">
            <Pizza className="w-4 h-4 text-orange-600" />
            <span>{totalPizzas} pizze</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-slate-600">
            <Package className="w-4 h-4 text-slate-400" />
            <span>{order.items.length} prodotti</span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: 'auto',
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} className="border-t border-slate-200">
            <div className="p-4 bg-slate-50 space-y-3">
              <h4 className="font-semibold text-slate-900 text-sm">Dettagli Ordine</h4>
              {order.items.map((item, idx) => <div key={idx} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <div className="text-slate-900 font-medium">
                      {item.quantity}x {item.name}
                    </div>
                    {item.modifiers.length > 0 && <div className="text-xs text-slate-500 ml-4">
                        {item.modifiers.map((mod, i) => <div key={i}>+ {mod}</div>)}
                      </div>}
                  </div>
                  <div className="text-slate-700 font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>)}
              
              {order.isPrepaid && <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-green-900">Ordine Già Pagato</div>
                    <div className="text-xs text-green-700 mt-1">
                      Questo ordine è stato pagato in pizzeria. Non riscuotere il pagamento.
                    </div>
                  </div>
                </div>}

              <div className="pt-3 border-t border-slate-200 flex space-x-2">
                <button onClick={onComplete} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center space-x-2 shadow-sm">
                  <CheckCircle className="w-5 h-5" />
                  <span>Consegnato</span>
                </button>
                <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.customer.address)}`, '_blank')} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
                  <Navigation className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>
    </motion.div>;
};

// @component: PizzaFlowRider
export const PizzaFlowRider = () => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_RIDER_ORDERS);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [riderStatus, setRiderStatus] = useState<'available' | 'offline'>('offline');
  const [riderName, setRiderName] = useState<string>('Marco P.');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved === 'true' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const wsRef = useRef<WebSocket | null>(null);
  const riderId = 'R-01'; // In production, get from auth

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    // Load rider info and initial orders
    const loadRiderInfo = async () => {
      try {
        const res = await fetch(getApiUrl(`/riders/${riderId}`));
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setRiderStatus(data.status || 'offline');
            setRiderName(data.name || 'Marco P.');
          }
        } else if (res.status === 404) {
          // Rider doesn't exist, create it
          try {
            const createRes = await fetch(getApiUrl('/riders'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: riderId,
                name: 'Marco P.',
                status: 'offline'
              })
            });
            if (createRes.ok) {
              const newRider = await createRes.json();
              setRiderStatus(newRider.status || 'offline');
              setRiderName(newRider.name || 'Marco P.');
            }
          } catch (createErr) {
            console.warn('Impossibile creare il fattorino:', createErr);
          }
        }
      } catch (err) {
        console.warn('Impossibile caricare le informazioni del fattorino:', err);
      }
    };
    
    const loadOrders = async () => {
      try {
        const res = await fetch(getApiUrl(`/orders/rider/${riderId}`));
        const data = await res.json();
        if (Array.isArray(data)) {
          // Separate active and completed orders
          const active = data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
          const completed = data.filter(o => o.status === 'delivered');
          setOrders(active);
          setCompletedOrders(completed);
        }
      } catch (err) {
        console.warn('Impossibile caricare gli ordini:', err);
      }
    };
    
    loadRiderInfo();
    loadOrders();

    // Connect to WebSocket
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected (Rider)');
      // Subscribe as rider
      ws.send(JSON.stringify({ type: 'subscribe', role: 'rider' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'order_assigned' && data.riderId === riderId) {
          // New order assigned to this rider
          setOrders(prev => {
            if (prev.find(o => o.id === data.order.id)) {
              return prev;
            }
            return [...prev, data.order];
          });
        } else if (data.type === 'order_updated') {
          // Update existing order
          setOrders(prev => 
            prev.map(o => o.id === data.order.id ? data.order : o)
          );
        } else if (data.type === 'batch_assigned' && data.batch.fattorino_id === riderId) {
          // Batch assigned to this rider - reload orders
          loadOrders();
        } else if (data.type === 'batch_updated' && data.batch.fattorino_id === riderId) {
          // Batch updated - reload orders
          loadOrders();
        } else if (data.type === 'batch_deleted') {
          // Batch deleted - reload orders to remove any orders from deleted batch
          loadOrders();
        } else if (data.type === 'rider_status_updated' && data.riderId === riderId) {
          // Rider status updated
          setRiderStatus(data.newStatus || 'offline');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected (Rider)');
    };

    return () => {
      ws.close();
    };
  }, [riderId]);

  // Statistics
  const stats = useMemo(() => {
    const allOrders = [...orders, ...completedOrders];
    const totalOrders = allOrders.length;
    const totalPizzas = allOrders.reduce((sum, order) => {
      return sum + order.items.filter(item => item.id < 200).reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    const cashAmount = allOrders.filter(o => o.paymentMethod === 'cash' && !o.isPrepaid).reduce((sum, o) => sum + o.total, 0);
    const posAmount = allOrders.filter(o => o.paymentMethod === 'pos_on_pickup' && !o.isPrepaid).reduce((sum, o) => sum + o.total, 0);
    return {
      totalOrders,
      totalPizzas,
      cashAmount,
      posAmount
    };
  }, [orders, completedOrders]);
  const handleCompleteOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    try {
      // Update order status to delivered via API
      const response = await fetch(getApiUrl(`/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      });
      const updatedOrder = await response.json();
      
      // Update local state
      setCompletedOrders([...completedOrders, updatedOrder]);
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Errore nel completamento dell\'ordine:', error);
      // Fallback to local state
      setCompletedOrders([...completedOrders, order]);
      setOrders(orders.filter(o => o.id !== orderId));
    }
  };
  const handleToggleServiceStatus = async () => {
    const newStatus = riderStatus === 'offline' ? 'available' : 'offline';
    
    try {
      const response = await fetch(getApiUrl(`/riders/${riderId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        const updatedRider = await response.json();
        setRiderStatus(updatedRider.status || newStatus);
      } else {
        // Se il fattorino non esiste, crealo
        if (response.status === 404) {
          try {
            const createResponse = await fetch(getApiUrl('/riders'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: riderId,
                name: riderName,
                status: newStatus
              })
            });
            if (createResponse.ok) {
              const newRider = await createResponse.json();
              setRiderStatus(newRider.status || newStatus);
            }
          } catch (createError) {
            console.error('Errore nella creazione del fattorino:', createError);
          }
        } else {
          console.error('Errore nell\'aggiornamento dello stato:', response.status, response.statusText);
        }
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello stato:', error);
    }
  };

  const handleReorderOrders = async (newOrder: Order[]) => {
    // Update delivery order numbers
    const reorderedOrders = newOrder.map((order, index) => ({
      ...order,
      deliveryOrder: index + 1
    }));
    
    // Update orders via API (optional - this is just for local ordering)
    // We'll update locally for now as delivery order is rider-specific
    setOrders(reorderedOrders);
    
    // Optionally save delivery order to server if needed
    // for (const order of reorderedOrders) {
    //   try {
    //     await fetch(`http://localhost:3001/api/orders/${order.id}`, {
    //       method: 'PUT',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify({ deliveryOrder: order.deliveryOrder })
    //     });
    //   } catch (err) {
    //     console.error(`Errore nell'aggiornamento dell'ordine ${order.id}:`, err);
    //   }
    // }
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">App Fattorino</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">{riderName} • Turno Serale</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={darkMode ? 'Modalità Chiara' : 'Modalità Scura'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={handleToggleServiceStatus} className={`flex items-center px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                riderStatus === 'available' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${riderStatus === 'available' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                {riderStatus === 'available' ? 'In Servizio' : 'Fuori Servizio'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Live Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Package} label="Ordini" value={stats.totalOrders} color="bg-blue-600" />
          <StatCard icon={Pizza} label="Pizze" value={stats.totalPizzas} color="bg-orange-600" />
          <StatCard icon={DollarSign} label="Contanti" value={formatCurrency(stats.cashAmount)} color="bg-green-600" />
          <StatCard icon={CreditCard} label="POS" value={formatCurrency(stats.posAmount)} color="bg-purple-600" />
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
          <button onClick={() => setActiveTab('active')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
            Ordini Attivi ({orders.length})
          </button>
          <button onClick={() => setActiveTab('completed')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'completed' ? 'bg-green-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
            Completati ({completedOrders.length})
          </button>
        </div>

        {/* Orders List */}
        {activeTab === 'active' && <div className="space-y-4">
            {orders.length > 0 ? <>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-blue-900">Riordina le Consegne</div>
                    <div className="text-xs text-blue-700 mt-1">
                      Trascina gli ordini per organizzare il giro in base alla comodità del percorso. 
                      Le modifiche sono solo per te e non influenzano il sistema centrale.
                    </div>
                  </div>
                </div>

                <Reorder.Group axis="y" values={orders} onReorder={handleReorderOrders} className="space-y-3">
                  {orders.map(order => <Reorder.Item key={order.id} value={order}>
                      <div className="cursor-grab active:cursor-grabbing">
                        <OrderCard order={order} onComplete={() => handleCompleteOrder(order.id)} onReorder={() => {}} />
                      </div>
                    </Reorder.Item>)}
                </Reorder.Group>
              </> : <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Nessun Ordine Attivo</h3>
                <p className="text-sm text-slate-500">
                  Al momento non hai ordini assegnati. Nuovi ordini appariranno qui automaticamente.
                </p>
              </div>}
          </div>}

        {activeTab === 'completed' && <div className="space-y-3">
            {completedOrders.length > 0 ? completedOrders.map(order => <div key={order.id} className="bg-white rounded-xl border border-green-200 p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold text-slate-900">{order.id}</div>
                        <div className="text-xs text-slate-500">{order.customer.address}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{formatCurrency(order.total)}</div>
                      <div className="text-xs text-slate-500">
                        {order.isPrepaid ? '✓ Già pagato' : order.paymentMethod === 'cash' ? '💵 Contanti' : '💳 POS'}
                      </div>
                    </div>
                  </div>
                </div>) : <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Nessun Ordine Completato</h3>
                <p className="text-sm text-slate-500">
                  Gli ordini completati appariranno qui.
                </p>
              </div>}
          </div>}
      </div>
    </div>;
};