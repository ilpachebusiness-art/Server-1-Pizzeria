"use client";

import React, { useState } from 'react';
import { Pizza, Clock, Plus, Minus, Save, Info, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
interface TimeSlot {
  time: string;
  maxCapacity: number; // Numero massimo di pizze
  currentOrders: number; // Numero di pizze già ordinate
  riderCount: number; // Numero di fattorini disponibili
}
interface SlotCapacityManagementProps {
  slots: TimeSlot[];
  onUpdateSlots: (slots: TimeSlot[]) => void;
  globalMaxCapacity: number;
  onUpdateGlobalCapacity: (capacity: number) => void;
}
export const SlotCapacityManagement: React.FC<SlotCapacityManagementProps> = ({
  slots,
  onUpdateSlots,
  globalMaxCapacity,
  onUpdateGlobalCapacity
}) => {
  const [editingSlots, setEditingSlots] = useState<TimeSlot[]>(slots);
  const [globalCapacity, setGlobalCapacity] = useState(globalMaxCapacity);
  const handleSlotCapacityChange = (index: number, delta: number) => {
    const newSlots = [...editingSlots];
    newSlots[index].maxCapacity = Math.max(0, newSlots[index].maxCapacity + delta);
    setEditingSlots(newSlots);
  };
  const handleGlobalCapacityChange = (delta: number) => {
    setGlobalCapacity(Math.max(0, globalCapacity + delta));
  };
  const handleApplyGlobalCapacity = () => {
    const newSlots = editingSlots.map(slot => ({
      ...slot,
      maxCapacity: globalCapacity
    }));
    setEditingSlots(newSlots);
  };
  const handleSave = () => {
    onUpdateSlots(editingSlots);
    onUpdateGlobalCapacity(globalCapacity);
  };
  const handleReset = () => {
    setEditingSlots(slots);
    setGlobalCapacity(globalMaxCapacity);
  };
  const getCapacityStatus = (slot: TimeSlot) => {
    const percentage = slot.currentOrders / slot.maxCapacity * 100;
    if (percentage >= 90) return {
      color: 'text-red-600',
      bg: 'bg-red-50',
      label: 'Quasi pieno'
    };
    if (percentage >= 70) return {
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      label: 'Occupato'
    };
    if (percentage >= 40) return {
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      label: 'Disponibile'
    };
    return {
      color: 'text-green-600',
      bg: 'bg-green-50',
      label: 'Ampia disponibilità'
    };
  };
  const totalCapacity = editingSlots.reduce((sum, slot) => sum + slot.maxCapacity, 0);
  const totalOrders = editingSlots.reduce((sum, slot) => sum + slot.currentOrders, 0);
  const averageOccupancy = totalCapacity > 0 ? (totalOrders / totalCapacity * 100).toFixed(1) : '0';
  return <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestione Capacità Slot</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configura il numero massimo di pizze che il forno può produrre per ogni slot orario (ogni 15 minuti)
          </p>
        </div>
        <div className="flex space-x-2">
          <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
            Ripristina
          </button>
          <button onClick={handleSave} className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm shadow-orange-200">
            <Save className="w-4 h-4" />
            <span>Salva Modifiche</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-1">Come funziona la Capacità</h4>
          <p className="text-sm text-blue-700 mb-2">
            La capacità massima rappresenta il numero totale di pizze che il forno può preparare in uno
            slot di 15 minuti. Questo limite si applica a tutti gli ordini (consegna e ritiro).
          </p>
          <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
            <li>Se la capacità viene raggiunta, lo slot non sarà più selezionabile dai clienti</li>
            <li>Puoi impostare capacità diverse per ogni slot orario in base all'affluenza prevista</li>
            <li>
              Gli ordini molto grandi possono essere gestiti aumentando temporaneamente la capacità
            </li>
          </ul>
        </div>
      </div>

      {/* Global Capacity Setting */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Capacità Globale Predefinita</h3>
            <p className="text-sm text-slate-500">
              Applica questa capacità a tutti gli slot contemporaneamente
            </p>
          </div>
          <button onClick={handleApplyGlobalCapacity} className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
            Applica a Tutti
          </button>
        </div>
        <div className="flex items-center space-x-4 bg-slate-50 rounded-xl px-6 py-4 w-fit">
          <button onClick={() => handleGlobalCapacityChange(-1)} className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <Minus className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">{globalCapacity}</div>
            <div className="text-xs text-slate-500 mt-1">pizze per slot</div>
          </div>
          <button onClick={() => handleGlobalCapacityChange(1)} className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Pizza className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Capacità Totale</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCapacity}</div>
          <div className="text-xs text-slate-500 mt-1">pizze per serata</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Ordini Attuali</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalOrders}</div>
          <div className="text-xs text-slate-500 mt-1">pizze ordinate</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Occupazione Media</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{averageOccupancy}%</div>
          <div className="text-xs text-slate-500 mt-1">della capacità</div>
        </div>
      </div>

      {/* Slot Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Configurazione Slot Individuali</h3>
        </div>
        <div className="p-6 space-y-3">
          {editingSlots.map((slot, index) => {
          const status = getCapacityStatus(slot);
          const remainingCapacity = slot.maxCapacity - slot.currentOrders;
          const occupancyPercentage = slot.maxCapacity > 0 ? (slot.currentOrders / slot.maxCapacity * 100).toFixed(0) : '0';
          return <motion.div key={slot.time} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.05
          }} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <Clock className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{slot.time}</div>
                      <div className="text-xs text-slate-500">
                        {slot.riderCount} fattorini disponibili
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Capacity Control */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                      Capacità Massima
                    </label>
                    <div className="flex items-center space-x-3 bg-white rounded-lg px-3 py-2 border border-slate-200">
                      <button onClick={() => handleSlotCapacityChange(index, -1)} className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex-1 text-center">
                        <div className="text-2xl font-bold text-slate-900">{slot.maxCapacity}</div>
                        <div className="text-[10px] text-slate-500">pizze</div>
                      </div>
                      <button onClick={() => handleSlotCapacityChange(index, 1)} className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                      Stato Attuale
                    </label>
                    <div className="bg-white rounded-lg px-4 py-3 border border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">Ordini attuali</span>
                        <span className="text-sm font-bold text-slate-900">{slot.currentOrders}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">Disponibili</span>
                        <span className="text-sm font-bold text-green-600">
                          {remainingCapacity}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-2 rounded-full transition-all ${parseInt(occupancyPercentage) >= 90 ? 'bg-red-500' : parseInt(occupancyPercentage) >= 70 ? 'bg-orange-500' : 'bg-green-500'}`} style={{
                      width: `${occupancyPercentage}%`
                    }} />
                      </div>
                      <div className="text-center text-xs text-slate-500 mt-1">
                        {occupancyPercentage}% occupato
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>;
        })}
        </div>
      </div>

      {/* Warning for Low Capacity */}
      {editingSlots.some(slot => slot.maxCapacity < 10) && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 mb-1">Attenzione: Capacità Bassa</h4>
            <p className="text-sm text-amber-700">
              Alcuni slot hanno una capacità inferiore a 10 pizze. Questo potrebbe limitare
              significativamente il numero di ordini che puoi accettare durante le ore di punta.
            </p>
          </div>
        </div>}
    </div>;
};