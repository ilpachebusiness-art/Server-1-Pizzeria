/**
 * Types for Quadrant-based Pizza Delivery System
 * Based on technical specification for territory subdivision and order assignment
 */

export type QuadrantDefinitionType = 'via_list' | 'geo_polygon';

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface Quadrant {
  id: number;
  nome: string;
  tipo_definizione: QuadrantDefinitionType;
  vie: string[]; // List of streets (for via_list mode)
  geo_polygon: GeoCoordinate[] | null; // Polygon coordinates (for map editor)
  adiacenti: number[]; // IDs of adjacent quadrants
  colore?: string; // UI color for visualization
  priority?: number; // Priority of the quadrant (1 = highest/main)
  preferredSlots?: string[]; // List of preferred time slots for this quadrant
}

export interface Batch {
  id: string;
  slot: string; // e.g., "20:15-20:30"
  quadrante_id: number;
  fattorino_id: string | null;
  orders: string[]; // Order IDs
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface Fattorino {
  id: string;
  name: string;
  status: 'available' | 'en_route' | 'delivering' | 'offline';
  currentBatches: string[]; // Batch IDs currently assigned
  maxOrdersPerTrip: number; // Default: 3
}

export interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    street: string;
    houseNumber: string;
  };
  items: any[];
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  deliveryMethod: 'delivery' | 'pickup';
  paymentMethod: 'cash' | 'pos_on_pickup';
  slot: string;
  quadrante_id?: number; // Automatically assigned based on street
  batch_id?: string;
}

export interface SlotAvailability {
  slot: string;
  available: boolean;
  capacita_totale: number; // Total capacity for this slot
  capacita_residua: number; // Remaining capacity
  fattorini_disponibili: number; // Available riders
  quadrante_id: number;
  quadranti_adiacenti: number[];
  messaggio?: string; // Message if not available
}

/**
 * Calculate slot availability for a given quadrant
 * Takes into account adjacent quadrants and rider capacity
 */
export function calculateSlotAvailability(
  quadrante: Quadrant,
  slot: string,
  allQuadrants: Quadrant[],
  fattorini: Fattorino[],
  existingBatches: Batch[],
  existingOrders: Order[]
): SlotAvailability {
  // Find available riders (not already assigned to this slot)
  const availableRiders = fattorini.filter(f => {
    if (f.status !== 'available') return false;
    // Check if rider already has a batch in this slot
    const riderBatchesInSlot = existingBatches.filter(
      b => b.slot === slot && b.fattorino_id === f.id
    );
    return riderBatchesInSlot.length === 0;
  });

  const numAvailableRiders = availableRiders.length;
  const maxOrdersPerRider = 3;
  const capacitaTotale = numAvailableRiders * maxOrdersPerRider;

  // Get adjacent quadrant IDs
  const adjacentQuadrantIds = quadrante.adiacenti || [];
  const relevantQuadrantIds = [quadrante.id, ...adjacentQuadrantIds];

  // Count orders already in this slot for this quadrant + adjacent quadrants
  const ordersInSlot = existingOrders.filter(
    o => o.slot === slot && o.quadrante_id && relevantQuadrantIds.includes(o.quadrante_id)
  );

  const capacitaResidua = capacitaTotale - ordersInSlot.length;
  const available = capacitaResidua > 0;

  let messaggio: string | undefined;
  if (!available) {
    messaggio = `Questo orario è pieno nella tua zona di consegna. Il ritardo dipende dal numero attuale di consegne nel tuo quadrante.`;
  }

  return {
    slot,
    available,
    capacita_totale: capacitaTotale,
    capacita_residua: capacitaResidua,
    fattorini_disponibili: numAvailableRiders,
    quadrante_id: quadrante.id,
    quadranti_adiacenti: adjacentQuadrantIds,
    messaggio,
  };
}

/**
 * Assign order to batch using quadrant-based heuristic
 * Priority:
 * 1. Batch in same quadrant with < 3 orders
 * 2. Batch in adjacent quadrant with < 3 orders
 * 3. Create new batch in same quadrant
 * 4. Suggest next available slot
 */
