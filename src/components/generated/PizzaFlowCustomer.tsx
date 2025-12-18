"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart, MapPin, Clock, CreditCard, Phone, User, Home, Search, ChevronRight, ChevronLeft, Plus, Minus, X, Check, Pizza, Bike, Store, Info, AlertCircle, Moon, Sun, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quadrant, detectQuadrantFromStreet, calculateSlotAvailability } from './QuadrantTypes';
import { apiClient } from '../../../shared/api/client';
import { getApiUrl, getWsUrl } from '../../../shared/config/api';

// --- Types ---

type DeliveryMethod = 'delivery' | 'pickup';
type PaymentMethod = 'cash' | 'pos_on_pickup';
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
  image?: string;
  volumeUnit: number;
  ingredients?: PizzaIngredient[]; // Ingredienti specifici per ogni pizza
}
interface Modifier {
  id: string;
  name: string;
  price: number;
  type: 'addition' | 'removal';
}
interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  modifiers: Modifier[];
}
interface Address {
  country: string;
  street: string;
  houseNumber: string;
  buzzerNote: string;
  customStreet?: string;
  zoneId?: number;
  quadrantId?: number;
}
interface TimeSlot {
  time: string;
  available: boolean;
  riderCount: number;
  remainingCapacity: number; // Capacità rimanente di pizze
}
interface Banner {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'success' | 'error';
  active: boolean;
}
interface MenuCategory {
  id: string;
  name: string;
  emoji: string;
}

// --- Mock Data ---

