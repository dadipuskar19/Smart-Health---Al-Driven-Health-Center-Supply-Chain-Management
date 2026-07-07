import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, Check, AlertCircle, Compass, MapPin } from 'lucide-react';
import { fetchAPI } from '../utils/api';

export default function SupplierDashboard({ activeRole, activeTab, setActiveTab }) {
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    loadSupplierData();
  }, [activeRole]);

  const loadSupplierData = async () => {
    try {
      const ords = await fetchAPI('/orders', {}, activeRole);
      setOrders(ords);

      const dels = await fetchAPI('/deliveries', {}, activeRole);
      setDeliveries(dels);
    } catch (err) {
      console.warn('Backend offline, mock supplier datasets.');
      setOrders([
        { _id: '1', medicine: 'Amoxicillin 500mg', quantity: 150, cost: 12750, status: 'Pending' }
      ]);
      setDeliveries([]);
    }
  };

  // 1. ORDERS HANDLERS
  const updateOrderStatus = async (id, status) => {
    try {
      await fetchAPI(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }, activeRole);
      alert(`Order marked as ${status}!`);
      loadSupplierData();
    } catch (err) {
      setOrders(orders.map(o => o._id === id ? { ...o, status } : o));
    }
  };

  // 2. SIMULATE GPS/DELIVERY PROGRESS STEPPER
  const progressDelivery = async (del) => {
    // Generate new mock coordinates that progress towards target destination
    const steps = [
      { location: 'Apex Warehouse Dispatched', lat: 28.6139, lng: 77.2090 },
      { location: 'Delhi Metro Transit Hub', lat: 26.9124, lng: 75.7873 },
      { location: 'State Logistics border checkpoint', lat: 21.1458, lng: 79.0882 },
      { location: 'Hyderabad Central Transit Depot', lat: 17.4125, lng: 78.4350 },
      { location: 'Hospital Warehouse Delivered', lat: 17.3850, lng: 78.4867 }
    ];

    // Find next index
    const currentLoc = del.currentLocation;
    let nextIdx = steps.findIndex(s => s.location === currentLoc) + 1;
    if (nextIdx >= steps.length) nextIdx = steps.length - 1;

    const nextStep = steps[nextIdx];
    const newStatus = nextIdx === steps.length - 1 ? 'Delivered' : 'In-Transit';

    try {
      await fetchAPI(`/deliveries/${del._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          lat: nextStep.lat,
          lng: nextStep.lng,
          currentLocation: nextStep.location,
          status: newStatus
        })
      }, activeRole);
      
      if (newStatus === 'Delivered') {
        // Also update order status to delivered to add stock to backend med
        await fetchAPI(`/orders/${del.order._id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'Delivered' })
        }, activeRole);
      }

      loadSupplierData();
    } catch (err) {
      // Offline fallback update UI
      setDeliveries(deliveries.map(d => d._id === del._id ? {
        ...d,
        coordinates: { lat: nextStep.lat, lng: nextStep.lng },
        currentLocation: nextStep.location,
        status: newStatus
      } : d));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight">Supply Chain Partner</h2>
        <p className="text-xs text-slate-500 mt-1">Review hospital supply requests, dispatch packages, and simulate GPS coordinates tracking</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-900 pb-3 overflow-x-auto scrollbar-none flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        {['orders', 'logistics'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: 1. INCOMING ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold">Incoming Supply Reorders</h3>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No orders pending.
              </div>
            ) : (
              orders.map(order => (
                <div key={order._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Medicine: {order.medicine}</p>
                    <p className="text-[10px] text-slate-500">Qty Requested: {order.quantity} units | Total Cost: Rs {order.cost || 5000}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status}
                    </span>

                    {order.status === 'Pending' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'Approved')}
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow transition-all"
                      >
                        Approve Order
                      </button>
                    )}

                    {order.status === 'Approved' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'Shipped')}
                        className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow transition-all"
                      >
                        Dispatch Shipment
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. LOGISTICS DELIVERY TRACKER */}
      {activeTab === 'logistics' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Active Deliveries List */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold">Active GPS Logistical Shipments</h3>
            <div className="space-y-3">
              {deliveries.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No active deliveries tracked currently. Mark approved orders as Shipped to track.
                </div>
              ) : (
                deliveries.map(del => (
                  <div key={del._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">Carrier: Apex Express</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Medicine: {del.order?.medicine} ({del.order?.quantity} units)</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        del.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700 animate-pulse'
                      }`}>
                        {del.status}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/50 dark:bg-slate-990/40 rounded-xl border space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold text-[10px] uppercase">Current Hub</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{del.currentLocation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold text-[10px] uppercase">GPS Coordinates</span>
                        <span className="font-mono text-slate-600 dark:text-slate-400">{del.coordinates?.lat.toFixed(4)}, {del.coordinates?.lng.toFixed(4)}</span>
                      </div>
                    </div>

                    {del.status !== 'Delivered' && (
                      <button
                        onClick={() => progressDelivery(del)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Compass className="w-4 h-4 animate-spin [animation-duration:8s]" /> Simulate GPS Transit Progression
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map Graphic mockup */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 h-fit">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-500 animate-pulse" />
              Logistics GPS Map
            </h3>
            
            {/* Visual simulation of lines connecting Indian cities */}
            <div className="relative rounded-2xl bg-slate-900 border overflow-hidden p-4 h-52 flex flex-col justify-between">
              <div className="absolute inset-0 opacity-15 flex flex-col items-center justify-center pointer-events-none">
                {/* SVG Mocking geographic grid */}
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" stroke="currentColor" className="text-slate-400">
                  <path d="M10,20 Q40,60 80,80" strokeWidth="1" strokeDasharray="3" />
                  <circle cx="10" cy="20" r="2" fill="currentColor" />
                  <circle cx="80" cy="80" r="2" fill="currentColor" />
                </svg>
              </div>

              <div className="text-[10px] font-bold text-slate-400 z-10 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-500 animate-bounce" />
                National Transit Map Node
              </div>

              <div className="space-y-1 z-10">
                <p className="text-[10px] font-bold text-slate-300">Transit Milestones</p>
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-slate-400 leading-normal">Apex Warehouse (Delhi) ──► Hospital (Hyd)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