export function assignOrderToBatch(
  order: Order,
  quadrante: Quadrant,
  allQuadrants: Quadrant[],
  existingBatches: Batch[],
  fattorini: Fattorino[]
): { success: boolean; batch_id?: string; messaggio?: string; suggested_slot?: string } {
  const slot = order.slot;
  const quadranteId = order.quadrante_id!;
  const adjacentQuadrantIds = quadrante.adiacenti || [];
  const maxOrdersPerBatch = 3;

  // Determine priority (default to 1 if undefined)
  const isMainQuadrant = (quadrante.priority || 1) === 1;

  // Find batches in this slot
  const batchesInSlot = existingBatches.filter(b => b.slot === slot && b.status !== 'completed');

  // Priority 1: Same quadrant batch with space
  const sameQuadrantBatch = batchesInSlot.find(
    b => b.quadrante_id === quadranteId && b.orders.length < maxOrdersPerBatch
  );
  if (sameQuadrantBatch) {
    return {
      success: true,
      batch_id: sameQuadrantBatch.id,
      messaggio: 'Ordine assegnato al batch dello stesso quadrante',
    };
  }

  // Priority 2: Adjacent quadrant batch with space
  // Rule: If "changing town" (non-main quadrant), do deliveries ONLY for that town.
  // So if we are in a non-main quadrant, we DO NOT mix with adjacent quadrants.
  if (isMainQuadrant) {
    const adjacentQuadrantBatch = batchesInSlot.find(
      b => {
        // Only join adjacent batches if they are also main quadrants? 
        // Or if the batch's quadrant allows mixing.
        // For simplicity, if this order is Main, it can join adjacent Main batches.
        // We should check the target batch's quadrant priority too.
        const batchQuadrant = allQuadrants.find(q => q.id === b.quadrante_id);
        const isBatchMain = (batchQuadrant?.priority || 1) === 1;
        
        return adjacentQuadrantIds.includes(b.quadrante_id) && 
               b.orders.length < maxOrdersPerBatch &&
               isBatchMain; // Only mix with other Main quadrants
      }
    );
    if (adjacentQuadrantBatch) {
      return {
        success: true,
        batch_id: adjacentQuadrantBatch.id,
        messaggio: 'Ordine assegnato al batch di un quadrante adiacente',
      };
    }
  }

  // Priority 3: Create new batch if rider available
  const availableRider = fattorini.find(f => {
    if (f.status !== 'available') return false;
    const riderBatchesInSlot = existingBatches.filter(
      b => b.slot === slot && b.fattorino_id === f.id
    );
    return riderBatchesInSlot.length === 0;
  });

  if (availableRider) {
    const newBatchId = `BATCH-${Date.now()}`;
    return {
      success: true,
      batch_id: newBatchId,
      messaggio: 'Nuovo batch creato per questo ordine',
    };
  }

  // Priority 4: No space, suggest next slot
  return {
    success: false,
    messaggio: 'Nessun fattorino disponibile per questo slot',
    suggested_slot: getNextAvailableSlot(slot),
  };
}

/**
 * Helper to get next available time slot (15 min increment)
 */
function getNextAvailableSlot(currentSlot: string): string {
  // Parse current slot (e.g., "20:15-20:30")
  const [startTime] = currentSlot.split('-');
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Add 15 minutes
  let newMinutes = minutes + 15;
  let newHours = hours;
  
  if (newMinutes >= 60) {
    newMinutes -= 60;
    newHours += 1;
  }
  
  const newStartTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  
  // Calculate end time (15 minutes later)
  let endMinutes = newMinutes + 15;
  let endHours = newHours;
  
  if (endMinutes >= 60) {
    endMinutes -= 60;
    endHours += 1;
  }
  
  const newEndTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  
  return `${newStartTime}-${newEndTime}`;
}

/**
 * Detect quadrant from street address
 */
export function detectQuadrantFromStreet(
  street: string,
  quadrants: Quadrant[]
): Quadrant | null {
  const normalizedStreet = street.toLowerCase().trim();
  
  for (const quadrant of quadrants) {
    if (quadrant.tipo_definizione === 'via_list') {
      const matchingStreet = quadrant.vie.find(
        via => via.toLowerCase().trim() === normalizedStreet
      );
      if (matchingStreet) {
        return quadrant;
      }
    }
  }
  
  return null;
}
