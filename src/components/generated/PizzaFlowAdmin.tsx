"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LayoutDashboard, UtensilsCrossed, Map, Users, FileText, ShoppingBag, Bell, Settings, Menu, Search, Plus, Minus, Printer, Bike, Clock, ChevronRight, CheckCircle, AlertCircle, Phone, X, Edit2, Trash2, Save, Calendar, DollarSign, TrendingUp, Package, CreditCard, Pizza as PizzaIcon, Check, MapPin, Shield, Activity, Store, User, Moon, Sun } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { QuadrantManagement } from './QuadrantManagement';
import { Quadrant, detectQuadrantFromStreet } from './QuadrantTypes';
import { LocationManagement, Location } from './LocationManagement';
import { SlotCapacityManagement } from './SlotCapacityManagement';
import { TimeSlotOrganizer } from './TimeSlotOrganizer';
import { QuadrantBatchView } from './QuadrantBatchView';
import { getApiUrl, getWsUrl } from '../../../shared/config/api';

// --- Types ---

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
type PaymentMethod = 'cash' | 'pos_on_pickup';
type DeliveryMethod = 'delivery' | 'pickup';
interface Customer {
  name: string;
  phone: string;
  address: string;
  street: string;
  zoneId: number;
  buzzerNote?: string;
}
interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
}
interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  slot: string;
  orderDate?: string;
  quadrante_id?: number;
  batchId?: string;
  riderId?: string;
}
interface Rider {
  id: string;
  name: string;
  status: 'available' | 'en_route' | 'delivering' | 'offline';
  currentCapacity: number;
  maxCapacity: number;
  batteryLevel: number;
}
interface Batch {
  id: string;
  slot: string;
  quadrante_id: number;
  fattorino_id?: string | null;
  orders: string[];
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
}
interface PizzaIngredient {
  id: string;
  name: string;
}
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  volumeUnit: number;
  ingredients?: PizzaIngredient[];
}
interface WeeklySchedule {
  dayOfWeek: string;
  ridersCount: number;
}
interface RiderSummary {
  riderId: string;
  riderName: string;
  totalOrders: number;
  totalPizzas: number;
  cashAmount: number;
  posAmount: number;
  totalAmount: number;
}
interface Banner {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'success' | 'error';
  active: boolean;
  createdAt: string;
}
interface MenuCategory {
  id: string;
  name: string;
  emoji: string;
}
interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip: string;
}

// --- Mock Data ---

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [{
  id: 'LOG-001',
  timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  user: 'Admin',
  action: 'LOGIN',
  details: 'Accesso effettuato con successo',
  ip: '192.168.1.1'
}, {
  id: 'LOG-002',
  timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  user: 'Admin',
  action: 'UPDATE_SLOTS',
  details: 'Modificata capacità slot 20:00-20:15',
  ip: '192.168.1.1'
}, {
  id: 'LOG-003',
  timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  user: 'Admin',
  action: 'UPDATE_MENU',
  details: 'Aggiornato prezzo Pizza Margherita',
  ip: '192.168.1.1'
}, {
  id: 'LOG-004',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  user: 'System',
  action: 'BACKUP',
  details: 'Backup automatico completato',
  ip: 'localhost'
}];
const INITIAL_ORDERS: Order[] = [{
  id: 'ORD-001',
  customer: {
    name: 'Mario Rossi',
    phone: '+39 333 1234567',
    address: 'Via Roma 12',
    street: 'Via Roma',
    zoneId: 1
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
  status: 'delivered',
  total: 19.5,
  createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  deliveryMethod: 'delivery',
  paymentMethod: 'cash',
  slot: '20:00-20:15',
  quadrante_id: 1,
  batchId: 'BATCH-101',
  riderId: 'R-01'
}, {
  id: 'ORD-002',
  customer: {
    name: 'Luigi Verdi',
    phone: '+39 333 9876543',
    address: 'Corso Italia 45',
    street: 'Corso Italia',
    zoneId: 1
  },
  items: [{
    id: 103,
    name: 'Diavola',
    quantity: 1,
    price: 9.5,
    modifiers: []
  }],
  status: 'delivered',
  total: 9.5,
  createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  deliveryMethod: 'delivery',
  paymentMethod: 'pos_on_pickup',
  slot: '20:00-20:15',
  quadrante_id: 1,
  batchId: 'BATCH-101',
  riderId: 'R-01'
}, {
  id: 'ORD-003',
  customer: {
    name: 'Anna Bianchi',
    phone: '+39 333 5556667',
    address: 'Via Garibaldi 8',
    street: 'Via Garibaldi',
    zoneId: 2
  },
  items: [{
    id: 104,
    name: '4 Formaggi',
    quantity: 2,
    price: 10.0,
    modifiers: ['Senza gorgonzola']
  }],
  status: 'preparing',
  total: 20.0,
  createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  deliveryMethod: 'delivery',
  paymentMethod: 'cash',
  slot: '20:15-20:30',
  quadrante_id: 2,
  riderId: 'R-02'
}, {
  id: 'ORD-004',
  customer: {
    name: 'Giovanni Neri',
    phone: '+39 333 4445556',
    address: 'Ritiro in negozio',
    street: 'Ritiro in negozio',
    zoneId: 0
  },
  items: [{
    id: 101,
    name: 'Margherita',
    quantity: 1,
    price: 8.5,
    modifiers: []
  }, {
    id: 102,
    name: 'Diavola',
    quantity: 1,
    price: 9.5,
    modifiers: []
  }, {
    id: 201,
    name: 'Coca Cola 0.5L',
    quantity: 2,
    price: 2.5,
    modifiers: []
  }],
  status: 'ready',
  total: 23.0,
  createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  deliveryMethod: 'pickup',
  paymentMethod: 'cash',
  slot: '20:30-20:45'
}, {
  id: 'ORD-005',
  customer: {
    name: 'Francesca Blu',
    phone: '+39 333 7778889',
    address: 'Ritiro in negozio',
    street: 'Ritiro in negozio',
    zoneId: 0
  },
  items: [{
    id: 103,
    name: 'Capricciosa',
    quantity: 2,
    price: 10.0,
    modifiers: []
  }],
  status: 'ready',
  total: 20.0,
  createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  deliveryMethod: 'pickup',
  paymentMethod: 'pos_on_pickup',
  slot: '20:15-20:30'
}, {
  id: 'ORD-006',
  customer: {
    name: 'Paolo Gialli',
    phone: '+39 333 2223334',
    address: 'Ritiro in negozio',
    street: 'Ritiro in negozio',
    zoneId: 0
  },
  items: [{
    id: 104,
    name: '4 Formaggi',
    quantity: 1,
    price: 11.0,
    modifiers: ['Extra gorgonzola']
  }, {
    id: 401,
    name: 'Tiramisù',
    quantity: 1,
    price: 4.5,
    modifiers: []
  }],
  status: 'preparing',
  total: 15.5,
  createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  deliveryMethod: 'pickup',
  paymentMethod: 'cash',
  slot: '20:45-21:00'
}, {
  id: 'ORD-007',
  customer: {
    name: 'Sara Viola',
    phone: '+39 333 6667778',
    address: 'Ritiro in negozio',
    street: 'Ritiro in negozio',
    zoneId: 0
  },
  items: [{
    id: 105,
    name: 'Vegetariana',
    quantity: 1,
    price: 9.0,
    modifiers: []
  }],
  status: 'delivered',
  total: 9.0,
  createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  deliveryMethod: 'pickup',
  paymentMethod: 'pos_on_pickup',
  slot: '19:30-19:45'
}];
const INITIAL_RIDERS: Rider[] = [{
  id: 'R-01',
  name: 'Marco P.',
  status: 'en_route',
  currentCapacity: 3,
  maxCapacity: 10,
  batteryLevel: 85
}, {
  id: 'R-02',
  name: 'Giulia S.',
  status: 'available',
  currentCapacity: 0,
  maxCapacity: 10,
  batteryLevel: 92
}, {
  id: 'R-03',
  name: 'Luca D.',
  status: 'offline',
  currentCapacity: 0,
  maxCapacity: 10,
  batteryLevel: 45
}];
const INITIAL_BATCHES: Batch[] = [{
  id: 'BATCH-101',
  slot: '20:00-20:15',
  quadrante_id: 1,
  fattorino_id: 'R-01',
  orders: ['ORD-001', 'ORD-002'],
  status: 'in_progress'
}];
const INITIAL_MENU: MenuItem[] = [{
  id: 101,
  name: 'Margherita',
  description: 'Salsa di pomodoro fresco, mozzarella, basilico',
  price: 8.50,
  category: 'pizza',
  volumeUnit: 2.0
}, {
  id: 102,
  name: 'Diavola',
  description: 'Salsa di pomodoro, mozzarella, salame piccante',
  price: 9.50,
  category: 'pizza',
  volumeUnit: 2.0
}, {
  id: 103,
  name: 'Capricciosa',
  description: 'Pomodoro, mozzarella, prosciutto, funghi, carciofi',
  price: 10.00,
  category: 'pizza',
  volumeUnit: 2.5
}, {
  id: 104,
  name: '4 Formaggi',
  description: 'Mozzarella, gorgonzola, fontina, parmigiano',
  price: 11.00,
  category: 'pizza',
  volumeUnit: 2.2
}, {
  id: 201,
  name: 'Coca Cola 0.5L',
  description: 'Coca Cola classica',
  price: 2.50,
  category: 'drink',
  volumeUnit: 0.5
}, {
  id: 301,
  name: 'Bruschetta',
  description: 'Pane tostato con pomodoro e basilico',
  price: 5.00,
  category: 'antipasti',
  volumeUnit: 1.0
}, {
  id: 401,
  name: 'Tiramisù',
  description: 'Dolce classico italiano',
  price: 4.50,
  category: 'dolci',
  volumeUnit: 1.0
}];
const INITIAL_MENU_CATEGORIES: MenuCategory[] = [{
  id: 'pizza',
  name: 'Pizza',
  emoji: '🍕'
}, {
  id: 'drink',
  name: 'Bevande',
  emoji: '🥤'
}, {
  id: 'antipasti',
  name: 'Antipasti',
  emoji: '🍴'
}, {
  id: 'dolci',
  name: 'Dolci',
  emoji: '🍰'
}];
const INITIAL_WEEKLY_SCHEDULE: WeeklySchedule[] = [{
  dayOfWeek: 'Lunedì',
  ridersCount: 3
}, {
  dayOfWeek: 'Martedì',
  ridersCount: 3
}, {
  dayOfWeek: 'Mercoledì',
  ridersCount: 3
}, {
  dayOfWeek: 'Giovedì',
  ridersCount: 4
}, {
  dayOfWeek: 'Venerdì',
  ridersCount: 5
}, {
  dayOfWeek: 'Sabato',
  ridersCount: 5
}, {
  dayOfWeek: 'Domenica',
  ridersCount: 4
}];
const INITIAL_QUADRANTS: Quadrant[] = [{
  id: 1,
  nome: 'Centro',
  tipo_definizione: 'via_list',
  vie: ['Via Roma', 'Corso Italia', 'Piazza Duomo'],
  geo_polygon: null,
  adiacenti: [2],
  colore: '#ef4444',
  priority: 1,
  preferredSlots: []
}, {
  id: 2,
  nome: 'Nord',
  tipo_definizione: 'via_list',
  vie: ['Via Garibaldi', 'Via Dante'],
  geo_polygon: null,
  adiacenti: [1, 3],
  colore: '#3b82f6',
  priority: 2,
  preferredSlots: ['20:00', '20:15', '20:00'] // Example preferred slots
}, {
  id: 3,
  nome: 'Sud',
  tipo_definizione: 'via_list',
  vie: ['Via Mazzini', 'Corso Vittorio Emanuele'],
  geo_polygon: null,
  adiacenti: [2],
  colore: '#10b981',
  priority: 2,
  preferredSlots: ['20:30', '20:45'] // Example preferred slots
}];
const INITIAL_LOCATIONS: Location[] = [{
  paese: 'Castelfranco',
  vie: ['Via Roma', 'Corso Italia', 'Piazza Duomo', 'Via Garibaldi']
}, {
  paese: 'Montebelluna',
  vie: ['Via Dante', 'Via Mazzini', 'Corso Vittorio Emanuele']
}, {
  paese: 'Treviso',
  vie: ['Via Calmaggiore', 'Piazza dei Signori', 'Viale Burchiellati']
}];
const INITIAL_BANNERS: Banner[] = [{
  id: 'BAN-001',
  text: '🎉 Promo Weekend: Sconto 10% su ordini sopra €20!',
  type: 'success',
  active: true,
  createdAt: new Date().toISOString()
}, {
  id: 'BAN-002',
  text: '⏰ Oggi consegne disponibili fino alle 23:00',
  type: 'info',
  active: true,
  createdAt: new Date().toISOString()
}];
// KPI_DATA removed - now using chartData from useMemo (moved inside component)

// --- Helpers ---

const formatCurrency = (val: number) => `€${val.toFixed(2)}`;
const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'preparing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ready':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'out_for_delivery':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
const getRiderStatusColor = (status: Rider['status']) => {
  switch (status) {
    case 'available':
      return 'bg-green-500';
    case 'en_route':
      return 'bg-blue-500';
    case 'delivering':
      return 'bg-orange-500';
    case 'offline':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
};

// --- Components ---

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) => <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${active ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
    <Icon className={`w-5 h-5 ${active ? 'text-orange-600' : 'text-slate-400'}`} />
    <span>{label}</span>
  </button>;
const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend
}: any) => <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-orange-50 rounded-lg">
        <Icon className="w-5 h-5 text-orange-600" />
      </div>
      {trend && <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend > 0 ? '+' : ''}
          {trend}%
        </span>}
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <div className="flex items-baseline space-x-2">
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      {subtext && <span className="text-xs text-slate-400">{subtext}</span>}
    </div>
  </div>;