// Dynamic categories - these would come from admin panel
const MENU_CATEGORIES: MenuCategory[] = [{
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
const MENU_ITEMS: MenuItem[] = [{
  id: 101,
  name: 'Margherita',
  description: 'Salsa di pomodoro fresco, mozzarella, basilico',
  price: 8.50,
  category: 'pizza',
  volumeUnit: 2.0,
  ingredients: [{
    id: 'tomato',
    name: 'Pomodoro'
  }, {
    id: 'mozzarella',
    name: 'Mozzarella'
  }, {
    id: 'basil',
    name: 'Basilico'
  }]
}, {
  id: 102,
  name: 'Diavola',
  description: 'Salsa di pomodoro, mozzarella, salame piccante',
  price: 9.50,
  category: 'pizza',
  volumeUnit: 2.0,
  ingredients: [{
    id: 'tomato',
    name: 'Pomodoro'
  }, {
    id: 'mozzarella',
    name: 'Mozzarella'
  }, {
    id: 'spicy-salami',
    name: 'Salame piccante'
  }]
}, {
  id: 103,
  name: 'Capricciosa',
  description: 'Pomodoro, mozzarella, prosciutto, funghi, carciofi',
  price: 10.00,
  category: 'pizza',
  volumeUnit: 2.5,
  ingredients: [{
    id: 'tomato',
    name: 'Pomodoro'
  }, {
    id: 'mozzarella',
    name: 'Mozzarella'
  }, {
    id: 'ham',
    name: 'Prosciutto'
  }, {
    id: 'mushrooms',
    name: 'Funghi'
  }, {
    id: 'artichokes',
    name: 'Carciofi'
  }]
}, {
  id: 104,
  name: '4 Formaggi',
  description: 'Mozzarella, gorgonzola, fontina, parmigiano',
  price: 11.00,
  category: 'pizza',
  volumeUnit: 2.2,
  ingredients: [{
    id: 'mozzarella',
    name: 'Mozzarella'
  }, {
    id: 'gorgonzola',
    name: 'Gorgonzola'
  }, {
    id: 'fontina',
    name: 'Fontina'
  }, {
    id: 'parmesan',
    name: 'Parmigiano'
  }]
}, {
  id: 105,
  name: 'Vegetariana',
  description: 'Verdure grigliate, mozzarella, pomodoro',
  price: 9.00,
  category: 'pizza',
  volumeUnit: 2.0,
  ingredients: [{
    id: 'tomato',
    name: 'Pomodoro'
  }, {
    id: 'mozzarella',
    name: 'Mozzarella'
  }, {
    id: 'zucchini',
    name: 'Zucchine'
  }, {
    id: 'eggplant',
    name: 'Melanzane'
  }, {
    id: 'peppers',
    name: 'Peperoni'
  }]
}, {
  id: 201,
  name: 'Coca Cola 0.5L',
  description: 'Coca Cola classica',
  price: 2.50,
  category: 'drink',
  volumeUnit: 0.5
}, {
  id: 202,
  name: 'Acqua 0.5L',
  description: 'Acqua minerale naturale',
  price: 1.50,
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
const MODIFIERS: Modifier[] = [{
  id: 'extra-cheese',
  name: 'Mozzarella extra',
  price: 1.00,
  type: 'addition'
}, {
  id: 'extra-spicy',
  name: 'Extra piccante',
  price: 0.50,
  type: 'addition'
}, {
  id: 'gluten-free',
  name: 'Base senza glutine',
  price: 3.00,
  type: 'addition'
}];
const STREETS_BY_COUNTRY: Record<string, string[]> = {
  'Castelfranco': ['Via Roma', 'Corso Italia', 'Piazza Duomo', 'Via Garibaldi'],
  'Montebelluna': ['Via Dante', 'Via Mazzini', 'Corso Vittorio Emanuele'],
  'Treviso': ['Via Calmaggiore', 'Piazza dei Signori', 'Viale Burchiellati']
};

// Sistema dinamico di capacità per slot - modificabile dall'admin
const MAX_PIZZAS_PER_SLOT = 30; // Modificabile dall'admin

const TIME_SLOTS: TimeSlot[] = [{
  time: '18:00',
  available: true,
  riderCount: 2,
  remainingCapacity: 30
}, {
  time: '18:15',
  available: true,
  riderCount: 2,
  remainingCapacity: 30
}, {
  time: '18:30',
  available: true,
  riderCount: 3,
  remainingCapacity: 30
}, {
  time: '18:45',
  available: true,
  riderCount: 3,
  remainingCapacity: 30
}, {
  time: '19:00',
  available: true,
  riderCount: 4,
  remainingCapacity: 30
}, {
  time: '19:15',
  available: true,
  riderCount: 4,
  remainingCapacity: 30
}, {
  time: '19:30',
  available: true,
  riderCount: 5,
  remainingCapacity: 30
}, {
  time: '19:45',
  available: true,
  riderCount: 5,
  remainingCapacity: 30
}, {
  time: '20:00',
  available: true,
  riderCount: 5,
  remainingCapacity: 25
}, {
  time: '20:15',
  available: true,
  riderCount: 4,
  remainingCapacity: 30
}, {
  time: '20:30',
  available: true,
  riderCount: 4,
  remainingCapacity: 28
}, {
  time: '20:45',
  available: true,
  riderCount: 3,
  remainingCapacity: 30
}, {
  time: '21:00',
  available: true,
  riderCount: 3,
  remainingCapacity: 30
}, {
  time: '21:15',
  available: true,
  riderCount: 2,
  remainingCapacity: 30
}, {
  time: '21:30',
  available: true,
  riderCount: 2,
  remainingCapacity: 30
}, {
  time: '21:45',
  available: true,
  riderCount: 2,
  remainingCapacity: 30
}, {
  time: '22:00',
  available: true,
  riderCount: 2,
  remainingCapacity: 30
}];
const MOCK_QUADRANTS: Quadrant[] = [{
  id: 1,
  nome: 'Centro (Principale)',
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
  preferredSlots: ['19:00', '19:15', '20:00'] // Example preferred slots - updated to single times
}, {
  id: 3,
  nome: 'Sud',
  tipo_definizione: 'via_list',
  vie: ['Via Mazzini', 'Corso Vittorio Emanuele'],
  geo_polygon: null,
  adiacenti: [2],
  colore: '#10b981',
  priority: 2,
  preferredSlots: ['20:30', '20:45'] // Example preferred slots - updated to single times
}];
const MOCK_BANNERS: Banner[] = [{
  id: 'BAN-001',
  text: '🎉 Promo Weekend: Sconto 10% su ordini sopra €20!',
  type: 'success',
  active: true
}, {
  id: 'BAN-002',
  text: '⏰ Oggi consegne disponibili fino alle 23:00',
  type: 'info',
  active: true
}];

// --- Helper Functions ---

const formatPrice = (price: number) => `€${price.toFixed(2)}`;

// --- Components ---

const CategoryTab = ({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => <button onClick={onClick} className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${active ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}>
    {label}
  </button>;
const MenuItemCard = ({
  item,
  onAdd
}: {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) => <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-600 transition-all group">
    <div className="aspect-[2/1] bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center relative overflow-hidden">
      <Pizza className="w-12 h-12 text-orange-300 group-hover:scale-110 transition-transform" />
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-orange-600">
        {formatPrice(item.price)}
      </div>
    </div>
    <div className="p-3">
      <h3 className="font-bold text-slate-900 mb-1 text-sm">{item.name}</h3>
      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{item.description}</p>
      <button onClick={() => onAdd(item)} className="w-full py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center space-x-1">
        <Plus className="w-4 h-4" />
        <span>Aggiungi</span>
      </button>
    </div>
  </div>;
const CartItemComponent = ({
  item,
  onUpdateQuantity,
  onRemove
}: {
  item: CartItem;
  onUpdateQuantity: (delta: number) => void;
  onRemove: () => void;
}) => {
  const itemTotal = (item.menuItem.price + item.modifiers.reduce((sum, m) => sum + m.price, 0)) * item.quantity;
  return <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex items-start space-x-3">
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-slate-900">{item.menuItem.name}</h4>
          <button onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {item.modifiers.length > 0 && <div className="text-xs text-slate-500 mb-2 space-y-0.5">
            {item.modifiers.map(mod => <div key={mod.id} className={mod.type === 'removal' ? 'text-red-600' : ''}>
                {mod.type === 'removal' ? '− ' : '+ '}
                {mod.name} {mod.price > 0 && `(${formatPrice(mod.price)})`}
              </div>)}
          </div>}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 bg-slate-50 rounded-lg px-1 py-1">
            <button onClick={() => onUpdateQuantity(-1)} className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-medium text-slate-900 w-6 text-center">{item.quantity}</span>
            <button onClick={() => onUpdateQuantity(1)} className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="font-bold text-slate-900">{formatPrice(itemTotal)}</span>
        </div>
      </div>
    </div>;
};

// @component: PizzaFlowCustomer
export const PizzaFlowCustomer = () => {
  const [step, setStep] = useState<'menu' | 'customizer' | 'cart' | 'address' | 'slot' | 'payment' | 'confirmation'>('menu');
  const [category, setCategory] = useState<string>(''); // Inizia vuoto, verrà impostato quando vengono caricate le categorie
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [address, setAddress] = useState<Address>({
    country: '',
    street: '',
    houseNumber: '',
    buzzerNote: '',
    zoneId: undefined
  });
  const [detectedQuadrant, setDetectedQuadrant] = useState<Quadrant | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderDate, setOrderDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved === 'true' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // Inizia vuoto, verrà caricato dal server
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]); // Inizia vuoto, verrà caricato dal server
  const [banners, setBanners] = useState<Banner[]>(MOCK_BANNERS);
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(TIME_SLOTS);
  const [slotCapacity, setSlotCapacity] = useState<any>(null);
  const [locationsData, setLocationsData] = useState<Record<string, string[]>>(STREETS_BY_COUNTRY);
  const [quadrants, setQuadrants] = useState<Quadrant[]>(MOCK_QUADRANTS);
  const [availableIngredients, setAvailableIngredients] = useState<PizzaIngredient[]>([]);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  
  // Load menu data and slot capacity from server on mount
  useEffect(() => {
    const loadMenuData = async () => {
      try {
        const [itemsResponse, categoriesResponse, slotCapacityResponse, bannersResponse, ingredientsResponse] = await Promise.all([
          fetch(getApiUrl('/menu/items')),
          fetch(getApiUrl('/menu/categories')),
          fetch(getApiUrl('/config/slot-capacity')),
          fetch(getApiUrl('/config/banners')),
          fetch(getApiUrl('/ingredients'))
        ]);
        
        // Carica items e categorie in parallelo
        let loadedItems: MenuItem[] = [];
        let loadedCategories: MenuCategory[] = [];
        
        if (itemsResponse.ok) {
          const items = await itemsResponse.json();
          console.log('📥 Menu items received from server:', items);
          // Normalizza gli ingredienti per ogni item - assicurati che siano sempre array di oggetti con id e name
          loadedItems = Array.isArray(items) ? items.map(item => ({
            ...item,
            ingredients: Array.isArray(item.ingredients) 
              ? item.ingredients.map(ing => {
                  // Se è una stringa, prova a parsarla
                  if (typeof ing === 'string') {
                    const idMatch = ing.match(/id=([^;]+)/);
                    const nameMatch = ing.match(/name=([^}]+)/);
                    if (idMatch && nameMatch) {
                      return { id: idMatch[1].trim(), name: nameMatch[1].trim() };
                    }
                    return null;
                  }
                  // Se è un oggetto, assicurati che abbia id e name
                  return ing && typeof ing === 'object' && ing.id && ing.name 
                    ? { id: ing.id, name: ing.name } 
                    : null;
                }).filter(Boolean)
              : []
          })) : [];
          
          console.log('📥 Normalized menu items with ingredients:', loadedItems.map(item => ({
            name: item.name,
            ingredientsCount: item.ingredients?.length || 0,
            ingredients: item.ingredients
          })));
          setMenuItems(loadedItems);
          console.log(`✅ Menu caricato dal server: ${loadedItems.length} prodotti`);
        } else {
          console.error('❌ Errore nel caricamento del menu dal server:', itemsResponse.status, itemsResponse.statusText);
          const errorText = await itemsResponse.text();
          console.error('❌ Error response:', errorText);
          setMenuItems([]);
        }
        
        if (categoriesResponse.ok) {
          const categories = await categoriesResponse.json();
          console.log('📥 Categories received from server:', categories);
          // Usa sempre i dati dal server
          loadedCategories = Array.isArray(categories) ? categories : [];
          setMenuCategories(loadedCategories);
          console.log(`✅ Categorie caricate dal server: ${loadedCategories.length}`);
        } else {
          console.error('❌ Errore nel caricamento delle categorie dal server:', categoriesResponse.status, categoriesResponse.statusText);
          const errorText = await categoriesResponse.text();
          console.error('❌ Error response:', errorText);
          setMenuCategories([]);
        }
        
        // Imposta la categoria solo dopo aver caricato sia items che categorie
        if (loadedCategories.length > 0) {
          // Se non c'è categoria selezionata o la categoria corrente non esiste più, seleziona la prima
          if (!category || !loadedCategories.some(cat => cat.id === category)) {
            setCategory(loadedCategories[0].id);
            console.log(`📌 Categoria selezionata: ${loadedCategories[0].id} (${loadedCategories[0].name})`);
          }
        }
        
        if (slotCapacityResponse.ok) {
          const capacity = await slotCapacityResponse.json();
          setSlotCapacity(capacity);
          // Converti gli slot dal server in formato TimeSlot[]
          if (capacity.slots && Array.isArray(capacity.slots)) {
            const serverSlots: TimeSlot[] = capacity.slots.map((slot: any) => ({
              time: slot.time,
              available: (slot.maxCapacity - (slot.currentOrders || 0)) > 0,
              riderCount: slot.riderCount || 2,
              remainingCapacity: slot.maxCapacity - (slot.currentOrders || 0)
            }));
            // Se ci sono slot dal server, usali, altrimenti usa quelli statici
            if (serverSlots.length > 0) {
              setTimeSlots(serverSlots);
            }
          }
        }
        
        // Load banners
        if (bannersResponse.ok) {
          const bannersData = await bannersResponse.json();
          if (Array.isArray(bannersData)) {
            setBanners(bannersData.length > 0 ? bannersData : MOCK_BANNERS);
          }
        } else {
          setBanners(MOCK_BANNERS);
        }
        
        // Load ingredients
        try {
          if (ingredientsResponse && ingredientsResponse.ok) {
            const ingredientsData = await ingredientsResponse.json();
            if (Array.isArray(ingredientsData)) {
              setAvailableIngredients(ingredientsData);
              console.log(`✅ Ingredienti caricati: ${ingredientsData.length}`);
            }
          }
        } catch (error) {
          console.error('Errore nel caricamento degli ingredienti:', error);
        }
        
        // Load locations
        try {
          const locationsRes = await fetch(getApiUrl('/config/locations'));
          if (locationsRes.ok) {
            const locationsData = await locationsRes.json();
            if (Array.isArray(locationsData) && locationsData.length > 0) {
              // Convert locations array to STREETS_BY_COUNTRY format
              const newStreetsByCountry: Record<string, string[]> = {};
              locationsData.forEach((loc: any) => {
                if (loc.paese && loc.vie && Array.isArray(loc.vie)) {
                  newStreetsByCountry[loc.paese] = loc.vie;
                }
              });
              if (Object.keys(newStreetsByCountry).length > 0) {
                setLocationsData(newStreetsByCountry);
              }
            }
          }
        } catch (error) {
          console.error('Errore nel caricamento delle locations:', error);
        }
        
        // Load quadrants
        try {
          const quadrantsRes = await fetch(getApiUrl('/quadrants'));
          if (quadrantsRes.ok) {
            const quadrantsData = await quadrantsRes.json();
            if (Array.isArray(quadrantsData) && quadrantsData.length > 0) {
              setQuadrants(quadrantsData);
            }
          }
        } catch (error) {
          console.error('Errore nel caricamento dei quadranti:', error);
        }
      } catch (error) {
        console.error('❌ Errore nel caricamento del menu dal server:', error);
        // NON usare dati di prova - lascia vuoto
        setMenuItems([]);
        setMenuCategories([]);
      }
    };
    
    loadMenuData();
  }, []);
  
  // Imposta la categoria quando vengono caricate le categorie
  useEffect(() => {
    if (menuCategories.length > 0 && (!category || !menuCategories.some(cat => cat.id === category))) {
      setCategory(menuCategories[0].id);
      console.log(`📌 Categoria impostata via useEffect: ${menuCategories[0].id} (${menuCategories[0].name})`);
    }
  }, [menuCategories, category]);
  
  const filteredMenu = useMemo(() => {
    // Se non c'è categoria selezionata, mostra tutti gli items
    if (!category || category === '') {
      return menuItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category and search
    const filtered = menuItems.filter(item => {
      const matchesCategory = item.category === category;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    
    return filtered;
  }, [menuItems, category, searchQuery]);
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const modifiersTotal = item.modifiers.reduce((modSum, mod) => modSum + mod.price, 0);
      return sum + (item.menuItem.price + modifiersTotal) * item.quantity;
    }, 0);
  }, [cart]);
  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);
  const totalPizzasInCart = useMemo(() => {
    return cart.filter(item => item.menuItem.category === 'pizza').reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);
  const availableStreets = useMemo(() => {
    if (!address.country) return [];
    return locationsData[address.country] || STREETS_BY_COUNTRY[address.country] || [];
  }, [address.country, locationsData]);
  const activeBanners = useMemo(() => {
    return banners.filter(b => b.active && !dismissedBanners.includes(b.id));
  }, [banners, dismissedBanners]);

  // Filtra gli slot disponibili in base alla capacità rimanente
  const availableTimeSlots = useMemo(() => {
    // Determina quali slot usare: prima slotCapacity dal server, poi timeSlots, poi statici
    let slotsToProcess: TimeSlot[] = [];
    
    if (slotCapacity && slotCapacity.slots && Array.isArray(slotCapacity.slots) && slotCapacity.slots.length > 0) {
      // Usa gli slot dal server (priorità massima)
      slotsToProcess = slotCapacity.slots.map((serverSlot: any) => {
        const remaining = (serverSlot.maxCapacity || 30) - (serverSlot.currentOrders || 0);
        return {
          time: serverSlot.time,
          available: remaining > 0,
          riderCount: serverSlot.riderCount || 2,
          remainingCapacity: remaining
        };
      });
    } else if (timeSlots.length > 0) {
      // Usa gli slot caricati dinamicamente
      slotsToProcess = timeSlots;
    } else {
      // Fallback agli slot statici
      slotsToProcess = TIME_SLOTS;
    }
    
    // 1. Filter by capacity
    let slots = slotsToProcess.map(slot => ({
      ...slot,
      available: slot.remainingCapacity >= totalPizzasInCart && slot.available !== false
    }));

    // 2. Filter by 15 min buffer rule
    const now = new Date();
    // For testing purposes, uncomment to mock time (e.g. 19:50)
    // now.setHours(19, 50, 0, 0);

    slots = slots.map(slot => {
      const [hours, minutes] = slot.time.split(':').map(Number);
      const slotDate = new Date(now);
      slotDate.setHours(hours, minutes, 0, 0);

      // If slot is for tomorrow (e.g. it's 23:00 and we look at 18:00), 
      // simple comparison works for same-day logic. 
      // Assuming same-day ordering for now.

      const diffInMinutes = (slotDate.getTime() - now.getTime()) / (1000 * 60);

      // Slot must be at least 15 minutes in the future
      if (diffInMinutes < 15) {
        return {
          ...slot,
          available: false
        };
      }
      return slot;
    });

    // 3. Filter by Quadrant Preference (Delivery only)
    if (deliveryMethod === 'delivery' && detectedQuadrant) {
      // If quadrant is not main (priority != 1) and has preferred slots
      if (detectedQuadrant.priority !== 1 && detectedQuadrant.preferredSlots && detectedQuadrant.preferredSlots.length > 0) {
        // Mark non-preferred slots as unavailable or hide them? 
        // User said: "fare in modo che vengano eseguiti nella stessa fascia oraria"
        // Strict filtering seems appropriate to enforce the optimization.
        slots = slots.map(slot => {
          if (!detectedQuadrant.preferredSlots!.includes(slot.time)) {
            return {
              ...slot,
              available: false
            };
          }
          return slot;
        });
      }
      
      // 4. Consider adjacent quadrants for slot availability
      // If this quadrant has adjacencies, slots might be available through adjacent quadrants
      // This is informational - we show slots that are available in this quadrant or adjacent quadrants
      if (detectedQuadrant.adiacenti && detectedQuadrant.adiacenti.length > 0) {
        // Get adjacent quadrants
        const adjacentQuadrants = quadrants.filter(q => detectedQuadrant.adiacenti!.includes(q.id));
        // For each slot, check if it's available in this quadrant or any adjacent quadrant
        // This allows the system to show slots that might be available through adjacent quadrant capacity
        slots = slots.map(slot => {
          // If slot is already available, keep it
          if (slot.available) return slot;
          
          // Check if any adjacent quadrant has preferred slots that include this slot
          const isPreferredInAdjacent = adjacentQuadrants.some(aq => 
            aq.preferredSlots && aq.preferredSlots.includes(slot.time)
          );
          
          // If this slot is preferred in an adjacent quadrant, it might be available
          // (The actual capacity check is done server-side, but we can show it as potentially available)
          if (isPreferredInAdjacent) {
            return {
              ...slot,
              available: true // Mark as available if preferred in adjacent quadrant
            };
          }
          
          return slot;
        });
      }
    }
    return slots;
  }, [timeSlots, slotCapacity, totalPizzasInCart, deliveryMethod, detectedQuadrant, orderDate, quadrants]);

  // --- Handlers ---

  const handleAddToCart = (item: MenuItem) => {
    try {
      // Assicurati che gli ingredienti siano sempre un array
      const itemWithIngredients = {
        ...item,
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : []
      };
      setSelectedItem(itemWithIngredients);
      setSelectedModifiers([]);
      setQuantity(1);
      setIngredientSearchQuery(''); // Reset search
      setStep('customizer');
    } catch (error) {
      console.error('Errore nell\'aggiunta al carrello:', error);
      alert('Errore nell\'apertura del personalizzatore. Riprova.');
    }
  };
  const handleConfirmCustomization = () => {
    try {
      if (!selectedItem || !selectedItem.id) {
        console.error('handleConfirmCustomization: selectedItem is null or invalid');
        alert('Errore: prodotto non valido');
        setStep('menu');
        return;
      }
      const existingIndex = cart.findIndex(ci => ci.menuItem.id === selectedItem.id && JSON.stringify(ci.modifiers) === JSON.stringify(selectedModifiers));
      if (existingIndex >= 0) {
        const newCart = [...cart];
        newCart[existingIndex].quantity += (quantity || 1);
        setCart(newCart);
      } else {
        setCart([...cart, {
          menuItem: selectedItem,
          quantity: quantity || 1,
          modifiers: selectedModifiers || []
        }]);
      }
      setSelectedItem(null);
      setSelectedModifiers([]);
      setQuantity(1);
      setStep('menu');
    } catch (error) {
      console.error('Errore nella conferma della personalizzazione:', error);
      alert('Errore nell\'aggiunta al carrello. Riprova.');
    }
  };
  const handleUpdateCartItemQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };
  const handleRemoveCartItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };
  const handleProceedToAddress = () => {
    if (cart.length === 0) return;
    setStep('address');
  };
  // Refs for uncontrolled inputs to prevent focus loss
  const customStreetInputRef = useRef<HTMLInputElement>(null);
  const houseNumberInputRef = useRef<HTMLInputElement>(null);
  const buzzerNoteInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const ingredientSearchInputRef = useRef<HTMLInputElement>(null);

  const handleAddressConfirm = () => {
    // Read values from refs if using uncontrolled inputs, or from state
    const customStreet = customStreetInputRef.current?.value || address.customStreet || '';
    const houseNumber = houseNumberInputRef.current?.value || address.houseNumber || '';
    const buzzerNote = buzzerNoteInputRef.current?.value || address.buzzerNote || '';
    const name = nameInputRef.current?.value || customerInfo.name || '';
    const phone = phoneInputRef.current?.value || customerInfo.phone || '';
    
    // Update state with current values
    if (customStreetInputRef.current) {
      setAddress(prev => ({ ...prev, customStreet: customStreet }));
    }
    if (houseNumberInputRef.current) {
      setAddress(prev => ({ ...prev, houseNumber: houseNumber }));
    }
    if (buzzerNoteInputRef.current) {
      setAddress(prev => ({ ...prev, buzzerNote: buzzerNote }));
    }
    if (nameInputRef.current) {
      setCustomerInfo(prev => ({ ...prev, name: name }));
    }
    if (phoneInputRef.current) {
      setCustomerInfo(prev => ({ ...prev, phone: phone }));
    }
    
    if (deliveryMethod === 'delivery' && (!address.country || !address.street || !houseNumber)) {
      alert('Inserisci un indirizzo valido');
      return;
    }
    if (!name || !phone) {
      alert('Inserisci i tuoi dati di contatto');
      return;
    }
    if (deliveryMethod === 'delivery') {
      const streetToCheck = address.street === 'altro' && customStreet ? customStreet : address.street;
      if (address.street !== 'altro') {
        const quadrant = detectQuadrantFromStreet(streetToCheck, quadrants);
        if (!quadrant) {
          alert("La via selezionata non è al momento coperta dal servizio di consegna. Prova con un'altra via o seleziona il ritiro.");
          return;
        }
        setDetectedQuadrant(quadrant);
        setAddress({
          ...address,
          zoneId: quadrant.id,
          houseNumber: houseNumber,
          buzzerNote: buzzerNote,
          customStreet: customStreet
        });
      }
    }
    setStep('slot');
  };
  const handleSlotConfirm = () => {
    if (!selectedSlot) {
      alert('Seleziona un orario');
      return;
    }
    setStep('payment');
  };
  const handlePaymentConfirm = async () => {
    try {
      // Read values from refs (uncontrolled inputs) or state
      const customStreet = customStreetInputRef.current?.value || address.customStreet || '';
      const houseNumber = houseNumberInputRef.current?.value || address.houseNumber || '';
      const buzzerNote = buzzerNoteInputRef.current?.value || address.buzzerNote || '';
      const name = nameInputRef.current?.value || customerInfo.name || '';
      const phone = phoneInputRef.current?.value || customerInfo.phone || '';
      
      const orderPayload = {
        customer: {
          name: name,
          phone: phone,
          address: `${address.street === 'altro' ? customStreet : address.street} ${houseNumber || ''}`.trim(),
          street: address.street === 'altro' ? customStreet : address.street,
          zoneId: address.zoneId || detectedQuadrant?.id || 0,
          buzzerNote: buzzerNote
        },
        items: cart.map(ci => ({
          id: ci.menuItem.id,
          name: ci.menuItem.name,
          quantity: ci.quantity,
          price: ci.menuItem.price,
          modifiers: ci.modifiers.map(m => m.name)
        })),
        total: cartTotal,
        paymentMethod,
        deliveryMethod,
        slot: selectedSlot || 'ASAP',
        orderDate: orderDate,
        status: 'pending',
        quadrante_id: detectedQuadrant?.id
      };

      const order: any = await apiClient.createCustomerOrder(orderPayload);
      console.log('Ordine creato:', order);
      setOrderId(order?.id || `ORD-${Date.now().toString().slice(-6)}`);
      setBatchId(order?.batchId || '');
      setStep('confirmation');
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine:', error);
      alert('Errore nella creazione dell\'ordine. Riprova.');
    }
  };
  const toggleModifier = (modifier: Modifier) => {
    const exists = selectedModifiers.find(m => m.id === modifier.id);
    if (exists) {
      setSelectedModifiers(selectedModifiers.filter(m => m.id !== modifier.id));
    } else {
      setSelectedModifiers([...selectedModifiers, modifier]);
    }
  };
  const dismissBanner = (bannerId: string) => {
    setDismissedBanners([...dismissedBanners, bannerId]);
  };

  // Removed useCallback - using inline onChange handlers like in admin panel
  // This approach works better for mobile input fields

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // WebSocket for real-time menu updates
  useEffect(() => {
    const ws = new WebSocket(getWsUrl());
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', role: 'customer' }));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'menu_updated') {
          // Menu updated - reload menu items from server
          console.log('📡 Menu aggiornato via WebSocket, ricarico dal server...');
          try {
            const response = await fetch(getApiUrl('/menu/items'));
            if (response.ok) {
              const items = await response.json();
              // Normalizza gli ingredienti per ogni item - assicurati che siano sempre array di oggetti con id e name
              const normalizedItems = Array.isArray(items) ? items.map(item => ({
                ...item,
                ingredients: Array.isArray(item.ingredients) 
                  ? item.ingredients.map(ing => {
                      // Se è una stringa, prova a parsarla
                      if (typeof ing === 'string') {
                        const idMatch = ing.match(/id=([^;]+)/);
                        const nameMatch = ing.match(/name=([^}]+)/);
                        if (idMatch && nameMatch) {
                          return { id: idMatch[1].trim(), name: nameMatch[1].trim() };
                        }
                        return null;
                      }
                      // Se è un oggetto, assicurati che abbia id e name
                      return ing && typeof ing === 'object' && ing.id && ing.name 
                        ? { id: ing.id, name: ing.name } 
                        : null;
                    }).filter(Boolean)
                  : []
              })) : [];
              
              // Aggiorna solo gli items, mantenendo la categoria selezionata
              setMenuItems(normalizedItems);
              console.log(`✅ Menu aggiornato: ${normalizedItems.length} prodotti con ingredienti normalizzati`);
              
              // Mantieni la categoria selezionata se esiste ancora, altrimenti seleziona la prima
              if (normalizedItems.length > 0 && menuCategories.length > 0) {
                const currentCategoryExists = menuCategories.some(cat => cat.id === category);
                if (!currentCategoryExists && category) {
                  setCategory(menuCategories[0].id);
                  console.log(`📌 Categoria aggiornata: ${menuCategories[0].id} (la categoria precedente non esiste più)`);
                }
              }
            }
          } catch (error) {
            console.error('❌ Errore nel caricamento del menu aggiornato:', error);
          }
        } else if (data.type === 'categories_updated') {
          // Categories updated - reload categories
          console.log('Categorie aggiornate, ricarico dal server...');
          try {
            const response = await fetch(getApiUrl('/menu/categories'));
            if (response.ok) {
              const categories = await response.json();
              // Aggiorna sempre con i dati dal server
              const normalizedCategories = Array.isArray(categories) ? categories : [];
              setMenuCategories(normalizedCategories);
              console.log(`✅ Categorie aggiornate: ${normalizedCategories.length}`);
              // Imposta la prima categoria se non c'è categoria selezionata o se la categoria corrente non esiste più
              if (normalizedCategories.length > 0) {
                if (!category || !normalizedCategories.some(cat => cat.id === category)) {
                  setCategory(normalizedCategories[0].id);
                  console.log(`📌 Categoria aggiornata: ${normalizedCategories[0].id} (${normalizedCategories[0].name})`);
                }
              }
            }
          } catch (error) {
            console.error('Errore nel caricamento delle categorie aggiornate:', error);
          }
        } else if (data.type === 'banners_updated') {
          // Banners updated
          console.log('Avvisi aggiornati:', data.banners);
          if (data.banners && Array.isArray(data.banners)) {
            setBanners(data.banners);
          }
        } else if (data.type === 'ingredients_updated') {
          // Ingredients updated - update local state
          if (Array.isArray(data.ingredients)) {
            setAvailableIngredients(data.ingredients);
          }
        } else if (data.type === 'slots_updated') {
          // Slots updated - reload slot capacity from server
          console.log('Slot aggiornati, ricarico dal server...');
          try {
            const response = await fetch(getApiUrl('/config/slot-capacity'));
            if (response.ok) {
              const capacity = await response.json();
              setSlotCapacity(capacity);
              // Converti gli slot dal server in formato TimeSlot[]
              if (capacity.slots && Array.isArray(capacity.slots)) {
                const serverSlots: TimeSlot[] = capacity.slots.map((slot: any) => ({
                  time: slot.time,
                  available: (slot.maxCapacity - (slot.currentOrders || 0)) > 0,
                  riderCount: slot.riderCount || 2,
                  remainingCapacity: slot.maxCapacity - (slot.currentOrders || 0)
                }));
                // Aggiorna sempre gli slot, anche se vuoti (fallback a statici)
                setTimeSlots(serverSlots.length > 0 ? serverSlots : TIME_SLOTS);
              }
            }
          } catch (error) {
            console.error('Errore nel caricamento degli slot aggiornati:', error);
          }
        } else if (data.type === 'locations_updated') {
          // Locations updated
          console.log('Paesi e vie aggiornati:', data.locations);
          // Convert locations array to STREETS_BY_COUNTRY format
          if (Array.isArray(data.locations) && data.locations.length > 0) {
            const newStreetsByCountry: Record<string, string[]> = {};
            data.locations.forEach((loc: any) => {
              if (loc.paese && loc.vie && Array.isArray(loc.vie)) {
                newStreetsByCountry[loc.paese] = loc.vie;
              }
            });
            if (Object.keys(newStreetsByCountry).length > 0) {
              setLocationsData(newStreetsByCountry);
            }
          }
        } else if (data.type === 'quadrants_updated') {
          // Quadrants updated
          console.log('Quadranti aggiornati:', data.quadrants);
          if (Array.isArray(data.quadrants) && data.quadrants.length > 0) {
            setQuadrants(data.quadrants);
            // Re-detect quadrant if we have an address
            if (deliveryMethod === 'delivery' && address.street && address.street !== 'altro') {
              const streetToCheck = address.customStreet || address.street;
              const quadrant = detectQuadrantFromStreet(streetToCheck, data.quadrants);
              if (quadrant) {
                setDetectedQuadrant(quadrant);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => ws.close();
  }, []);

  // --- Views ---

  const MenuView = () => <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Pizza className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">PizzaFlow</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ordina ora, consegna veloce!</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title={darkMode ? 'Modalità chiara' : 'Modalità scura'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => cart.length > 0 && setStep('cart')} className="relative p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Cerca nel menu..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoComplete="off" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
        </div>
      </div>

      {/* Banners */}
      {activeBanners.length > 0 && <div className="px-4 pt-3 space-y-2">
          {activeBanners.map(banner => {
        const typeConfig = {
          info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-900'
          },
          warning: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-900'
          },
          success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-900'
          },
          error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-900'
          }
        };
        const config = typeConfig[banner.type];
        return <div key={banner.id} className={`${config.bg} border ${config.border} rounded-xl p-3 flex items-start justify-between animate-in slide-in-from-top duration-300`}>
                <p className={`text-sm font-medium ${config.text} flex-1`}>{banner.text}</p>
                <button onClick={() => dismissBanner(banner.id)} className="text-slate-400 hover:text-slate-600 ml-2 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>;
      })}
        </div>}

      {/* Category Tabs */}
      {menuCategories.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex space-x-2 overflow-x-auto">
          {menuCategories.map(cat => <CategoryTab key={cat.id} active={category === cat.id} label={`${cat.emoji} ${cat.name}`} onClick={() => setCategory(cat.id)} />)}
        </div>
      )}

      {/* Menu Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMenu.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <Pizza className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-500 text-center">
              {menuItems.length === 0 ? 'Nessun prodotto disponibile' : `Nessun prodotto in questa categoria (${category || 'nessuna categoria selezionata'})`}
            </p>
            {menuItems.length > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                Totale prodotti: {menuItems.length} | Categorie: {menuCategories.length}
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-24">
            {filteredMenu.map(item => <MenuItemCard key={item.id} item={item} onAdd={handleAddToCart} />)}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-20">
          <button onClick={() => setStep('cart')} className="w-full sm:w-auto bg-orange-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-orange-300 flex items-center justify-between space-x-4 hover:bg-orange-700 transition-all">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs opacity-90">Vedi Carrello</div>
                <div className="font-bold">{cartItemCount} prodotti</div>
              </div>
            </div>
            <div className="text-xl font-bold">{formatPrice(cartTotal)}</div>
          </button>
        </div>}
    </div>;
  const CustomizerView = () => {
    try {
      if (!selectedItem) {
        console.error('CustomizerView: selectedItem is null');
        return <div className="flex flex-col h-full bg-white dark:bg-slate-900 items-center justify-center p-6">
          <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
          <p className="text-slate-500">Errore: prodotto non selezionato</p>
          <button onClick={() => setStep('menu')} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg">
            Torna al Menu
          </button>
        </div>;
      }
      
      // Verifica se l'item è una pizza controllando la categoria
      const itemCategory = Array.isArray(menuCategories) 
        ? menuCategories.find(cat => cat && cat.id === selectedItem.category)
        : null;
      const isPizza = selectedItem.category === 'pizza' || 
                      (itemCategory && itemCategory.name && itemCategory.name.toLowerCase().includes('pizza'));
      
      console.log('🍕 CustomizerView:', {
        itemName: selectedItem.name,
        category: selectedItem.category,
        categoryName: itemCategory?.name,
        isPizza,
        availableIngredientsCount: Array.isArray(availableIngredients) ? availableIngredients.length : 0,
        itemIngredientsCount: Array.isArray(selectedItem.ingredients) ? selectedItem.ingredients.length : 0
      });
      
      // Crea modificatori di aggiunta basati sugli ingredienti disponibili (con ricerca)
      const safeAvailableIngredients = Array.isArray(availableIngredients) ? availableIngredients : [];
      const filteredIngredients = safeAvailableIngredients.filter(ing => 
        ing && ing.id && ing.name && ing.name.toLowerCase().includes((ingredientSearchQuery || '').toLowerCase())
      );
      const additionModifiers = filteredIngredients.map(ingredient => ({
        id: `add-${ingredient.id}`,
        name: ingredient.name || '',
        price: 0, // Gli ingredienti aggiunti non hanno costo extra per ora
        type: 'addition' as const
      }));
      
      // Crea modificatori di rimozione dinamici basati sugli ingredienti della pizza
      const itemIngredients = Array.isArray(selectedItem.ingredients) ? selectedItem.ingredients : [];
      const removalModifiers = itemIngredients.filter(ing => ing && ing.id && ing.name).map(ingredient => ({
        id: `remove-${ingredient.id}`,
        name: ingredient.name || '',
        price: 0,
        type: 'removal' as const
      }));
    
      console.log('🔧 Modifiers:', {
        additionModifiersCount: additionModifiers.length,
        removalModifiersCount: removalModifiers.length
      });
      
      return <div className="flex flex-col h-full bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center space-x-3">
          <button onClick={() => setStep('menu')} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Personalizza {selectedItem.name}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Item Info */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 text-center">
            <Pizza className="w-20 h-20 text-orange-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedItem.name || 'Prodotto'}</h3>
            <p className="text-sm text-slate-600">{selectedItem.description || ''}</p>
            <div className="mt-4 text-2xl font-bold text-orange-600">{formatPrice(selectedItem.price || 0)}</div>
          </div>

          {/* Ingredienti presenti */}
          {itemIngredients.length > 0 && <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Ingredienti presenti
              </h4>
              <div className="flex flex-wrap gap-2">
                {itemIngredients.filter(ing => ing && ing.id && ing.name).map(ingredient => <span key={ingredient.id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-blue-800 border border-blue-200">
                    {ingredient.name}
                  </span>)}
              </div>
            </div>}

          {/* Additions - Mostra sempre per tutti i prodotti */}
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                <Plus className="w-4 h-4 mr-2 text-green-600" />
                Aggiungi Ingredienti
              </h4>
              {/* Barra di ricerca per ingredienti */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={ingredientSearchInputRef}
                  type="text"
                  placeholder="Cerca ingredienti..."
                  defaultValue={ingredientSearchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setIngredientSearchQuery(value);
                  }}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white"
                />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {additionModifiers.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    {ingredientSearchQuery ? 'Nessun ingrediente trovato' : 'Nessun ingrediente disponibile'}
                  </p>
                ) : (
                  additionModifiers.map(modifier => {
                    const isSelected = selectedModifiers.some(m => m.id === modifier.id);
                    return <button key={modifier.id} onClick={() => toggleModifier(modifier)} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-green-600 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isSelected ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">{modifier.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {modifier.price > 0 ? `+${formatPrice(modifier.price)}` : 'Gratis'}
                        </span>
                      </button>;
                  })
                )}
              </div>
            </div>

            {/* Removals - Mostra se ci sono ingredienti da rimuovere */}
            {removalModifiers.length > 0 && <div className="mt-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                <Minus className="w-4 h-4 mr-2 text-red-600" />
                Rimuovi Ingredienti
              </h4>
              <div className="space-y-2">
                {removalModifiers.map(modifier => {
              const isSelected = selectedModifiers.some(m => m.id === modifier.id);
              return <button key={modifier.id} onClick={() => toggleModifier(modifier)} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-red-600 bg-red-100 dark:bg-red-900/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isSelected ? 'border-red-600 bg-red-600' : 'border-slate-300'}`}>
                          {isSelected && <X className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{modifier.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Gratis</span>
                    </button>;
            })}
              </div>
            </div>}

          {/* Quantity */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Quantità</h4>
            <div className="flex items-center space-x-4 bg-slate-50 rounded-xl px-4 py-3 w-fit">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-xl text-slate-900 w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-white space-y-3">
          <button onClick={handleConfirmCustomization} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 active:scale-95 transition-all shadow-lg shadow-orange-200">
            Aggiungi al Carrello •{' '}
            {formatPrice(((selectedItem?.price || 0) + (selectedModifiers?.reduce((sum, m) => sum + (m?.price || 0), 0) || 0)) * (quantity || 1))}
          </button>
        </div>
      </div>;
    } catch (error) {
      console.error('❌ Errore nel CustomizerView:', error);
      return <div className="flex flex-col h-full bg-white dark:bg-slate-900 items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-slate-500 mb-2">Errore nel caricamento del personalizzatore</p>
        <p className="text-xs text-slate-400 mb-4">{error instanceof Error ? error.message : 'Errore sconosciuto'}</p>
        <button onClick={() => setStep('menu')} className="px-4 py-2 bg-orange-600 text-white rounded-lg">
          Torna al Menu
        </button>
      </div>;
    }
  };
  const CartView = () => <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center space-x-3">
        <button onClick={() => setStep('menu')} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Il Tuo Carrello ({cartItemCount} prodotti)</h2>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.map((item, index) => <CartItemComponent key={index} item={item} onUpdateQuantity={delta => handleUpdateCartItemQuantity(index, delta)} onRemove={() => handleRemoveCartItem(index)} />)}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4 bg-white space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Totale</span>
          <span className="text-2xl font-bold text-slate-900">{formatPrice(cartTotal)}</span>
        </div>
        <button onClick={handleProceedToAddress} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 active:scale-95 transition-all shadow-lg shadow-orange-200">
          Procedi al Checkout
        </button>
      </div>
    </div>;
  const AddressView = () => <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center space-x-3">
        <button onClick={() => setStep('cart')} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Dettagli Consegna</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Order Date Selection */}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Data Ordine</h3>
          <input 
            type="date" 
            value={orderDate} 
            onChange={e => setOrderDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Delivery Method */}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Metodo di Consegna</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setDeliveryMethod('delivery')} className={`p-4 rounded-xl border-2 transition-all ${deliveryMethod === 'delivery' ? 'border-orange-600 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <Bike className={`w-6 h-6 mx-auto mb-2 ${deliveryMethod === 'delivery' ? 'text-orange-600' : 'text-slate-400'}`} />
              <div className="font-medium text-slate-900 text-sm">Consegna</div>
            </button>
            <button onClick={() => setDeliveryMethod('pickup')} className={`p-4 rounded-xl border-2 transition-all ${deliveryMethod === 'pickup' ? 'border-orange-600 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <Store className={`w-6 h-6 mx-auto mb-2 ${deliveryMethod === 'pickup' ? 'text-orange-600' : 'text-slate-400'}`} />
              <div className="font-medium text-slate-900 text-sm">Ritiro</div>
            </button>
          </div>
        </div>

        {deliveryMethod === 'delivery' && <>
            {/* Country Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Paese *</label>
              <select value={address.country} onChange={e => {
                const value = e.target.value;
                setAddress(prev => ({
                  ...prev,
                  country: value,
                  street: ''
                }));
              }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                <option value="">Seleziona il tuo paese...</option>
                {Object.keys(locationsData).length > 0 ? Object.keys(locationsData).map(country => <option key={country} value={country}>
                    {country}
                  </option>) : Object.keys(STREETS_BY_COUNTRY).map(country => <option key={country} value={country}>
                    {country}
                  </option>)}
              </select>
            </div>

            {/* Street Selection */}
            {address.country && <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Via *</label>
                <select value={address.street} onChange={e => {
                const value = e.target.value;
                setAddress(prev => ({
                  ...prev,
                  street: value,
                  customStreet: value === 'altro' ? '' : undefined
                }));
              }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                  <option value="">Seleziona la tua via...</option>
                  {availableStreets.map(street => <option key={street} value={street}>
                      {street}
                    </option>)}
                  <option value="altro">🔹 Altro (inserisci manualmente)</option>
                </select>
              </div>}

            {/* Custom Street Input */}
            {address.street === 'altro' && <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome Via *</label>
                <input ref={customStreetInputRef} type="text" defaultValue={address.customStreet || ''} placeholder="Inserisci il nome della via" autoComplete="off" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
              </div>}

            {/* House Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Numero Civico *</label>
              <input ref={houseNumberInputRef} type="text" defaultValue={address.houseNumber} placeholder="es. 12" autoComplete="off" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
            </div>

            {/* Buzzer Note */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Note Citofono / Piano
              </label>
              <input ref={buzzerNoteInputRef} type="text" defaultValue={address.buzzerNote} placeholder="es. Citofonare Rossi" autoComplete="off" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
            </div>
          </>}

        {/* Customer Info */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Informazioni di Contatto</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nome *</label>
              <input ref={nameInputRef} type="text" defaultValue={customerInfo.name} placeholder="Il tuo nome" autoComplete="off" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Telefono *</label>
              <input ref={phoneInputRef} type="tel" defaultValue={customerInfo.phone} placeholder="+39 333 123 4567" autoComplete="off" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <button onClick={handleAddressConfirm} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 active:scale-95 transition-all shadow-lg shadow-orange-200">
          Continua con Selezione Orario
        </button>
      </div>
    </div>;
  const SlotView = () => <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center space-x-3">
        <button onClick={() => setStep('address')} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-bold text-slate-900">
          {deliveryMethod === 'delivery' ? 'Seleziona Orario Consegna' : 'Seleziona Orario Ritiro'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Zone Info - Solo per consegna */}

        {/* Pizza Capacity Warning */}
        {totalPizzasInCart > 0 && <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start space-x-3">
            <Pizza className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-orange-800">
                Il tuo ordine contiene <strong>{totalPizzasInCart} pizze</strong>. Gli slot mostrano la
                disponibilità in base alla capacità del forno.
              </p>
            </div>
          </div>}

        {/* Time Slots */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Orari Disponibili</h3>
          <div className="space-y-2">
            {availableTimeSlots.map(slot => <button key={slot.time} onClick={() => slot.available && setSelectedSlot(slot.time)} disabled={!slot.available} className={`w-full p-4 rounded-xl border-2 transition-all ${selectedSlot === slot.time ? 'border-orange-600 bg-orange-50' : slot.available ? 'border-slate-200 bg-white hover:border-slate-300' : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className={`w-5 h-5 ${selectedSlot === slot.time ? 'text-orange-600' : slot.available ? 'text-slate-400' : 'text-slate-300'}`} />
                    <div className="text-left">
                      <div className={`font-semibold ${selectedSlot === slot.time ? 'text-orange-600' : 'text-slate-900'}`}>
                        {slot.time}
                      </div>
                      <div className="text-xs text-slate-500">
                        {slot.available ? `${deliveryMethod === 'delivery' ? `${slot.riderCount} fattorini disponibili` : 'Disponibile'}` : 'Capacità esaurita'}
                      </div>
                    </div>
                  </div>
                  {selectedSlot === slot.time && <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>}
                </div>
              </button>)}
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 mb-2">
              Gli orari indicano l'orario previsto di{' '}
              {deliveryMethod === 'delivery' ? 'consegna' : 'ritiro'}. Faremo del nostro meglio per rispettare
              l'orario selezionato!
            </p>
            {deliveryMethod === 'delivery' && <p className="text-xs text-amber-700">
                <strong>Sistema Quadranti:</strong> Gli ordini sono organizzati per zone adiacenti per
                ottimizzare le consegne. Ogni fattorino può consegnare max 3 ordini per giro.
              </p>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <button onClick={handleSlotConfirm} disabled={!selectedSlot} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 active:scale-95 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed">
          Continua con Pagamento
        </button>
      </div>
    </div>;
  const PaymentView = () => <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center space-x-3">
        <button onClick={() => setStep('slot')} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Metodo di Pagamento</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Payment Methods */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Seleziona Metodo di Pagamento</h3>
          <div className="space-y-3">
            <button onClick={() => setPaymentMethod('cash')} className={`w-full p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-orange-600 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">💵</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">Contanti</div>
                    <div className="text-xs text-slate-500">
                      Paga alla {deliveryMethod === 'delivery' ? 'consegna' : 'ritiro'}
                    </div>
                  </div>
                </div>
                {paymentMethod === 'cash' && <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>}
              </div>
            </button>

            <button onClick={() => setPaymentMethod('pos_on_pickup')} className={`w-full p-4 rounded-xl border-2 transition-all ${paymentMethod === 'pos_on_pickup' ? 'border-orange-600 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">Carta / POS</div>
                    <div className="text-xs text-slate-500">
                      Paga al {deliveryMethod === 'delivery' ? 'momento della consegna' : 'ritiro'}
                    </div>
                  </div>
                </div>
                {paymentMethod === 'pos_on_pickup' && <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>}
              </div>
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="font-semibold text-slate-900">Riepilogo Ordine</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotale ({cartItemCount} prodotti)</span>
              <span className="font-medium text-slate-900">{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">
                {deliveryMethod === 'delivery' ? 'Consegna' : 'Ritiro'}
              </span>
              <span className="font-medium text-green-600">Gratuita</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="font-semibold text-slate-900">Totale</span>
              <span className="font-bold text-xl text-orange-600">{formatPrice(cartTotal)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-slate-100 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">
              {deliveryMethod === 'delivery' ? 'Consegna a:' : 'Ritiro:'}
            </span>
            <span className="font-medium text-slate-900">
              {deliveryMethod === 'delivery' ? `${address.street === 'altro' ? address.customStreet : address.street} ${address.houseNumber}, ${address.country}` : 'In negozio'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Orario:</span>
            <span className="font-medium text-slate-900">{selectedSlot}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Contatto:</span>
            <span className="font-medium text-slate-900">{customerInfo.phone}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <button onClick={handlePaymentConfirm} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 active:scale-95 transition-all shadow-lg shadow-orange-200">
          Conferma Ordine • {formatPrice(cartTotal)}
        </button>
      </div>
    </div>;
  const [orderId, setOrderId] = useState<string>('');
  const [batchId, setBatchId] = useState<string>('');

  const ConfirmationView = () => {
    return <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
          <motion.div initial={{
          scale: 0
        }} animate={{
          scale: 1
        }} transition={{
          type: 'spring',
          duration: 0.5
        }} className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-200">
            <Check className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1 initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2
        }} className="text-3xl font-bold text-slate-900 mb-2 text-center">
            Ordine Confermato!
          </motion.h1>

          <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.3
        }} className="text-slate-600 text-center mb-8">
            Il tuo ordine è stato ricevuto ed è in preparazione
          </motion.p>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4
        }} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-6">
            {/* Order Details */}
            <div className="text-center border-b border-slate-100 pb-4">
              <div className="text-sm text-slate-500 mb-1">ID Ordine</div>
              <div className="text-2xl font-mono font-bold text-slate-900">{orderId || `ORD-${Date.now().toString().slice(-6)}`}</div>
              {batchId && <div className="text-xs text-slate-400 mt-2">Batch: {batchId}</div>}
            </div>

            {/* Status Timeline */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-semibold text-slate-900">Ordine Ricevuto</div>
                  <div className="text-xs text-slate-500">Proprio ora</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-semibold text-slate-900">In preparazione</div>
                  <div className="text-xs text-slate-500">In corso...</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {deliveryMethod === 'delivery' ? <Bike className="w-4 h-4 text-slate-400" /> : <Store className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-semibold text-slate-400">
                    {deliveryMethod === 'delivery' ? 'In consegna' : 'Pronto per il ritiro'}
                  </div>
                  <div className="text-xs text-slate-400">In attesa</div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-orange-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-orange-900 font-semibold">
                <Clock className="w-4 h-4" />
                <span>Previsto: {selectedSlot}</span>
              </div>
              <div className="text-sm text-orange-700">
                {deliveryMethod === 'delivery' ? `Consegna a ${address.street === 'altro' ? address.customStreet : address.street} ${address.houseNumber}, ${address.country}` : 'Ritiro in negozio'}
              </div>
            </div>

            {/* SMS Confirmation */}
            <div className="flex items-center space-x-2 text-sm text-slate-500 justify-center">
              <Check className="w-4 h-4 text-green-500" />
              <span>Conferma SMS inviata al {customerInfo.phone}</span>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.button initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.6
        }} onClick={() => {
          setCart([]);
          setStep('menu');
        }} className="mt-8 px-8 py-4 bg-white text-orange-600 rounded-xl font-bold border-2 border-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-lg">
            Ordina Altre Pizze!
          </motion.button>
        </div>
      </div>;
  };

  // --- Main Render ---

  return <div className="h-screen w-full bg-white overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: -20
      }} transition={{
        duration: 0.2
      }} className="h-full">
          {step === 'menu' && <MenuView />}
          {step === 'customizer' && <CustomizerView />}
          {step === 'cart' && <CartView />}
          {step === 'address' && <AddressView />}
          {step === 'slot' && <SlotView />}
          {step === 'payment' && <PaymentView />}
          {step === 'confirmation' && <ConfirmationView />}
        </motion.div>
      </AnimatePresence>
    </div>;
};