// @component: PizzaFlowAdmin
export const PizzaFlowAdmin = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [riders, setRiders] = useState<Rider[]>(INITIAL_RIDERS);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(INITIAL_MENU_CATEGORIES);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>(INITIAL_WEEKLY_SCHEDULE);
  const [currentRidersCount, setCurrentRidersCount] = useState(3);
  const [quadrants, setQuadrants] = useState<Quadrant[]>(INITIAL_QUADRANTS);
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [activeRiders, setActiveRiders] = useState<string[]>(['R-01', 'R-02']); // IDs of active riders for the evening
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [dailyPerformance, setDailyPerformance] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<PizzaIngredient[]>([]);
  const [orderSortBy, setOrderSortBy] = useState<'time' | 'products' | 'total'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orderSortBy');
      return (saved as 'time' | 'products' | 'total') || 'time';
    }
    return 'time';
  });
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showWeeklyScheduleModal, setShowWeeklyScheduleModal] = useState(false);
  const [showRiderAssignmentModal, setShowRiderAssignmentModal] = useState(false);
  const [showEndOfEveningSummary, setShowEndOfEveningSummary] = useState(false);
  const [showActiveRidersModal, setShowActiveRidersModal] = useState(false);
  const [showFiscalClosureModal, setShowFiscalClosureModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedOrderForRiderAssignment, setSelectedOrderForRiderAssignment] = useState<Order | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Load audit logs from server
  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        const response = await fetch(getApiUrl('/audit?limit=100'));
        if (response.ok) {
          const logs = await response.json();
          setAuditLogs(logs);
        }
      } catch (error) {
        console.error('Error loading audit logs:', error);
      }
    };
    loadAuditLogs();
    // Refresh every 30 seconds
    const interval = setInterval(loadAuditLogs, 30000);
    return () => clearInterval(interval);
  }, []);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [showKitchenPrintPreview, setShowKitchenPrintPreview] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved === 'true' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [notifications, setNotifications] = useState<Array<{id: string; type: string; message: string; timestamp: Date; read: boolean}>>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // WebSocket connection for real-time updates
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Load initial data from server
    const loadInitialData = async () => {
      try {
        // Load orders
        const ordersRes = await fetch(getApiUrl('/orders'));
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
        }
        
        // Load batches
        try {
          const batchesRes = await fetch(getApiUrl('/batches'));
          const batchesData = await batchesRes.json();
          if (Array.isArray(batchesData)) {
            setBatches(batchesData);
          }
        } catch (err) {
          console.warn('Impossibile caricare i batch:', err);
        }
        
        // Load riders
        try {
          const ridersRes = await fetch(getApiUrl('/riders'));
          const ridersData = await ridersRes.json();
          if (Array.isArray(ridersData)) {
            // Remove duplicates by ID
            const uniqueRiders = ridersData.filter((rider, index, self) => 
              index === self.findIndex(r => r.id === rider.id)
            );
            setRiders(uniqueRiders);
          }
        } catch (err) {
          console.warn('Impossibile caricare i rider:', err);
        }
        
        // Load menu items
        try {
          const menuRes = await fetch(getApiUrl('/menu/items'));
          const menuData = await menuRes.json();
          if (Array.isArray(menuData) && menuData.length > 0) {
            // Normalizza gli ingredienti per ogni item
            const normalizedMenu = menuData.map(item => ({
              ...item,
              ingredients: Array.isArray(item.ingredients) ? item.ingredients : []
            }));
            setMenu(normalizedMenu);
          }
        } catch (err) {
          console.warn('Impossibile caricare il menu:', err);
        }
        
        // Load menu categories
        try {
          const categoriesRes = await fetch(getApiUrl('/menu/categories'));
          const categoriesData = await categoriesRes.json();
          if (Array.isArray(categoriesData) && categoriesData.length > 0) {
            setMenuCategories(categoriesData);
          }
        } catch (err) {
          console.warn('Impossibile caricare le categorie:', err);
        }
        
        // Load banners
        try {
          const bannersRes = await fetch(getApiUrl('/config/banners'));
          const bannersData = await bannersRes.json();
          if (Array.isArray(bannersData)) {
            setBanners(bannersData);
          }
        } catch (err) {
          console.warn('Impossibile caricare i banners:', err);
        }
        
        // Load locations
        try {
          const locationsRes = await fetch(getApiUrl('/config/locations'));
          const locationsData = await locationsRes.json();
          if (Array.isArray(locationsData) && locationsData.length > 0) {
            setLocations(locationsData);
          }
        } catch (err) {
          console.warn('Impossibile caricare le locations:', err);
        }
        
        // Load slot capacity
        try {
          const slotCapacityRes = await fetch(getApiUrl('/config/slot-capacity'));
          const slotCapacityData = await slotCapacityRes.json();
          if (slotCapacityData) {
            setSlotCapacity(slotCapacityData);
          }
        } catch (err) {
          console.warn('Impossibile caricare la slot capacity:', err);
        }
        
        // Load quadrants
        try {
          const quadrantsRes = await fetch(getApiUrl('/quadrants'));
          const quadrantsData = await quadrantsRes.json();
          if (Array.isArray(quadrantsData) && quadrantsData.length > 0) {
            setQuadrants(quadrantsData);
          }
        } catch (err) {
          console.warn('Impossibile caricare i quadranti:', err);
        }
        
        // Load ingredients
        try {
          const ingredientsRes = await fetch(getApiUrl('/ingredients'));
          const ingredientsData = await ingredientsRes.json();
          if (Array.isArray(ingredientsData)) {
            setIngredients(ingredientsData);
          }
        } catch (err) {
          console.warn('Impossibile caricare gli ingredienti:', err);
        }
      } catch (err) {
        console.warn('Impossibile caricare i dati iniziali:', err);
      }
    };
    loadInitialData();

    // Connect to WebSocket
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected (Admin)');
      // Subscribe as admin
      ws.send(JSON.stringify({ type: 'subscribe', role: 'admin' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_order') {
          // Add new order to the list
          setOrders(prev => {
            // Check if order already exists
            if (prev.find(o => o.id === data.order.id)) {
              return prev;
            }
            return [data.order, ...prev];
          });
        } else if (data.type === 'order_updated') {
          // Update existing order
          setOrders(prev => 
            prev.map(o => o.id === data.order.id ? data.order : o)
          );
        } else if (data.type === 'batch_created' || data.type === 'batch_updated') {
          // Update or add batch
          setBatches(prev => {
            const existing = prev.find(b => b.id === data.batch.id);
            if (existing) {
              return prev.map(b => b.id === data.batch.id ? data.batch : b);
            }
            return [...prev, data.batch];
          });
        } else if (data.type === 'batch_deleted') {
          // Remove batch
          setBatches(prev => prev.filter(b => b.id !== data.batchId));
        } else if (data.type === 'menu_updated') {
          // Menu updated - reload from server
          fetch(getApiUrl('/menu/items')
            .then(res => res.json())
            .then(items => {
              if (Array.isArray(items) && items.length > 0) {
                // Normalizza gli ingredienti per ogni item
                const normalizedItems = items.map(item => ({
                  ...item,
                  ingredients: Array.isArray(item.ingredients) ? item.ingredients : []
                }));
                setMenu(normalizedItems);
              }
            })
            .catch(err => console.error('Error reloading menu:', err));
        } else if (data.type === 'categories_updated') {
          // Categories updated - reload from server
          fetch(getApiUrl('/menu/categories')
            .then(res => res.json())
            .then(categories => {
              if (Array.isArray(categories) && categories.length > 0) {
                setMenuCategories(categories);
              }
            })
            .catch(err => console.error('Error reloading categories:', err));
        } else if (data.type === 'quadrants_updated') {
          // Quadrants updated - reload from server
          fetch(getApiUrl('/quadrants')
            .then(res => res.json())
            .then(quadrantsData => {
              if (Array.isArray(quadrantsData) && quadrantsData.length > 0) {
                setQuadrants(quadrantsData);
              }
            })
            .catch(err => console.error('Error reloading quadrants:', err));
        } else if (data.type === 'locations_updated') {
          // Locations updated - reload from server
          fetch(getApiUrl('/config/locations')
            .then(res => res.json())
            .then(locationsData => {
              if (Array.isArray(locationsData) && locationsData.length > 0) {
                setLocations(locationsData);
              }
            })
            .catch(err => console.error('Error reloading locations:', err));
        } else if (data.type === 'slot_capacity_updated') {
          const slotCapacityData = data.slotCapacity;
          if (slotCapacityData) {
            setSlotCapacity(slotCapacityData);
          }
        } else if (data.type === 'rider_status_updated') {
          // Rider status updated - update local state
          setRiders(prev => 
            prev.map(r => r.id === data.riderId ? { ...r, status: data.newStatus } : r)
          );
        } else if (data.type === 'ingredients_updated') {
          // Ingredients updated - update local state
          if (Array.isArray(data.ingredients)) {
            setIngredients(data.ingredients);
          }
        }
        
        // Add notification for new orders
        if (data.type === 'new_order') {
          setNotifications(prev => [{
            id: `notif-${Date.now()}`,
            type: 'new_order',
            message: `Nuovo ordine ricevuto: ${data.order.id}`,
            timestamp: new Date(),
            read: false
          }, ...prev]);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected (Admin)');
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          // Reconnect logic would go here if needed
        }
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Save order sort preference
  useEffect(() => {
    localStorage.setItem('orderSortBy', orderSortBy);
  }, [orderSortBy]);

  // Slot capacity state
  const [slotCapacity, setSlotCapacity] = useState({
    globalMaxCapacity: 30,
    slots: [{
      time: '18:00',
      maxCapacity: 30,
      currentOrders: 0,
      riderCount: 2
    }, {
      time: '18:15',
      maxCapacity: 30,
      currentOrders: 0,
      riderCount: 2
    }, {
      time: '18:30',
      maxCapacity: 30,
      currentOrders: 1,
      riderCount: 3
    }, {
      time: '18:45',
      maxCapacity: 30,
      currentOrders: 2,
      riderCount: 3
    }, {
      time: '19:00',
      maxCapacity: 30,
      currentOrders: 5,
      riderCount: 4
    }, {
      time: '19:15',
      maxCapacity: 30,
      currentOrders: 8,
      riderCount: 4
    }, {
      time: '19:30',
      maxCapacity: 30,
      currentOrders: 10,
      riderCount: 5
    }, {
      time: '19:45',
      maxCapacity: 30,
      currentOrders: 12,
      riderCount: 5
    }, {
      time: '20:00',
      maxCapacity: 25,
      currentOrders: 15,
      riderCount: 5
    }, {
      time: '20:15',
      maxCapacity: 30,
      currentOrders: 8,
      riderCount: 4
    }, {
      time: '20:30',
      maxCapacity: 28,
      currentOrders: 5,
      riderCount: 4
    }, {
      time: '20:45',
      maxCapacity: 30,
      currentOrders: 3,
      riderCount: 3
    }, {
      time: '21:00',
      maxCapacity: 30,
      currentOrders: 2,
      riderCount: 3
    }, {
      time: '21:15',
      maxCapacity: 30,
      currentOrders: 1,
      riderCount: 2
    }, {
      time: '21:30',
      maxCapacity: 30,
      currentOrders: 0,
      riderCount: 2
    }, {
      time: '21:45',
      maxCapacity: 30,
      currentOrders: 0,
      riderCount: 2
    }, {
      time: '22:00',
      maxCapacity: 30,
      currentOrders: 0,
      riderCount: 2
    }]
  });

  // Derived state
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeBatches = batches.filter(b => b.status !== 'completed');
  const availableRiders = riders.filter(r => r.status === 'available');
  // Revenue is now calculated in DashboardView via useMemo

  // Calculate rider summaries
  const riderSummaries = useMemo((): RiderSummary[] => {
    return riders.map(rider => {
      const riderOrders = orders.filter(o => o.riderId === rider.id && o.status === 'delivered');
      const totalPizzas = riderOrders.reduce((sum, order) => {
        return sum + order.items.filter(item => item.id < 200).reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0);
      const cashAmount = riderOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
      const posAmount = riderOrders.filter(o => o.paymentMethod === 'pos_on_pickup').reduce((sum, o) => sum + o.total, 0);
      return {
        riderId: rider.id,
        riderName: rider.name,
        totalOrders: riderOrders.length,
        totalPizzas,
        cashAmount,
        posAmount,
        totalAmount: cashAmount + posAmount
      };
    });
  }, [orders, riders]);

  // --- Handlers ---

  const handleAddMenuItem = () => {
    setEditingMenuItem({
      id: Date.now(),
      name: '',
      description: '',
      price: 0,
      category: menuCategories[0]?.id || 'pizza',
      volumeUnit: 2.0,
      ingredients: []
    });
    setShowMenuItemModal(true);
  };
  const handleEditMenuItem = (item: MenuItem) => {
    // Assicurati che gli ingredienti siano sempre un array
    const normalizedItem = {
      ...item,
      ingredients: Array.isArray(item.ingredients) 
        ? item.ingredients.filter(ing => ing && ing.id && ing.name)
        : []
    };
    console.log('📝 Editing menu item:', {
      name: normalizedItem.name,
      category: normalizedItem.category,
      ingredientsCount: normalizedItem.ingredients.length,
      ingredients: normalizedItem.ingredients,
      availableIngredientsCount: ingredients.length
    });
    setEditingMenuItem(normalizedItem);
    setShowMenuItemModal(true);
  };
  const handleSaveMenuItem = async () => {
    if (!editingMenuItem) return;
    
    // Read values from refs (uncontrolled inputs)
    const name = menuItemNameRef.current?.value || editingMenuItem.name || '';
    const description = menuItemDescriptionRef.current?.value || editingMenuItem.description || '';
    const price = parseFloat(menuItemPriceRef.current?.value || '0') || editingMenuItem.price || 0;
    const volumeUnit = parseFloat(menuItemVolumeUnitRef.current?.value || '0') || editingMenuItem.volumeUnit || 0;
    
    // Assicurati che gli ingredienti siano sempre un array di oggetti con id e name
    const normalizedIngredients = Array.isArray(editingMenuItem.ingredients) 
      ? editingMenuItem.ingredients.filter(ing => ing && ing.id && ing.name)
      : [];
    
    const updatedItem = {
      ...editingMenuItem,
      name,
      description,
      price,
      volumeUnit,
      ingredients: normalizedIngredients
    };
    
    console.log('💾 Saving menu item with ingredients:', {
      name: updatedItem.name,
      category: updatedItem.category,
      ingredientsCount: normalizedIngredients.length,
      ingredients: normalizedIngredients
    });
    
    try {
      const existingIndex = menu.findIndex(m => m.id === editingMenuItem.id);
      let savedItem;
      
      if (existingIndex >= 0) {
        // Update existing item
        const response = await fetch(getApiUrl(`/menu/items/${editingMenuItem.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem)
        });
        savedItem = await response.json();
        // Normalizza gli ingredienti
        const normalizedSavedItem = {
          ...savedItem,
          ingredients: Array.isArray(savedItem.ingredients) 
            ? savedItem.ingredients.filter(ing => ing && ing.id && ing.name)
            : []
        };
        console.log('✅ Menu item updated with ingredients:', {
          name: normalizedSavedItem.name,
          ingredientsCount: normalizedSavedItem.ingredients.length,
          ingredients: normalizedSavedItem.ingredients
        });
        setMenu(menu.map(m => m.id === editingMenuItem.id ? normalizedSavedItem : m));
      } else {
        // Create new item
        const response = await fetch(getApiUrl('/menu/items'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem)
        });
        savedItem = await response.json();
        // Normalizza gli ingredienti
        const normalizedSavedItem = {
          ...savedItem,
          ingredients: Array.isArray(savedItem.ingredients) ? savedItem.ingredients : []
        };
        setMenu([...menu, normalizedSavedItem]);
      }
      
      setShowMenuItemModal(false);
      setEditingMenuItem(null);
    } catch (error) {
      console.error('Errore nel salvataggio del menu item:', error);
      // Fallback to local state
      const existingIndex = menu.findIndex(m => m.id === editingMenuItem.id);
      if (existingIndex >= 0) {
        setMenu(menu.map(m => m.id === editingMenuItem.id ? updatedItem : m));
      } else {
        setMenu([...menu, updatedItem]);
      }
      setShowMenuItemModal(false);
      setEditingMenuItem(null);
    }
  };
  const handleDeleteMenuItem = async (id: number) => {
    if (confirm('Sei sicuro di voler eliminare questo elemento?')) {
      try {
        await fetch(getApiUrl(`/menu/items/${id}`), {
          method: 'DELETE'
        });
        setMenu(menu.filter(m => m.id !== id));
      } catch (error) {
        console.error('Errore nell\'eliminazione del menu item:', error);
        setMenu(menu.filter(m => m.id !== id));
      }
    }
  };
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowEditOrderModal(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) {
      return;
    }
    
    try {
      const response = await fetch(getApiUrl(`/orders/${orderId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove from local state
        setOrders(orders.filter(o => o.id !== orderId));
        // WebSocket will also notify, but this is immediate
      } else {
        throw new Error('Errore nell\'eliminazione dell\'ordine');
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'ordine:', error);
      alert('Errore nell\'eliminazione dell\'ordine. Controlla la console per i dettagli.');
    }
  };
  const handleSaveOrder = async () => {
    if (!editingOrder) return;
    try {
      // Update order via API
      const response = await fetch(getApiUrl(`/orders/${editingOrder.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOrder)
      });
      const updatedOrder = await response.json();
      
      // Update local state
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setShowEditOrderModal(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'ordine:', error);
      // Fallback to local state
      const existingIndex = orders.findIndex(o => o.id === editingOrder.id);
      if (existingIndex >= 0) {
        const newOrders = [...orders];
        newOrders[existingIndex] = editingOrder;
        setOrders(newOrders);
      }
      setShowEditOrderModal(false);
      setEditingOrder(null);
    }
  };
  const handleUpdateRidersCount = (count: number) => {
    setCurrentRidersCount(Math.max(0, count));
  };
  const handleSaveWeeklySchedule = () => {
    setShowWeeklyScheduleModal(false);
  };
  const handleAssignRiderToOrder = async (orderId: string, riderId: string) => {
    try {
      // Assign rider via API
      const response = await fetch(getApiUrl(`/orders/${orderId}/assign`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId })
      });
      const updatedOrder = await response.json();
      
      // Update local state
      setOrders(orders.map(order => order.id === orderId ? updatedOrder : order));
      setShowRiderAssignmentModal(false);
      setSelectedOrderForRiderAssignment(null);
    } catch (error) {
      console.error('Errore nell\'assegnazione del rider:', error);
      // Fallback to local state
      setOrders(orders.map(order => order.id === orderId ? {
        ...order,
        riderId
      } : order));
      setShowRiderAssignmentModal(false);
      setSelectedOrderForRiderAssignment(null);
    }
  };
  const handleOpenRiderAssignment = (order: Order) => {
    setSelectedOrderForRiderAssignment(order);
    setShowRiderAssignmentModal(true);
  };
  const handleToggleActiveRider = (riderId: string) => {
    if (activeRiders.includes(riderId)) {
      setActiveRiders(activeRiders.filter(id => id !== riderId));
    } else {
      setActiveRiders([...activeRiders, riderId]);
    }
  };
  const handleAddBanner = () => {
    setEditingBanner({
      id: `BAN-${Date.now()}`,
      text: '',
      type: 'info',
      active: true,
      createdAt: new Date().toISOString()
    });
    setShowBannerModal(true);
  };
  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setShowBannerModal(true);
  };
  const handleSaveBanner = async () => {
    if (!editingBanner) return;
    
    // Read value from ref (uncontrolled input)
    const text = bannerTextRef.current?.value || editingBanner.text || '';
    
    const updatedBanner = {
      ...editingBanner,
      text
    };
    
    try {
      const existingIndex = banners.findIndex(b => b.id === editingBanner.id);
      let savedBanner;
      
      if (existingIndex >= 0) {
        // Update existing banner
        const response = await fetch(getApiUrl(`/config/banners/${editingBanner.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedBanner)
        });
        savedBanner = await response.json();
        setBanners(banners.map(b => b.id === editingBanner.id ? savedBanner : b));
      } else {
        // Create new banner
        const response = await fetch(getApiUrl('/config/banners'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedBanner)
        });
        savedBanner = await response.json();
        setBanners([...banners, savedBanner]);
      }
      
      setShowBannerModal(false);
      setEditingBanner(null);
    } catch (error) {
      console.error('Errore nel salvataggio del banner:', error);
      // Fallback to local state
      const existingIndex = banners.findIndex(b => b.id === editingBanner.id);
      if (existingIndex >= 0) {
        setBanners(banners.map(b => b.id === editingBanner.id ? updatedBanner : b));
      } else {
        setBanners([...banners, updatedBanner]);
      }
      setShowBannerModal(false);
      setEditingBanner(null);
    }
  };
  const handleDeleteBanner = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo avviso?')) {
      try {
        await fetch(getApiUrl(`/config/banners/${id}`), {
          method: 'DELETE'
        });
        setBanners(banners.filter(b => b.id !== id));
      } catch (error) {
        console.error('Errore nell\'eliminazione del banner:', error);
        setBanners(banners.filter(b => b.id !== id));
      }
    }
  };
  const handleToggleBannerActive = async (id: string) => {
    const banner = banners.find(b => b.id === id);
    if (!banner) return;
    
    try {
      const updatedBanner = { ...banner, active: !banner.active };
      await fetch(getApiUrl(`/config/banners/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBanner)
      });
      setBanners(banners.map(b => b.id === id ? updatedBanner : b));
    } catch (error) {
      console.error('Errore nell\'aggiornamento del banner:', error);
      setBanners(banners.map(b => b.id === id ? {
        ...b,
        active: !b.active
      } : b));
    }
  };
  const handleAddCategory = () => {
    setEditingCategory({
      id: `cat-${Date.now()}`,
      name: '',
      emoji: '📦'
    });
    setShowCategoryModal(true);
  };
  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };
  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    
    // Read values from refs (uncontrolled inputs)
    const name = categoryNameRef.current?.value || editingCategory.name || '';
    const emoji = categoryEmojiRef.current?.value || editingCategory.emoji || '';
    
    const updatedCategory = {
      ...editingCategory,
      name,
      emoji
    };
    
    try {
      const existingIndex = menuCategories.findIndex(c => c.id === editingCategory.id);
      let savedCategory;
      
      if (existingIndex >= 0) {
        // Update existing category
        const response = await fetch(getApiUrl(`/menu/categories/${editingCategory.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCategory)
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        savedCategory = await response.json();
        setMenuCategories(menuCategories.map(c => c.id === editingCategory.id ? savedCategory : c));
      } else {
        // Create new category
        const response = await fetch(getApiUrl('/menu/categories'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCategory)
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        savedCategory = await response.json();
        setMenuCategories([...menuCategories, savedCategory]);
      }
      
      setShowCategoryModal(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Errore nel salvataggio della categoria:', error);
      alert('Errore nel salvataggio. Controlla la console per i dettagli.');
    }
  };
  
  const handleDeleteCategory = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa categoria?')) {
      try {
        await fetch(getApiUrl(`/menu/categories/${id}`, {
          method: 'DELETE'
        });
        setMenuCategories(menuCategories.filter(c => c.id !== id));
      } catch (error) {
        console.error('Errore nell\'eliminazione della categoria:', error);
        alert('Errore nell\'eliminazione. Controlla la console per i dettagli.');
      }
    }
  };
  
  const handleSaveLocation = async (newLocations: Location[]) => {
    try {
      await fetch(getApiUrl('/config/locations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocations)
      });
      setLocations(newLocations);
    } catch (error) {
      console.error('Errore nel salvataggio delle locations:', error);
      setLocations(newLocations);
    }
  };
  
  const handleToggleRiderStatus = async (riderId: string) => {
    const rider = riders.find(r => r.id === riderId);
    if (!rider) return;
    
    try {
      const newStatus = rider.status === 'offline' ? 'available' : 'offline';
      const response = await fetch(getApiUrl(`/riders/${riderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedRider = await response.json();
      setRiders(riders.map(r => r.id === riderId ? updatedRider : r));
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello stato del fattorino:', error);
      alert('Errore nell\'aggiornamento dello stato. Controlla la console per i dettagli.');
    }
  };
  
  const handlePrintKitchenReceipt = (order: Order) => {
    setSelectedOrderForPrint(order);
    setShowKitchenPrintPreview(true);
  };

  // Load daily performance on mount
  useEffect(() => {
    const loadDailyPerformance = async () => {
      try {
        const response = await fetch(getApiUrl('/daily-performance');
        if (response.ok) {
          const data = await response.json();
          setDailyPerformance(data);
        }
      } catch (error) {
        console.error('Error loading daily performance:', error);
      }
    };
    loadDailyPerformance();
  }, []);

  // Save today's performance at end of day
  const saveTodayPerformance = async () => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => {
      const orderDate = o.orderDate || o.createdAt?.split('T')[0];
      return orderDate === today;
    });
    
    const performance = {
      date: today,
      totalOrders: todayOrders.length,
      totalRevenue: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      deliveredOrders: todayOrders.filter(o => o.status === 'delivered').length,
      activeRiders: riders.filter(r => r.status !== 'offline').length
    };

    try {
      const response = await fetch(getApiUrl('/daily-performance'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(performance)
      });
      if (response.ok) {
        const updated = await response.json();
        setDailyPerformance(updated);
        alert('Prestazioni di oggi salvate con successo!');
      }
    } catch (error) {
      console.error('Error saving daily performance:', error);
      alert('Errore nel salvataggio delle prestazioni');
    }
  };
  const handleSaveManualOrder = async (orderData: Partial<Order>) => {
    try {
      // Create order via API
      const orderPayload = {
        customer: orderData.customer!,
        items: orderData.items!,
        total: orderData.total!,
        status: 'pending',
        deliveryMethod: orderData.deliveryMethod!,
        paymentMethod: orderData.paymentMethod!,
        slot: orderData.slot!,
        orderDate: orderData.orderDate || (() => {
          const today = new Date();
          return today.toISOString().split('T')[0];
        })(),
        quadrante_id: orderData.quadrante_id
      };
      
      const response = await fetch(getApiUrl('/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const newOrder = await response.json();
      
      // Update local state (WebSocket will also notify, but this is immediate)
      setOrders([...orders, newOrder]);
      setShowManualOrderModal(false);
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine manuale:', error);
      // Fallback to local state
      const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        customer: orderData.customer!,
        items: orderData.items!,
        status: 'pending',
        total: orderData.total!,
        createdAt: new Date().toISOString(),
        deliveryMethod: orderData.deliveryMethod!,
        paymentMethod: orderData.paymentMethod!,
        slot: orderData.slot!,
        quadrante_id: orderData.quadrante_id,
        batchId: undefined,
        riderId: undefined
      };
      setOrders([...orders, newOrder]);
      setShowManualOrderModal(false);
    }
  };

  // Batch management handlers
  const handleUpdateBatch = async (batchId: string, updates: Partial<Batch>) => {
    try {
      const response = await fetch(getApiUrl(`/batches/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedBatch = await response.json();
      setBatches(batches.map(b => b.id === batchId ? updatedBatch : b));
    } catch (error) {
      console.error('Errore nell\'aggiornamento del batch:', error);
      // Fallback to local state
      setBatches(batches.map(b => b.id === batchId ? {
        ...b,
        ...updates
      } : b));
    }
  };
  const handleCreateBatch = async (batch: Omit<Batch, 'id'>) => {
    try {
      const response = await fetch(getApiUrl('/batches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch)
      });
      const newBatch = await response.json();
      setBatches([...batches, newBatch]);
    } catch (error) {
      console.error('Errore nella creazione del batch:', error);
      // Fallback to local state
      const newBatch: Batch = {
        ...batch,
        id: `BATCH-${Date.now().toString().slice(-6)}`
      };
      setBatches([...batches, newBatch]);
    }
  };
  const handleDeleteBatch = async (batchId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo batch? Gli ordini torneranno non assegnati.')) {
      try {
        const batch = batches.find(b => b.id === batchId);
        if (batch) {
          // Remove batch assignment from orders via API
          for (const orderId of batch.orders) {
            try {
              const order = orders.find(o => o.id === orderId);
              if (order) {
                await fetch(getApiUrl(`/orders/${orderId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...order, batchId: undefined, riderId: undefined })
                });
              }
            } catch (err) {
              console.error(`Errore nell'aggiornamento dell'ordine ${orderId}:`, err);
            }
          }
        }
        
        // Delete batch via API
        await fetch(getApiUrl(`/batches/${batchId}`, {
          method: 'DELETE'
        });
        
        // Update local state (WebSocket will also update, but this is immediate)
        setOrders(orders.map(o => o.batchId === batchId ? {
          ...o,
          batchId: undefined,
          riderId: undefined
        } : o));
        setBatches(batches.filter(b => b.id !== batchId));
      } catch (error) {
        console.error('Errore nell\'eliminazione del batch:', error);
        // Fallback to local state
        setOrders(orders.map(o => o.batchId === batchId ? {
          ...o,
          batchId: undefined,
          riderId: undefined
        } : o));
        setBatches(batches.filter(b => b.id !== batchId));
      }
    }
  };
  const handleAssignOrderToBatch = async (orderId: string, batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;
    
    // Update order to include batchId
    setOrders(orders.map(o => o.id === orderId ? {
      ...o,
      batchId,
      riderId: batch.fattorino_id || undefined
    } : o));

    // Update batch orders array locally
    if (!batch.orders.includes(orderId)) {
      const updatedBatch = {
        ...batch,
        orders: [...batch.orders, orderId]
      };
      
      // Update batch via API
      try {
        await fetch(getApiUrl(`/batches/${batchId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedBatch)
        });
        setBatches(batches.map(b => b.id === batchId ? updatedBatch : b));
      } catch (error) {
        console.error('Errore nell\'aggiornamento del batch:', error);
        setBatches(batches.map(b => b.id === batchId ? updatedBatch : b));
      }
    }
    
    // If batch has a rider assigned, assign order to rider
    if (batch.fattorino_id) {
      try {
        await fetch(getApiUrl(`/orders/${orderId}/assign`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ riderId: batch.fattorino_id })
        });
      } catch (error) {
        console.error('Errore nell\'assegnazione dell\'ordine al fattorino:', error);
      }
    }
  };
  const handleRemoveOrderFromBatch = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.batchId) return;
    if (confirm('Rimuovere questo ordine dal batch?')) {
      try {
        const batch = batches.find(b => b.id === order.batchId);
        
        // Update order via API
        await fetch(getApiUrl(`/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...order, batchId: undefined, riderId: undefined })
        });
        
        // Update batch via API
        if (batch) {
          const updatedBatch = {
            ...batch,
            orders: batch.orders.filter(oid => oid !== orderId)
          };
          await fetch(getApiUrl(`/batches/${batch.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedBatch)
          });
        }
        
        // Update local state
        setOrders(orders.map(o => o.id === orderId ? {
          ...o,
          batchId: undefined,
          riderId: undefined
        } : o));
        setBatches(batches.map(b => b.id === order.batchId ? {
          ...b,
          orders: b.orders.filter(oid => oid !== orderId)
        } : b));
      } catch (error) {
        console.error('Errore nella rimozione dell\'ordine dal batch:', error);
        // Fallback to local state
        setOrders(orders.map(o => o.id === orderId ? {
          ...o,
          batchId: undefined,
          riderId: undefined
        } : o));
        setBatches(batches.map(b => b.id === order.batchId ? {
          ...b,
          orders: b.orders.filter(oid => oid !== orderId)
        } : b));
      }
    }
  };
  const [selectedBatchSlot, setSelectedBatchSlot] = useState('20:00-20:15');

  // --- Views ---

  const CashierView = () => {
    // Include both pickup and delivery orders (delivery orders can be paid in store if customer comes)
    const allOrdersForPayment = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const pendingOrders = allOrdersForPayment;
    const completedOrdersToday = orders.filter(o => o.status === 'delivered');
    const totalCashToday = completedOrdersToday.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const totalPosToday = completedOrdersToday.filter(o => o.paymentMethod === 'pos_on_pickup').reduce((sum, o) => sum + o.total, 0);

    // State for change calculation
    const [amountReceived, setAmountReceived] = React.useState<{
      [orderId: string]: string;
    }>({});
    const handleCompletePayment = async (orderId: string, paymentMethod: PaymentMethod) => {
      try {
        // Update order status to delivered and mark as prepaid
        const response = await fetch(getApiUrl(`/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'delivered',
            paymentMethod,
            isPrepaid: true // Mark as prepaid so rider knows
          })
        });
        const updatedOrder = await response.json();
        
        // Update local state
        setOrders(orders.map(order => order.id === orderId ? {
          ...order,
          status: 'delivered' as OrderStatus,
          paymentMethod,
          isPrepaid: true
        } : order));
        
        // Clear the amount received for this order
        setAmountReceived(prev => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });
      } catch (error) {
        console.error('Errore nel completamento del pagamento:', error);
        alert('Errore nel completamento del pagamento. Controlla la console per i dettagli.');
      }
    };

    const handleUndoPayment = async (orderId: string) => {
      if (!confirm('Sei sicuro di voler annullare il pagamento di questo ordine? L\'ordine tornerà in attesa di pagamento.')) {
        return;
      }
      
      try {
        // Revert order status to ready or previous status
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        
        const response = await fetch(getApiUrl(`/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: order.status === 'delivered' ? 'ready' : order.status,
            isPrepaid: false
          })
        });
        const updatedOrder = await response.json();
        
        // Update local state
        setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
      } catch (error) {
        console.error('Errore nel completamento del pagamento:', error);
        // Fallback to local state
        setOrders(orders.map(order => order.id === orderId ? {
          ...order,
          status: 'delivered' as OrderStatus,
          paymentMethod
        } : order));
        setAmountReceived(prev => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });
      }
    };
    const calculateChange = (orderId: string, total: number) => {
      const received = parseFloat(amountReceived[orderId] || '0');
      if (received >= total) {
        return received - total;
      }
      return 0;
    };
    return <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cassa</h2>
            <p className="text-sm text-slate-600 mt-1">Gestisci i pagamenti degli ordini (ritiro e consegna)</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-600 uppercase">In Attesa</span>
            </div>
            <div className="text-3xl font-bold text-blue-900">{pendingOrders.length}</div>
            <p className="text-xs text-blue-700 mt-1">ordini da pagare</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-xs font-semibold text-green-600 uppercase">Contanti Oggi</span>
            </div>
            <div className="text-3xl font-bold text-green-900">{formatCurrency(totalCashToday)}</div>
            <p className="text-xs text-green-700 mt-1">
              {completedOrdersToday.filter(o => o.paymentMethod === 'cash').length} transazioni
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-semibold text-purple-600 uppercase">POS Oggi</span>
            </div>
            <div className="text-3xl font-bold text-purple-900">{formatCurrency(totalPosToday)}</div>
            <p className="text-xs text-purple-700 mt-1">
              {completedOrdersToday.filter(o => o.paymentMethod === 'pos_on_pickup').length} transazioni
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <h3 className="font-semibold text-orange-900 flex items-center">
              <Store className="w-5 h-5 mr-2" />
              Ordini da Pagare ({pendingOrders.length})
            </h3>
          </div>
          
          {pendingOrders.length === 0 ? <div className="p-12 text-center">
              <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nessun ordine in attesa di pagamento</p>
              <p className="text-sm text-slate-400 mt-1">Gli ordini appariranno qui quando saranno pronti</p>
            </div> : <div className="p-6 space-y-4">
              {pendingOrders.map(order => <motion.div key={order.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-lg font-bold text-slate-900">{order.id}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status === 'ready' ? 'Pronto per il Ritiro' : order.status === 'preparing' ? 'In Preparazione' : 'In Attesa'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600">
                          <User className="w-3 h-3 inline mr-1" />
                          <strong>Cliente:</strong> {order.customer.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          <Phone className="w-3 h-3 inline mr-1" />
                          <strong>Tel:</strong> {order.customer.phone}
                        </p>
                        <p className="text-sm text-slate-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          <strong>Orario:</strong> {order.slot}
                        </p>
                        <p className="text-sm text-slate-600">
                          {order.deliveryMethod === 'pickup' ? <Store className="w-3 h-3 inline mr-1" /> : <Bike className="w-3 h-3 inline mr-1" />}
                          <strong>Tipo:</strong> {order.deliveryMethod === 'pickup' ? 'Ritiro' : 'Consegna'}
                          {order.deliveryMethod === 'delivery' && <span className="text-xs text-slate-500 ml-1">(può pagare in negozio)</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-600 mb-1">
                        {formatCurrency(order.total)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.items.length} prodotti
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Dettaglio Ordine</h4>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-700">
                            {item.quantity}x {item.name}
                            {item.modifiers.length > 0 && <span className="text-xs text-slate-500 ml-2">
                                ({item.modifiers.join(', ')})
                              </span>}
                          </span>
                          <span className="font-medium text-slate-900">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>)}
                    </div>
                  </div>

                  {/* Payment Buttons */}
                  <div className="space-y-3">
                      {/* Cash Payment Section with Change Calculator */}
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-green-800 flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Pagamento Contanti
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-green-700 uppercase">
                            Importo Ricevuto (€)
                          </label>
                          <input type="number" step="0.01" min={order.total} value={amountReceived[order.id] || ''} onChange={e => {
                    const value = e.target.value;
                    setAmountReceived(prev => ({
                      ...prev,
                      [order.id]: value
                    }));
                  }} autoComplete="off" placeholder={`Min: ${formatCurrency(order.total)}`} className="w-full px-4 py-3 text-lg font-bold border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none" />
                        </div>
                        
                        {amountReceived[order.id] && parseFloat(amountReceived[order.id]) >= order.total && <div className="bg-white border-2 border-green-300 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-700">Resto da dare:</span>
                              <span className="text-3xl font-bold text-green-600">
                                {formatCurrency(calculateChange(order.id, order.total))}
                              </span>
                            </div>
                          </div>}
                        
                        <button onClick={() => handleCompletePayment(order.id, 'cash')} disabled={!amountReceived[order.id] || parseFloat(amountReceived[order.id]) < order.total} className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed">
                          <DollarSign className="w-5 h-5" />
                          <span>Conferma Pagamento Contanti</span>
                        </button>
                      </div>
                      
                      {/* POS Payment Button */}
                      <button onClick={() => handleCompletePayment(order.id, 'pos_on_pickup')} className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-200">
                        <CreditCard className="w-5 h-5" />
                        <span>Paga con POS</span>
                      </button>
                    </div>
                  
                </motion.div>)}
            </div>}
        </div>

        {/* Completed Orders Today */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Ordini Completati Oggi ({completedOrdersToday.length})
            </h3>
          </div>
          
          {completedOrdersToday.length === 0 ? <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Nessun ordine completato oggi
            </div> : <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Ordine
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Orario
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Pagamento
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap text-right">
                      Totale
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {completedOrdersToday.map(order => <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-3 font-mono text-sm text-slate-900 dark:text-white">{order.id}</td>
                      <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">{order.customer.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{order.slot}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.deliveryMethod === 'pickup' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' : 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300'}`}>
                          {order.deliveryMethod === 'pickup' ? '🏪 Ritiro' : '🚴 Consegna'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.paymentMethod === 'cash' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'}`}>
                          {order.paymentMethod === 'cash' ? '💵 Contanti' : '💳 POS'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleUndoPayment(order.id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Annulla Pagamento"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>}
        </div>
      </div>;
  };
  // Calculate revenue from orders
  const revenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + (order.total || 0), 0);
  }, [orders]);

  // Calculate chart data from actual orders
  const chartData = useMemo(() => {
    const hours = ['18:00', '19:00', '20:00', '21:00', '22:00'];
    return hours.map(hour => {
      const hourOrders = orders.filter(o => {
        if (!o.slot) return false;
        // Match orders by hour (e.g., "18:00", "18:15", "18:00-18:15" all match "18:00")
        return o.slot.startsWith(hour) || o.slot.includes(hour);
      });
      return {
        name: hour,
        orders: hourOrders.length
      };
    });
  }, [orders]);

  // Calculate trends based on daily performance history (removed - using state instead)

  const DashboardView = () => <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Ordini Totali" value={orders.length} subtext="Oggi" icon={ShoppingBag} trend={0} />
        <StatCard title="Ricavi" value={formatCurrency(revenue)} subtext="Lordi" icon={FileText} trend={0} />
        <StatCard title="Fattorini Attivi" value={riders.filter(r => r.status !== 'offline').length} subtext={`di ${riders.length} totali`} icon={Users} trend={0} />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-900">Gestione Fattorini Serata</h3>
          <div className="flex space-x-2">
            <button onClick={() => setShowActiveRidersModal(true)} className="flex items-center space-x-2 text-sm text-orange-600 hover:text-orange-700 font-medium">
              <Users className="w-4 h-4" />
              <span>Seleziona Fattorini Attivi ({activeRiders.length})</span>
            </button>
            <button onClick={() => setShowWeeklyScheduleModal(true)} className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-700 font-medium">
              <Calendar className="w-4 h-4" />
              <span>Pianificazione</span>
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-600">
            <span className="font-semibold">{activeRiders.length}</span> fattorini in servizio questa sera
          </div>
          <button onClick={() => setShowFiscalClosureModal(true)} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm">
            <FileText className="w-4 h-4" />
            <span>Chiusura Fiscale</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-900">Panoramica Ordini</h3>
            <select className="text-sm border-none bg-slate-50 rounded-md px-3 py-1 text-slate-600 outline-none">
              <option>Oggi</option>
              <option>Ieri</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{
                fill: '#94a3b8',
                fontSize: 12
              }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{
                fill: '#94a3b8',
                fontSize: 12
              }} />
                <Tooltip cursor={{
                fill: '#f8fafc'
              }} contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} />
                <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-semibold text-slate-900 mb-4">Stato Fattorini</h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {riders.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">
                Nessun fattorino disponibile
              </div> : riders.map(rider => <div key={rider.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getRiderStatusColor(rider.status)}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{rider.name}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {rider.status === 'available' ? 'Disponibile' :
                       rider.status === 'en_route' ? 'In viaggio' :
                       rider.status === 'delivering' ? 'In consegna' :
                       'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-700">
                      {rider.currentCapacity}/{rider.maxCapacity}
                    </div>
                    <div className="text-[10px] text-slate-400">Carico</div>
                  </div>
                  <button onClick={() => handleToggleRiderStatus(rider.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${rider.status === 'offline' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                    {rider.status === 'offline' ? 'Attiva' : 'Disattiva'}
                  </button>
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </div>;
  const OrdersView = () => <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Ordini in Tempo Reale</h2>
        <div className="flex space-x-3">
          <button onClick={() => setShowManualOrderModal(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200">
            <Plus className="w-4 h-4" />
            <span>Nuovo Ordine Manuale</span>
          </button>
          <button onClick={() => setShowEndOfEveningSummary(true)} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm shadow-green-200">
            <FileText className="w-4 h-4" />
            <span>Resoconto Serata</span>
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Cerca ID, nome..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  ID Ordine
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Cliente
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Orario
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Prodotti
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Fattorino
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Totale
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Stato
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {useMemo(() => {
                const sortedOrders = [...orders].sort((a, b) => {
                  if (orderSortBy === 'time') {
                    const timeA = a.slot || a.createdAt || '';
                    const timeB = b.slot || b.createdAt || '';
                    return timeA.localeCompare(timeB);
                  } else if (orderSortBy === 'products') {
                    return b.items.length - a.items.length;
                  } else if (orderSortBy === 'total') {
                    return b.total - a.total;
                  }
                  return 0;
                });
                return sortedOrders;
              }, [orders, orderSortBy]).map(order => {
              const assignedRider = riders.find(r => r.id === order.riderId);
              return <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">{order.id}</span>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{order.customer.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{order.customer.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {order.slot}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 dark:text-slate-300">{order.items.length} prodotti</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
                        {order.items.map(i => i.name).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleOpenRiderAssignment(order)} className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                        <Bike className="w-3 h-3" />
                        <span>{assignedRider ? assignedRider.name : 'Assegna'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(order.total)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {order.paymentMethod === 'cash' ? 'Contanti' : 'POS'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleEditOrder(order)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" title="Modifica Ordine">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePrintKitchenReceipt(order)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors" title="Stampa Scontrino Cucina">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteOrder(order.id)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Elimina Ordine">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
  const MenuView = () => {
    const [newIngredientName, setNewIngredientName] = useState('');
    const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
    const [editingIngredientName, setEditingIngredientName] = useState('');
    
    const handleAddIngredient = async () => {
      if (!newIngredientName.trim()) return;
      try {
        const response = await fetch(getApiUrl('/ingredients'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newIngredientName.trim() })
        });
        if (response.ok) {
          // Don't update local state - WebSocket will handle it
          setNewIngredientName('');
        }
      } catch (error) {
        console.error('Errore nell\'aggiunta dell\'ingrediente:', error);
      }
    };
    
    const handleDeleteIngredient = async (id: string) => {
      if (!confirm('Sei sicuro di voler eliminare questo ingrediente?')) return;
      try {
        const response = await fetch(getApiUrl(`/ingredients/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setIngredients(prev => prev.filter(ing => ing.id !== id));
        }
      } catch (error) {
        console.error('Errore nell\'eliminazione dell\'ingrediente:', error);
      }
    };
    
    const handleUpdateIngredient = async (id: string) => {
      if (!editingIngredientName.trim()) return;
      try {
        const response = await fetch(getApiUrl(`/ingredients/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editingIngredientName.trim() })
        });
        if (response.ok) {
          // Don't update local state - WebSocket will handle it
          setEditingIngredientId(null);
          setEditingIngredientName('');
        }
      } catch (error) {
        console.error('Errore nell\'aggiornamento dell\'ingrediente:', error);
      }
    };
    
    return <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gestione Menu</h2>
        <div className="flex space-x-3">
          <button onClick={handleAddCategory} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200">
            <Plus className="w-4 h-4" />
            <span>Aggiungi Categoria</span>
          </button>
          <button onClick={handleAddMenuItem} className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm shadow-orange-200">
            <Plus className="w-4 h-4" />
            <span>Aggiungi Prodotto</span>
          </button>
        </div>
      </div>
      
      {/* Gestione Ingredienti */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Gestione Ingredienti</h3>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newIngredientName}
            onChange={(e) => setNewIngredientName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
            placeholder="Nome ingrediente"
            className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={handleAddIngredient}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {ingredients.map(ing => (
            <div key={ing.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              {editingIngredientId === ing.id ? (
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingIngredientName}
                    onChange={(e) => setEditingIngredientName(e.target.value)}
                    className="flex-1 px-3 py-1 border border-slate-200 dark:border-slate-600 rounded text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none dark:bg-slate-600 dark:text-white"
                  />
                  <button
                    onClick={() => handleUpdateIngredient(ing.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => {
                      setEditingIngredientId(null);
                      setEditingIngredientName('');
                    }}
                    className="px-3 py-1 bg-slate-400 text-white rounded text-sm hover:bg-slate-500"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-slate-700 dark:text-white">{ing.name}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingIngredientId(ing.id);
                        setEditingIngredientName(ing.name);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      title="Modifica"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteIngredient(ing.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {ingredients.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Nessun ingrediente disponibile</p>
          )}
        </div>
      </div>

      {/* Categories Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Categorie Menu (Tendine)</h3>
        <div className="flex flex-wrap gap-2">
          {menuCategories.map(category => <div key={category.id} className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-xl">{category.emoji}</span>
              <span className="font-medium text-slate-900">{category.name}</span>
              <div className="flex space-x-1 ml-2">
                <button onClick={() => handleEditCategory(category)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={() => handleDeleteCategory(category.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>)}
        </div>
      </div>

      {/* Menu Items by Category */}
      {menuCategories.map(category => {
      const itemsInCategory = menu.filter(item => item.category === category.id);
      if (itemsInCategory.length === 0) return null;
      return <div key={category.id} className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
              <span className="text-2xl">{category.emoji}</span>
              <span>{category.name}</span>
              <span className="text-sm font-normal text-slate-500">({itemsInCategory.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemsInCategory.map(item => <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                    <UtensilsCrossed className="w-16 h-16 text-orange-300" />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      <span className="text-lg font-bold text-orange-600">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <span>Vol: {item.volumeUnit} unità</span>
                      <span className="capitalize">{category.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditMenuItem(item)} className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        Modifica
                      </button>
                      <button onClick={() => handleDeleteMenuItem(item.id)} className="flex-1 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        Elimina
                      </button>
                    </div>
                  </div>
                </div>)}
            </div>
          </div>;
    })}
    </div>
  };
  const BatchesView = () => <QuadrantBatchView quadrants={quadrants} orders={orders} batches={batches} fattorini={riders} selectedSlot={selectedBatchSlot} onSlotChange={setSelectedBatchSlot} onUpdateBatch={handleUpdateBatch} onCreateBatch={handleCreateBatch} onDeleteBatch={handleDeleteBatch} onAssignOrderToBatch={handleAssignOrderToBatch} onRemoveOrderFromBatch={handleRemoveOrderFromBatch} />;
  const BannersView = () => <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestione Avvisi Cliente</h2>
          <p className="text-sm text-slate-600 mt-1">Crea banner e notifiche che appariranno nell'app clienti</p>
        </div>
        <button onClick={handleAddBanner} className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm shadow-orange-200">
          <Plus className="w-4 h-4" />
          <span>Crea Avviso</span>
        </button>
      </div>

      <div className="space-y-3">
        {banners.map(banner => {
        const typeConfig = {
          info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-900',
            icon: '💡'
          },
          warning: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-900',
            icon: '⚠️'
          },
          success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-900',
            icon: '✅'
          },
          error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-900',
            icon: '❌'
          }
        };
        const config = typeConfig[banner.type];
        return <div key={banner.id} className={`${config.bg} border ${config.border} rounded-xl p-4 transition-all ${!banner.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-bold ${config.text}`}>{banner.text}</span>
                    {!banner.active && <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                          Disattivo
                        </span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    Creato: {new Date(banner.createdAt).toLocaleDateString('it-IT')}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button onClick={() => handleToggleBannerActive(banner.id)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${banner.active ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-300 text-slate-600 hover:bg-slate-400'}`}>
                    {banner.active ? 'Attivo' : 'Disattivo'}
                  </button>
                  <button onClick={() => handleEditBanner(banner)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Modifica">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteBanner(banner.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Elimina">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>;
      })}

        {banners.length === 0 && <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">Nessun avviso creato</p>
            <button onClick={handleAddBanner} className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              Crea il primo avviso
            </button>
          </div>}
      </div>
    </div>;
  const AuditLogView = () => <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registro Attività (Audit Log)</h2>
          <p className="text-sm text-slate-600 mt-1">Monitoraggio delle azioni di sistema e accessi amministrativi</p>
        </div>
        <button 
          onClick={() => {
            const logsText = auditLogs.map(log => 
              `${log.timestamp} | ${log.userRole || 'admin'} | ${log.action} | ${JSON.stringify(log.details)}`
            ).join('\n');
            const blob = new Blob([logsText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-log-${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
          }}
          className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Esporta Log</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Utente
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Azione
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Dettagli
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                    Nessuna attività registrata
                  </td>
                </tr>
              ) : (
                auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {new Date(log.timestamp).toLocaleString('it-IT')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <span className="inline-flex items-center space-x-2">
                        <Shield className="w-3 h-3 text-slate-400" />
                        <span>{log.userId || log.userRole || 'admin'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.action.includes('created') ? 'bg-green-100 text-green-800' : 
                        log.action.includes('updated') ? 'bg-blue-100 text-blue-800' : 
                        log.action.includes('deleted') ? 'bg-red-100 text-red-800' : 
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>;

  // --- Modals ---

  // Refs for menu item inputs to prevent focus loss
  const menuItemNameRef = useRef<HTMLInputElement>(null);
  const menuItemDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const menuItemPriceRef = useRef<HTMLInputElement>(null);
  const menuItemVolumeUnitRef = useRef<HTMLInputElement>(null);
  
  // Refs for category inputs to prevent focus loss
  const categoryNameRef = useRef<HTMLInputElement>(null);
  const categoryEmojiRef = useRef<HTMLInputElement>(null);
  
  // Refs for banner inputs to prevent focus loss
  const bannerTextRef = useRef<HTMLTextAreaElement>(null);

  const MenuItemModal = () => {
    if (!editingMenuItem) return null;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">
              {editingMenuItem.id === 0 ? 'Nuovo Prodotto' : 'Modifica Prodotto'}
            </h3>
            <button onClick={() => setShowMenuItemModal(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Nome *</label>
              <input ref={menuItemNameRef} type="text" defaultValue={editingMenuItem.name} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="es. Margherita" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Descrizione *
              </label>
              <textarea ref={menuItemDescriptionRef} defaultValue={editingMenuItem.description} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="Descrizione del prodotto" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Prezzo (€) *
                </label>
                <input ref={menuItemPriceRef} type="number" step="0.50" defaultValue={editingMenuItem.price} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="8.50" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Unità Volume *
                </label>
                <input ref={menuItemVolumeUnitRef} type="number" step="0.1" defaultValue={editingMenuItem.volumeUnit} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="2.0" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Categoria (Tendina) *
              </label>
              <select value={editingMenuItem.category} onChange={e => {
              const newCategory = e.target.value;
              setEditingMenuItem({
                ...editingMenuItem,
                category: newCategory,
                // Se si cambia a pizza e non ci sono ingredienti, inizializza come array vuoto
                ingredients: newCategory === 'pizza' ? (editingMenuItem.ingredients || []) : (editingMenuItem.ingredients || [])
              });
            }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                {menuCategories.map(cat => <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>)}
              </select>
            </div>
            
            {/* Mostra sempre la sezione ingredienti per tutti i prodotti */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Ingredienti del Prodotto
                </label>
                <div className="border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {ingredients.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Nessun ingrediente disponibile. Aggiungi ingredienti nella sezione "Gestione Ingredienti".
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {ingredients.map(ing => (
                        <label key={ing.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={editingMenuItem.ingredients?.some(i => i.id === ing.id) || false}
                            onChange={(e) => {
                              const currentIngredients = editingMenuItem.ingredients || [];
                              if (e.target.checked) {
                                setEditingMenuItem({
                                  ...editingMenuItem,
                                  ingredients: [...currentIngredients, ing]
                                });
                              } else {
                                setEditingMenuItem({
                                  ...editingMenuItem,
                                  ingredients: currentIngredients.filter(i => i.id !== ing.id)
                                });
                              }
                            }}
                            className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm text-slate-700">{ing.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
            <button onClick={() => setShowMenuItemModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
              Annulla
            </button>
            <button onClick={handleSaveMenuItem} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">
              Salva
            </button>
          </div>
        </div>
      </div>;
  };
  const CategoryModal = () => {
    if (!editingCategory) return null;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">
              {menuCategories.some(c => c.id === editingCategory.id) ? 'Modifica Categoria' : 'Nuova Categoria'}
            </h3>
            <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Nome Categoria *
              </label>
              <input ref={categoryNameRef} type="text" defaultValue={editingCategory.name} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="es. Antipasti" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Emoji/Icona *
              </label>
              <input ref={categoryEmojiRef} type="text" defaultValue={editingCategory.emoji} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="es. 🍴" maxLength={2} />
              <p className="text-xs text-slate-500 mt-1">
                Inserisci un'emoji o icona per rappresentare questa categoria
              </p>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
            <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
              Annulla
            </button>
            <button onClick={handleSaveCategory} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">
              Salva
            </button>
          </div>
        </div>
      </div>;
  };
  const EditOrderModal = () => {
    if (!editingOrder) return null;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">Modifica Ordine {editingOrder.id}</h3>
            <button onClick={() => setShowEditOrderModal(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Nome Cliente
                </label>
                <input type="text" value={editingOrder.customer.name} onChange={e => {
                const value = e.target.value;
                setEditingOrder(prev => prev ? {
                  ...prev,
                  customer: {
                    ...prev.customer,
                    name: value
                  }
                } : null);
              }} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="Mario Rossi" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Telefono</label>
                <input type="text" value={editingOrder.customer.phone} onChange={e => {
                const value = e.target.value;
                setEditingOrder(prev => prev ? {
                  ...prev,
                  customer: {
                    ...prev.customer,
                    phone: value
                  }
                } : null);
              }} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="+39 333 1234567" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Indirizzo</label>
              <input type="text" value={editingOrder.customer.address} onChange={e => {
              const value = e.target.value;
              setEditingOrder(prev => prev ? {
                ...prev,
                customer: {
                  ...prev.customer,
                  address: value
                }
              } : null);
            }} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="Via Roma 12, Castelfranco" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Stato</label>
                <select value={editingOrder.status} onChange={e => setEditingOrder({
                ...editingOrder,
                status: e.target.value as OrderStatus
              })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none">
                  <option value="pending">In Attesa</option>
                  <option value="preparing">In Preparazione</option>
                  <option value="ready">Pronto</option>
                  <option value="out_for_delivery">In Consegna</option>
                  <option value="delivered">Consegnato</option>
                  <option value="cancelled">Annullato</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Orario Slot
                </label>
                <input type="text" value={editingOrder.slot} onChange={e => {
                const value = e.target.value;
                setEditingOrder(prev => prev ? {
                  ...prev,
                  slot: value
                } : null);
              }} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="20:00-20:15" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Prodotti</label>
              <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50 max-h-40 overflow-y-auto">
                {editingOrder.items.map((item, idx) => <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>)}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
            <button onClick={() => setShowEditOrderModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
              Annulla
            </button>
            <button onClick={handleSaveOrder} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">
              Salva Modifiche
            </button>
          </div>
        </div>
      </div>;
  };
  const WeeklyScheduleModal = () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-green-100">
          <h3 className="text-lg font-bold text-slate-900">Pianificazione Settimanale Fattorini</h3>
          <button onClick={() => setShowWeeklyScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {weeklySchedule.map((day, idx) => <div key={day.dayOfWeek} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-medium text-slate-900">{day.dayOfWeek}</span>
              <div className="flex items-center space-x-3">
                <button onClick={() => {
              const newSchedule = [...weeklySchedule];
              newSchedule[idx].ridersCount = Math.max(0, newSchedule[idx].ridersCount - 1);
              setWeeklySchedule(newSchedule);
            }} className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-lg text-slate-900 w-10 text-center">{day.ridersCount}</span>
                <button onClick={() => {
              const newSchedule = [...weeklySchedule];
              newSchedule[idx].ridersCount += 1;
              setWeeklySchedule(newSchedule);
            }} className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>)}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
          <button onClick={() => setShowWeeklyScheduleModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
            Annulla
          </button>
          <button onClick={handleSaveWeeklySchedule} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">
            Salva Pianificazione
          </button>
        </div>
      </div>
    </div>;
  const RiderAssignmentModal = () => {
    if (!selectedOrderForRiderAssignment) return null;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">
              Assegna Fattorino - Ordine {selectedOrderForRiderAssignment.id}
            </h3>
            <button onClick={() => {
            setShowRiderAssignmentModal(false);
            setSelectedOrderForRiderAssignment(null);
          }} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-slate-600 mb-4">
              Seleziona un fattorino per questo ordine. Puoi cambiare l'assegnazione in qualsiasi momento.
            </p>
            {riders.map(rider => {
            const isAssigned = selectedOrderForRiderAssignment.riderId === rider.id;
            const riderOrders = orders.filter(o => o.riderId === rider.id && o.slot === selectedOrderForRiderAssignment.slot);
            return <button key={rider.id} onClick={() => handleAssignRiderToOrder(selectedOrderForRiderAssignment.id, rider.id)} className={`w-full p-4 rounded-xl border-2 transition-all ${isAssigned ? 'border-orange-600 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                          <Bike className="w-5 h-5" />
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getRiderStatusColor(rider.status)}`} />
                      </div>
                      <div>
                        <div className={`font-medium text-slate-900 ${isAssigned ? 'text-orange-600' : ''}`}>
                          {rider.name}
                        </div>
                        <div className="text-xs text-slate-500 capitalize">
                          {rider.status.replace('_', ' ')} • {riderOrders.length} ordini nello slot
                        </div>
                      </div>
                    </div>
                    {isAssigned && <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>}
                  </div>
                </button>;
          })}
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
            <button onClick={() => {
            setShowRiderAssignmentModal(false);
            setSelectedOrderForRiderAssignment(null);
          }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
              Chiudi
            </button>
          </div>
        </div>
      </div>;
  };
  const EndOfEveningSummaryModal = () => {
    const totalOrders = riderSummaries.reduce((sum, r) => sum + r.totalOrders, 0);
    const totalPizzas = riderSummaries.reduce((sum, r) => sum + r.totalPizzas, 0);
    const totalCash = riderSummaries.reduce((sum, r) => sum + r.cashAmount, 0);
    const totalPos = riderSummaries.reduce((sum, r) => sum + r.posAmount, 0);
    const totalRevenue = totalCash + totalPos;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-green-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Resoconto Fine Serata</h3>
                <p className="text-xs text-slate-600">Riepilogo completo per ogni fattorino</p>
              </div>
            </div>
            <button onClick={() => setShowEndOfEveningSummary(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-600 uppercase">Ordini Totali</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{totalOrders}</div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <PizzaIcon className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-semibold text-orange-600 uppercase">Pizze Totali</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{totalPizzas}</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-600 uppercase">Contanti</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{formatCurrency(totalCash)}</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-600 uppercase">POS</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">{formatCurrency(totalPos)}</div>
              </div>
            </div>

            {/* Riders Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                        Fattorino
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                        Ordini
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                        Pizze
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                        Contanti
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                        POS
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                        Totale
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riderSummaries.map(summary => <tr key={summary.riderId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                              <Bike className="w-4 h-4 text-slate-600" />
                            </div>
                            <span className="font-medium text-slate-900">{summary.riderName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {summary.totalOrders}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {summary.totalPizzas}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-green-600">
                            {formatCurrency(summary.cashAmount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-purple-600">
                            {formatCurrency(summary.posAmount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xl font-bold text-slate-900">
                            {formatCurrency(summary.totalAmount)}
                          </span>
                        </td>
                      </tr>)}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="px-6 py-4 text-slate-900">TOTALE</td>
                      <td className="px-6 py-4 text-center text-slate-900">{totalOrders}</td>
                      <td className="px-6 py-4 text-center text-slate-900">{totalPizzas}</td>
                      <td className="px-6 py-4 text-right text-green-700">
                        {formatCurrency(totalCash)}
                      </td>
                      <td className="px-6 py-4 text-right text-purple-700">
                        {formatCurrency(totalPos)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xl font-bold text-slate-900">
                          {formatCurrency(totalRevenue)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <div className="text-sm text-slate-600">
              Report generato il {new Date().toLocaleDateString('it-IT')} alle{' '}
              {new Date().toLocaleTimeString('it-IT')}
            </div>
            <div className="flex space-x-3">
              <button onClick={() => window.print()} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-slate-200">
                <Printer className="w-4 h-4" />
                <span>Stampa</span>
              </button>
              <button onClick={() => setShowEndOfEveningSummary(false)} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      </div>;
  };
  const ActiveRidersModal = () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Fattorini Attivi Stasera</h3>
              <p className="text-xs text-slate-600">Seleziona i fattorini disponibili per la serata</p>
            </div>
          </div>
          <button onClick={() => setShowActiveRidersModal(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-600 mb-4">
            Seleziona i fattorini che sono in servizio questa sera. Solo i fattorini selezionati riceveranno ordini.
          </p>
          {riders.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">
              Nessun fattorino disponibile. I fattorini verranno caricati automaticamente dal server.
            </div> : riders.map(rider => {
          const isActive = activeRiders.includes(rider.id);
          return <button key={rider.id} onClick={() => handleToggleActiveRider(rider.id)} className={`w-full p-4 rounded-xl border-2 transition-all ${isActive ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                        <Bike className="w-5 h-5" />
                      </div>
                      {isActive && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />}
                    </div>
                    <div className="text-left">
                      <div className={`font-medium text-slate-900 ${isActive ? 'text-blue-600' : ''}`}>
                        {rider.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isActive ? 'In servizio' : 'Non in servizio'}
                      </div>
                    </div>
                  </div>
                  {isActive && <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>}
                </div>
              </button>;
        })}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="text-sm text-slate-600">
            <span className="font-semibold">{activeRiders.length}</span> fattorini selezionati
          </div>
          <button onClick={() => setShowActiveRidersModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">
            Conferma Selezione
          </button>
        </div>
      </div>
    </div>;
  const FiscalClosureModal = () => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const cashOrders = orders.filter(o => o.paymentMethod === 'cash');
    const posOrders = orders.filter(o => o.paymentMethod === 'pos_on_pickup');
    const cashTotal = cashOrders.reduce((sum, o) => sum + o.total, 0);
    const posTotal = posOrders.reduce((sum, o) => sum + o.total, 0);
    const totalPizzas = orders.reduce((sum, order) => {
      return sum + order.items.filter(item => item.id < 200).reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-green-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Chiusura Fiscale Giornaliera</h3>
                <p className="text-xs text-slate-600">
                  {new Date().toLocaleDateString('it-IT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                </p>
              </div>
            </div>
            <button onClick={() => setShowFiscalClosureModal(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-600 uppercase">Ordini Totali</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{totalOrders}</div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <PizzaIcon className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-semibold text-orange-600 uppercase">Pizze Vendute</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{totalPizzas}</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-600 uppercase">Contanti</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{formatCurrency(cashTotal)}</div>
                <div className="text-xs text-green-700 mt-1">{cashOrders.length} transazioni</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-600 uppercase">POS</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">{formatCurrency(posTotal)}</div>
                <div className="text-xs text-purple-700 mt-1">{posOrders.length} transazioni</div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-80 mb-1">Incasso Totale Giornata</div>
                  <div className="text-4xl font-bold">{formatCurrency(totalRevenue)}</div>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Breakdown by Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                  Dettaglio Contanti
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Numero transazioni:</span>
                    <span className="font-medium text-slate-900">{cashOrders.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Importo medio:</span>
                    <span className="font-medium text-slate-900">
                      {cashOrders.length > 0 ? formatCurrency(cashTotal / cashOrders.length) : '€0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-900">Totale da versare:</span>
                    <span className="font-bold text-green-600 text-lg">{formatCurrency(cashTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-purple-600" />
                  Dettaglio POS
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Numero transazioni:</span>
                    <span className="font-medium text-slate-900">{posOrders.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Importo medio:</span>
                    <span className="font-medium text-slate-900">
                      {posOrders.length > 0 ? formatCurrency(posTotal / posOrders.length) : '€0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-900">Totale elettronico:</span>
                    <span className="font-bold text-purple-600 text-lg">{formatCurrency(posTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Riders Performance */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                <Bike className="w-4 h-4 mr-2 text-blue-600" />
                Performance Fattorini
              </h4>
              <div className="space-y-2">
                {riderSummaries.map(summary => <div key={summary.riderId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bike className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{summary.riderName}</div>
                        <div className="text-xs text-slate-500">
                          {summary.totalOrders} ordini • {summary.totalPizzas} pizze
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatCurrency(summary.totalAmount)}</div>
                      <div className="text-xs text-slate-500">
                        Cash: {formatCurrency(summary.cashAmount)} | POS: {formatCurrency(summary.posAmount)}
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <div className="text-sm text-slate-600">
              Report generato il {new Date().toLocaleDateString('it-IT')} alle{' '}
              {new Date().toLocaleTimeString('it-IT')}
            </div>
            <div className="flex space-x-3">
              <button onClick={() => window.print()} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-slate-200">
                <Printer className="w-4 h-4" />
                <span>Stampa</span>
              </button>
              <button onClick={() => setShowFiscalClosureModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      </div>;
  };
  const BannerModal = () => {
    if (!editingBanner) return null;
    const typeOptions: Array<{
      value: Banner['type'];
      label: string;
      icon: string;
    }> = [{
      value: 'info',
      label: 'Informazione',
      icon: '💡'
    }, {
      value: 'success',
      label: 'Successo',
      icon: '✅'
    }, {
      value: 'warning',
      label: 'Avviso',
      icon: '⚠️'
    }, {
      value: 'error',
      label: 'Errore',
      icon: '❌'
    }];
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">
              {banners.some(b => b.id === editingBanner.id) ? 'Modifica Avviso' : 'Nuovo Avviso'}
            </h3>
            <button onClick={() => setShowBannerModal(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Testo Avviso *
              </label>
              <textarea ref={bannerTextRef} defaultValue={editingBanner.text} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="es. Promo speciale: sconto 10% su tutti gli ordini!" rows={3} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Tipo Avviso *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {typeOptions.map(option => <button key={option.value} onClick={() => setEditingBanner({
                ...editingBanner,
                type: option.value
              })} className={`p-3 rounded-lg border-2 transition-all text-left ${editingBanner.type === option.value ? 'border-orange-600 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{option.icon}</span>
                      <span className="text-sm font-medium text-slate-900">{option.label}</span>
                    </div>
                  </button>)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">Attiva immediatamente</span>
              <button onClick={() => setEditingBanner({
              ...editingBanner,
              active: !editingBanner.active
            })} className={`relative w-12 h-6 rounded-full transition-colors ${editingBanner.active ? 'bg-green-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${editingBanner.active ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
            <button onClick={() => setShowBannerModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
              Annulla
            </button>
            <button onClick={handleSaveBanner} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">
              Salva
            </button>
          </div>
        </div>
      </div>;
  };
  const ManualOrderModal = () => {
    const [formData, setFormData] = useState({
      customerName: '',
      customerPhone: '',
      customerCountry: '',
      customerStreet: '',
      customerHouseNumber: '',
      customerBuzzerNote: '',
      deliveryMethod: 'delivery' as DeliveryMethod,
      paymentMethod: 'cash' as PaymentMethod,
      slot: '20:00-20:15',
      orderDate: (() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
      })(),
      selectedItems: [] as Array<{
        menuItem: MenuItem;
        quantity: number;
        modifiers: string[];
      }>,
      detectedQuadrant: null as Quadrant | null
    });
    const handleAddItem = (item: MenuItem) => {
      setFormData({
        ...formData,
        selectedItems: [...formData.selectedItems, {
          menuItem: item,
          quantity: 1,
          modifiers: []
        }]
      });
    };
    const handleRemoveItem = (index: number) => {
      const newItems = [...formData.selectedItems];
      newItems.splice(index, 1);
      setFormData({
        ...formData,
        selectedItems: newItems
      });
    };
    const handleUpdateQuantity = (index: number, delta: number) => {
      const newItems = [...formData.selectedItems];
      newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
      setFormData({
        ...formData,
        selectedItems: newItems
      });
    };
    const calculateTotal = () => {
      return formData.selectedItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
    };
    const handleSubmit = () => {
      if (!formData.customerName || !formData.customerPhone) {
        alert('Inserisci nome e telefono del cliente');
        return;
      }
      if (formData.selectedItems.length === 0) {
        alert('Aggiungi almeno un prodotto all\'ordine');
        return;
      }
      if (formData.deliveryMethod === 'delivery' && (!formData.customerCountry || !formData.customerStreet)) {
        alert('Inserisci paese e via per la consegna');
        return;
      }
      if (formData.deliveryMethod === 'delivery' && !formData.detectedQuadrant) {
        alert('La via selezionata non è coperta dal servizio di consegna');
        return;
      }
      const orderItems: OrderItem[] = formData.selectedItems.map(item => ({
        id: item.menuItem.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
        modifiers: item.modifiers
      }));
      handleSaveManualOrder({
        customer: {
          name: formData.customerName,
          phone: formData.customerPhone,
          address: formData.deliveryMethod === 'delivery' ? `${formData.customerStreet} ${formData.customerHouseNumber || ''}`.trim() : 'Ritiro in negozio',
          street: formData.deliveryMethod === 'delivery' ? formData.customerStreet : 'Ritiro in negozio',
          zoneId: formData.deliveryMethod === 'delivery' && formData.detectedQuadrant ? formData.detectedQuadrant.id : 0,
          buzzerNote: formData.customerBuzzerNote || ''
        },
        items: orderItems,
        total: calculateTotal(),
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        slot: formData.slot,
        orderDate: formData.orderDate as string,
        quadrante_id: formData.deliveryMethod === 'delivery' && formData.detectedQuadrant ? formData.detectedQuadrant.id : undefined
      });
    };
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Nuovo Ordine Manuale</h3>
                <p className="text-xs text-slate-600">Inserisci un ordine telefonico o da banco</p>
              </div>
            </div>
            <button onClick={() => setShowManualOrderModal(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Customer Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">Dati Cliente</h4>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Nome Cliente *
                  </label>
                  <input type="text" value={formData.customerName} onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    customerName: value
                  }));
                }} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Mario Rossi" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Telefono *
                  </label>
                  <input type="tel" value={formData.customerPhone} onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    customerPhone: value
                  }));
                }} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="+39 333 1234567" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Metodo Consegna *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setFormData({
                    ...formData,
                    deliveryMethod: 'delivery'
                  })} className={`p-3 rounded-lg border-2 transition-all ${formData.deliveryMethod === 'delivery' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <Bike className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">Consegna</div>
                    </button>
                    <button onClick={() => setFormData({
                    ...formData,
                    deliveryMethod: 'pickup'
                  })} className={`p-3 rounded-lg border-2 transition-all ${formData.deliveryMethod === 'pickup' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <Store className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">Ritiro</div>
                    </button>
                  </div>
                </div>

                {formData.deliveryMethod === 'delivery' && <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Paese *
                      </label>
                      <select value={formData.customerCountry} onChange={e => {
                    const country = e.target.value;
                    setFormData({
                      ...formData,
                      customerCountry: country,
                      customerStreet: '' // Reset street when country changes
                    });
                  }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                        <option value="">Seleziona il paese...</option>
                        {locations.map(loc => <option key={loc.paese} value={loc.paese}>{loc.paese}</option>)}
                      </select>
                    </div>

                    {formData.customerCountry && <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                          Via *
                        </label>
                        <select value={formData.customerStreet} onChange={e => {
                      const street = e.target.value;
                      const detectedQuad = detectQuadrantFromStreet(street, quadrants);
                      setFormData({
                        ...formData,
                        customerStreet: street,
                        detectedQuadrant: detectedQuad || null
                      });
                    }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                          <option value="">Seleziona la via...</option>
                          {locations.find(loc => loc.paese === formData.customerCountry)?.vie.map(via => <option key={via} value={via}>{via}</option>)}
                        </select>
                        {formData.detectedQuadrant && <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            Quadrante rilevato: {formData.detectedQuadrant.nome}
                          </div>}
                      </div>}

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Numero Civico
                      </label>
                      <input type="text" value={formData.customerHouseNumber || ''} onChange={e => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      customerHouseNumber: value
                    }));
                  }} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="12" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Note Citofono
                      </label>
                      <input type="text" value={formData.customerBuzzerNote || ''} onChange={e => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      customerBuzzerNote: value
                    }));
                  }} autoComplete="off" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Campanello Rossi" />
                    </div>
                  </>}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Data Ordine *
                  </label>
                  <input 
                    type="date" 
                    value={formData.orderDate} 
                    onChange={e => setFormData({ ...formData, orderDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Orario Slot *
                  </label>
                  <select value={formData.slot} onChange={e => setFormData({
                  ...formData,
                  slot: e.target.value
                })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none">
                    {slotCapacity.slots.map(slot => <option key={slot.time} value={`${slot.time}-${slot.time}`}>
                        {slot.time} (Cap: {slot.currentOrders}/{slot.maxCapacity})
                      </option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Metodo Pagamento *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setFormData({
                    ...formData,
                    paymentMethod: 'cash'
                  })} className={`p-3 rounded-lg border-2 transition-all ${formData.paymentMethod === 'cash' ? 'border-green-600 bg-green-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <DollarSign className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">Contanti</div>
                    </button>
                    <button onClick={() => setFormData({
                    ...formData,
                    paymentMethod: 'pos_on_pickup'
                  })} className={`p-3 rounded-lg border-2 transition-all ${formData.paymentMethod === 'pos_on_pickup' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <CreditCard className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">POS</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Products */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-900">Prodotti</h4>
                  <span className="text-sm text-slate-500">
                    {formData.selectedItems.length} articoli
                  </span>
                </div>

                {/* Selected Items */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto bg-slate-50 rounded-lg p-3">
                  {formData.selectedItems.length === 0 ? <p className="text-center text-slate-400 text-sm py-8">
                      Nessun prodotto selezionato
                    </p> : formData.selectedItems.map((item, idx) => <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{item.menuItem.name}</div>
                          <div className="text-xs text-slate-500">
                            {formatCurrency(item.menuItem.price)} × {item.quantity} = {formatCurrency(item.menuItem.price * item.quantity)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleUpdateQuantity(idx, -1)} className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(idx, 1)} className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                            <Plus className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleRemoveItem(idx)} className="ml-2 p-1.5 text-red-500 hover:bg-red-50 rounded-md">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>)}
                </div>

                {/* Menu Items to Add */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">Aggiungi Prodotti</h5>
                  <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto">
                    {menu.map(item => <button key={item.id} onClick={() => handleAddItem(item)} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
                        <div className="font-medium text-slate-900 text-sm">{item.name}</div>
                        <div className="text-xs text-slate-500">{formatCurrency(item.price)}</div>
                      </button>)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Totale Ordine</div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(calculateTotal())}</div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowManualOrderModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                Annulla
              </button>
              <button onClick={handleSubmit} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">
                Crea Ordine
              </button>
            </div>
          </div>
        </div>
      </div>;
  };
  const KitchenPrintModal = () => {
    if (!selectedOrderForPrint) return null;
    const handlePrint = () => {
      window.print();
    };
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-900">Scontrino Cucina</h3>
            <button onClick={() => setShowKitchenPrintPreview(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Print-friendly receipt */}
          <div id="kitchen-receipt" className="p-6">
            <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-slate-300">
              <div className="text-2xl font-bold mb-1">🍕 PIZZAFLOW</div>
              <div className="text-xs text-slate-500">ORDINE CUCINA</div>
            </div>

            <div className="mb-4 pb-4 border-b border-slate-200">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">ORDINE:</span>
                <span className="text-sm font-mono font-bold">{selectedOrderForPrint.id}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">ORARIO:</span>
                <span className="text-sm font-bold">{selectedOrderForPrint.slot}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">CLIENTE:</span>
                <span className="text-sm">{selectedOrderForPrint.customer.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">TELEFONO:</span>
                <span className="text-sm">{selectedOrderForPrint.customer.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">TIPO:</span>
                <span className="text-sm font-medium">
                  {selectedOrderForPrint.deliveryMethod === 'delivery' ? '🚴 CONSEGNA' : '🏪 RITIRO'}
                </span>
              </div>
              {selectedOrderForPrint.deliveryMethod === 'delivery' && <div className="flex justify-between">
                  <span className="text-xs font-semibold text-slate-500">INDIRIZZO:</span>
                  <span className="text-sm">{selectedOrderForPrint.customer.address}</span>
                </div>}
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-3">PRODOTTI DA PREPARARE</div>
              {selectedOrderForPrint.items.map((item, idx) => <div key={idx} className="mb-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-2xl font-bold">{item.quantity}x</span>
                    <span className="text-lg font-bold text-slate-900 flex-1 ml-3">{item.name}</span>
                  </div>
                  {item.modifiers.length > 0 && <div className="ml-12 mt-2 space-y-1">
                      {item.modifiers.map((mod, i) => <div key={i} className="text-sm text-orange-800 font-medium">
                          ➜ {mod}
                        </div>)}
                    </div>}
                </div>)}
            </div>

            <div className="border-t-2 border-dashed border-slate-300 pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold">TOTALE PRODOTTI:</span>
                <span className="font-bold">{selectedOrderForPrint.items.length}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold">TOTALE PIZZE:</span>
                <span className="font-bold">
                  {selectedOrderForPrint.items.filter(item => item.id < 200).reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              Stampato: {new Date().toLocaleString('it-IT')}
            </div>
          </div>
        </div>

        {/* Print-specific styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #kitchen-receipt, #kitchen-receipt * {
              visibility: visible;
            }
            #kitchen-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              font-family: 'Courier New', monospace;
            }
          }
        `}</style>
      </div>;
  };

  const SettingsView = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Impostazioni</h2>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Modalità Scura</h3>
            <p className="text-sm text-slate-500">Attiva o disattiva la modalità scura</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-orange-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Prestazioni Giornaliere</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Visualizza le prestazioni dei giorni precedenti per analizzare le tendenze.
        </p>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {dailyPerformance.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              Nessuna prestazione registrata. Le prestazioni vengono salvate automaticamente alla fine di ogni giornata.
            </div>
          ) : (
            dailyPerformance.slice().reverse().map((perf: any) => {
              const isToday = perf.date === new Date().toISOString().split('T')[0];
              return (
              <div key={perf.date} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {new Date(perf.date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    {isToday && <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">(Oggi)</span>}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      €{perf.totalRevenue?.toFixed(2) || '0.00'}
                    </span>
                    {isToday && (
                      <>
                        <button
                          onClick={async () => {
                            const newOrders = prompt('Nuovo numero ordini:', perf.totalOrders?.toString() || '0');
                            const newRevenue = prompt('Nuovo ricavo totale:', perf.totalRevenue?.toString() || '0');
                            if (newOrders !== null && newRevenue !== null) {
                              const updated = {
                                ...perf,
                                totalOrders: parseInt(newOrders) || 0,
                                totalRevenue: parseFloat(newRevenue) || 0
                              };
                              try {
                                const response = await fetch(getApiUrl('/daily-performance'), {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(updated)
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setDailyPerformance(data);
                                }
                              } catch (error) {
                                console.error('Errore nell\'aggiornamento:', error);
                              }
                            }
                          }}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Modifica"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Eliminare la prestazione di oggi?')) {
                              try {
                                const response = await fetch(getApiUrl(`/daily-performance/${perf.date}`, {
                                  method: 'DELETE'
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setDailyPerformance(data);
                                }
                              } catch (error) {
                                console.error('Errore nell\'eliminazione:', error);
                              }
                            }
                          }}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Elimina"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Ordini:</span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">{perf.totalOrders || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Consegnati:</span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">{perf.deliveredOrders || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Fattorini:</span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">{perf.activeRiders || 0}</span>
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={saveTodayPerformance}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm"
          >
            Salva Prestazioni di Oggi
          </button>
        </div>
      </div>
    </div>
  );

  const SlotManagementView = () => {
    const [editingSlot, setEditingSlot] = useState<{time: string; maxCapacity: number; riderCount: number} | null>(null);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Gestione Orari Slot</h2>
          <button
            onClick={async () => {
              const newTime = prompt('Inserisci nuovo orario (es. 18:00):');
              if (newTime) {
                const newSlot = {
                  time: newTime,
                  maxCapacity: 30,
                  currentOrders: 0,
                  riderCount: 2
                };
                const newCapacity = {
                  ...slotCapacity,
                  slots: [...slotCapacity.slots, newSlot]
                };
                try {
                  await fetch(getApiUrl('/config/slot-capacity'), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCapacity)
                  });
                  setSlotCapacity(newCapacity);
                } catch (error) {
                  console.error('Errore nell\'aggiunta dello slot:', error);
                  setSlotCapacity(newCapacity);
                }
              }
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Slot</span>
          </button>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {slotCapacity.slots.map((slot, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{slot.time}</div>
                  <div className="text-sm text-slate-500">
                    Capacità: {slot.currentOrders}/{slot.maxCapacity} • Fattorini: {slot.riderCount}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingSlot(slot)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Eliminare questo slot?')) {
                        const newCapacity = {
                          ...slotCapacity,
                          slots: slotCapacity.slots.filter((_, i) => i !== index)
                        };
                        try {
                          await fetch(getApiUrl('/config/slot-capacity'), {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newCapacity)
                          });
                          setSlotCapacity(newCapacity);
                        } catch (error) {
                          console.error('Errore nell\'eliminazione dello slot:', error);
                          setSlotCapacity(newCapacity);
                        }
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editingSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="font-semibold text-slate-900 mb-4">Modifica Slot {editingSlot.time}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Orario</label>
                  <input
                    type="text"
                    value={editingSlot.time}
                    onChange={e => setEditingSlot({...editingSlot, time: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="18:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Capacità Massima</label>
                  <input
                    type="number"
                    value={editingSlot.maxCapacity}
                    onChange={e => setEditingSlot({...editingSlot, maxCapacity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Numero Fattorini</label>
                  <input
                    type="number"
                    value={editingSlot.riderCount}
                    onChange={e => setEditingSlot({...editingSlot, riderCount: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      const newCapacity = {
                        ...slotCapacity,
                        slots: slotCapacity.slots.map(s => s.time === editingSlot.time ? {
                          ...editingSlot,
                          currentOrders: s.currentOrders || 0
                        } : s)
                      };
                      try {
                        await fetch(getApiUrl('/config/slot-capacity'), {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newCapacity)
                        });
                        setSlotCapacity(newCapacity);
                        setEditingSlot(null);
                      } catch (error) {
                        console.error('Errore nell\'aggiornamento dello slot:', error);
                        setSlotCapacity(newCapacity);
                        setEditingSlot(null);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => setEditingSlot(null)}
                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Main Render ---

  return <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-200">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              PizzaFlow
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Operazioni
          </div>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <SidebarItem icon={ShoppingBag} label="Ordini Live" active={activeView === 'orders'} onClick={() => setActiveView('orders')} />
          <SidebarItem icon={Users} label="Batch & Fattorini" active={activeView === 'batches'} onClick={() => setActiveView('batches')} />
          <SidebarItem icon={Clock} label="Vista Fasce Orarie" active={activeView === 'timeslots'} onClick={() => setActiveView('timeslots')} />

          <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Gestione
          </div>
          <SidebarItem icon={CreditCard} label="Cassa" active={activeView === 'cashier'} onClick={() => setActiveView('cashier')} />
          <SidebarItem icon={Menu} label="Menu" active={activeView === 'menu'} onClick={() => setActiveView('menu')} />
          <SidebarItem icon={Map} label="Zone" active={activeView === 'zones'} onClick={() => setActiveView('zones')} />
          <SidebarItem icon={MapPin} label="Paesi e Vie" active={activeView === 'locations'} onClick={() => setActiveView('locations')} />
          <SidebarItem icon={Bell} label="Avvisi Cliente" active={activeView === 'banners'} onClick={() => setActiveView('banners')} />
          <SidebarItem icon={Clock} label="Capacità Slot" active={activeView === 'capacity'} onClick={() => setActiveView('capacity')} />
          <SidebarItem icon={Clock} label="Gestione Orari" active={activeView === 'slots'} onClick={() => setActiveView('slots')} />
          <SidebarItem icon={FileText} label="Report" active={activeView === 'reports'} onClick={() => setActiveView('reports')} />
          <SidebarItem icon={Activity} label="Registro Attività" active={activeView === 'audit'} onClick={() => setActiveView('audit')} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
              AD
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Admin</p>
              <p className="text-xs text-slate-500">Gestore</p>
            </div>
            <button 
              onClick={() => setActiveView('settings')}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Impostazioni"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center text-slate-500 text-sm">
            <span className="hover:text-slate-900 cursor-pointer transition-colors">PizzaFlow</span>
            <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
            <span className="font-medium text-slate-900 capitalize">
              {activeView.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Sistema Attivo
            </div>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              title={darkMode ? 'Modalità chiara' : 'Modalità scura'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeView} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -10
          }} transition={{
            duration: 0.2
          }} className="h-full">
              {activeView === 'dashboard' && <DashboardView />}
              {activeView === 'orders' && <OrdersView />}
              {activeView === 'batches' && <BatchesView />}
              {activeView === 'timeslots' && <TimeSlotOrganizer 
                orders={orders} 
                batches={batches} 
                riders={riders} 
                quadrants={quadrants}
                onDeleteOrder={handleDeleteOrder}
                onEditOrder={handleEditOrder}
                onAssignRider={handleAssignRiderToOrder}
              />}
              {activeView === 'cashier' && <CashierView />}
              {activeView === 'menu' && <MenuView />}
              {activeView === 'zones' && <QuadrantManagement quadrants={quadrants} onUpdateQuadrants={setQuadrants} locations={locations} />}
              {activeView === 'locations' && <LocationManagement locations={locations} onUpdateLocations={async (newLocations) => {
                try {
                  // Save to API (if we have a location ID, update, otherwise create)
                  // For now, we'll save the entire locations array
                  await fetch(getApiUrl('/config/locations'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ locations: newLocations })
                  });
                  setLocations(newLocations);
                } catch (error) {
                  console.error('Errore nel salvataggio delle locations:', error);
                  setLocations(newLocations);
                }
              }} />}
              {activeView === 'banners' && <BannersView />}
              {activeView === 'capacity' && <SlotCapacityManagement slots={slotCapacity.slots} onUpdateSlots={async (updatedSlots) => {
              const newCapacity = {
                ...slotCapacity,
                slots: updatedSlots
              };
              try {
                await fetch(getApiUrl('/config/slot-capacity'), {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newCapacity)
                });
                setSlotCapacity(newCapacity);
              } catch (error) {
                console.error('Errore nel salvataggio della slot capacity:', error);
                setSlotCapacity(newCapacity);
              }
            }} globalMaxCapacity={slotCapacity.globalMaxCapacity} onUpdateGlobalCapacity={async (capacity) => {
              const newCapacity = {
                ...slotCapacity,
                globalMaxCapacity: capacity
              };
              try {
                await fetch(getApiUrl('/config/slot-capacity'), {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newCapacity)
                });
                setSlotCapacity(newCapacity);
              } catch (error) {
                console.error('Errore nel salvataggio della slot capacity:', error);
                setSlotCapacity(newCapacity);
              }
            }} />}
              {activeView === 'slots' && <SlotManagementView />}
              {activeView === 'settings' && <SettingsView />}
              {activeView === 'reports' && <DashboardView />}
              {activeView === 'audit' && <AuditLogView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      {showMenuItemModal && <MenuItemModal />}
      {showCategoryModal && <CategoryModal />}
      {showEditOrderModal && <EditOrderModal />}
      {showWeeklyScheduleModal && <WeeklyScheduleModal />}
      {showRiderAssignmentModal && <RiderAssignmentModal />}
      {showEndOfEveningSummary && <EndOfEveningSummaryModal />}
      {showActiveRidersModal && <ActiveRidersModal />}
      {showFiscalClosureModal && <FiscalClosureModal />}
      {showBannerModal && <BannerModal />}
      {showManualOrderModal && <ManualOrderModal />}
      {showKitchenPrintPreview && <KitchenPrintModal />}
      
      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed top-20 right-8 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Notifiche</h3>
            <button 
              onClick={() => setShowNotifications(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">Nessuna notifica</div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => {
                    setNotifications(prev => prev.map(n => n.id === notif.id ? {...n, read: true} : n));
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${!notif.read ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{notif.message}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {notif.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>;
};