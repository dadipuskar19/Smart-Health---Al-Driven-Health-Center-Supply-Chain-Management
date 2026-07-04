import React, { useState, useEffect } from 'react';
import { 
  Package, ScanLine, FileText, AlertTriangle, CheckCircle, 
  Trash2, Plus, Edit3, ArrowRight, Check, ShoppingCart 
} from 'lucide-react';
import { fetchAPI } from '../utils/api';

export default function PharmacistDashboard({ activeRole, activeTab, setActiveTab }) {
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // Edit stock state
  const [editingMedId, setEditingMedId] = useState(null);
  const [newStockVal, setNewStockVal] = useState('');

  // Barcode mock state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedMed, setScannedMed] = useState(null);
  const [scanErr, setScanErr] = useState('');
  const [dispenseQty, setDispenseQty] = useState(1);

  // New drug input form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addCat, setAddCat] = useState('');
  const [addStock, setAddStock] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addBarcode, setAddBarcode] = useState('');
  const [addExpiry, setAddExpiry] = useState('');
  const [addThreshold, setAddThreshold] = useState('20');

  useEffect(() => {
    loadPharmacistData();
  }, [activeRole]);

  const loadPharmacistData = async () => {
    try {
      const meds = await fetchAPI('/medicines', {}, activeRole);
      setMedicines(meds);

      const prescs = await fetchAPI('/prescriptions', {}, activeRole);
      setPrescriptions(prescs);
    } catch (err) {
      console.warn('Backend offline. Mocking pharmacy database.');
      setMedicines([
        { _id: 'med-1', name: 'Paracetamol 650mg', category: 'Analgesic', stock: 120, price: 15, barcode: '890100200301', expiryDate: '2027-12-15', threshold: 30 },
        { _id: 'med-2', name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 15, price: 85, barcode: '890100200302', expiryDate: '2026-11-20', threshold: 40 },
        { _id: 'med-3', name: 'Atorvastatin 20mg', category: 'Cardiological', stock: 80, price: 110, barcode: '890100200303', expiryDate: '2026-08-15', threshold: 20 },
        { _id: 'med-4', name: 'Amlodipine 5mg', category: 'Cardiological', stock: 8, price: 35, barcode: '890100200305', expiryDate: '2026-07-28', threshold: 30 }
      ]);
      setPrescriptions([
        { _id: '1', patient: { name: 'Rohan Sharma' }, doctor: { name: 'Dr. Anjali Mehta' }, diagnosis: 'Hypertension', medicines: [{ name: 'Amlodipine 5mg', dosage: '1-0-0', duration: '30 days' }], status: 'Pending' }
      ]);
    }
  };

  // 1. INVENTORY EDIT STOCK HANDLERS
  const handleUpdateStockSubmit = async (medId) => {
    if (!newStockVal) return;
    try {
      await fetchAPI(`/medicines/${medId}`, {
        method: 'PUT',
        body: JSON.stringify({ stock: parseInt(newStockVal) })
      }, activeRole);
      setEditingMedId(null);
      setNewStockVal('');
      loadPharmacistData(); // Refresh list
    } catch (err) {
      setMedicines(medicines.map(m => m._id === medId ? { ...m, stock: parseInt(newStockVal) } : m));
      setEditingMedId(null);
    }
  };

  const handleAddNewMedicine = async (e) => {
    e.preventDefault();
    const payload = {
      name: addName,
      category: addCat,
      stock: parseInt(addStock) || 0,
      price: parseFloat(addPrice) || 10,
      barcode: addBarcode || Math.random().toString().substring(2, 14),
      expiryDate: addExpiry || '2027-12-31',
      threshold: parseInt(addThreshold) || 20
    };
    try {
      await fetchAPI('/medicines', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, activeRole);
      setShowAddForm(false);
      // Reset fields
      setAddName('');
      setAddCat('');
      setAddStock('');
      setAddPrice('');
      setAddBarcode('');
      setAddExpiry('');
      loadPharmacistData();
    } catch (err) {
      setMedicines(prev => [...prev, { _id: Math.random().toString(), ...payload }]);
      setShowAddForm(false);
    }
  };

  // 2. BARCODE CHECKOUT LOGIC
  const handleBarcodeSearch = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    setScanErr('');
    setScannedMed(null);

    try {
      const med = await fetchAPI('/medicines/scan', {
        method: 'POST',
        body: JSON.stringify({ barcode: barcodeInput })
      }, activeRole);
      setScannedMed(med);
    } catch (err) {
      // Local scan fallback search
      const matched = medicines.find(m => m.barcode === barcodeInput || m._id === barcodeInput);
      if (matched) {
        setScannedMed(matched);
      } else {
        setScanErr('Medicine not found in local pharmacy lookup.');
      }
    }
  };

  const handleDispenseScanned = async () => {
    if (!scannedMed || scannedMed.stock < dispenseQty) {
      alert('Insufficient stock!');
      return;
    }
    const targetStock = scannedMed.stock - dispenseQty;
    try {
      await fetchAPI(`/medicines/${scannedMed._id}`, {
        method: 'PUT',
        body: JSON.stringify({ stock: targetStock })
      }, activeRole);
      alert(`Successfully dispensed ${dispenseQty} units of ${scannedMed.name}`);
      setScannedMed(null);
      setBarcodeInput('');
      loadPharmacistData();
    } catch (err) {
      setMedicines(medicines.map(m => m._id === scannedMed._id ? { ...m, stock: targetStock } : m));
      setScannedMed(null);
    }
  };

  // 3. VERIFY & DISPENSE DOCTOR PRESCRIPTIONS
  const dispensePrescription = async (presc) => {
    try {
      // Deduct stock for each medicine in prescription
      for (const prescMed of presc.medicines) {
        const matchingDbMed = medicines.find(m => m.name.toLowerCase().includes(prescMed.name.toLowerCase()));
        if (matchingDbMed) {
          const newStock = Math.max(0, matchingDbMed.stock - 5); // Assuming standard checkout qty
          await fetchAPI(`/medicines/${matchingDbMed._id}`, {
            method: 'PUT',
            body: JSON.stringify({ stock: newStock })
          }, activeRole);
        }
      }

      // Mark prescription as complete (simulated UI update)
      setPrescriptions(prescriptions.map(p => p._id === presc._id ? { ...p, status: 'Dispensed' } : p));
      alert(`Prescription for ${presc.patient?.name || 'Patient'} dispensed successfully.`);
      loadPharmacistData();
    } catch (err) {
      alert('Error updating database inventory.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight">Pharmacy Operations</h2>
        <p className="text-xs text-slate-500 mt-1">Manage medicine inventories, verify prescriptions, and handle barcode checkout points</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
        {['inventory', 'barcode', 'prescriptions'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              activeTab === tab 
                ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: 1. INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-fade-in">
          {/* Dashboard quick filters */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold">Medicine Database</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Add New Medicine
            </button>
          </div>

          {/* Add form toggled */}
          {showAddForm && (
            <form onSubmit={handleAddNewMedicine} className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 grid sm:grid-cols-4 gap-3 animate-fade-in">
              <div className="space-y-0.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Name</label>
                <input required type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="Metformin 500mg" className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Category</label>
                <input required type="text" value={addCat} onChange={e => setAddCat(e.target.value)} placeholder="Diabetology" className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Initial Stock</label>
                <input required type="number" value={addStock} onChange={e => setAddStock(e.target.value)} placeholder="150" className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Price (Rs)</label>
                <input required type="number" value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="25" className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Barcode</label>
                <input type="text" value={addBarcode} onChange={e => setAddBarcode(e.target.value)} placeholder="890100200304" className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Expiry Date</label>
                <input required type="date" value={addExpiry} onChange={e => setAddExpiry(e.target.value)} className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Reorder Threshold</label>
                <input type="number" value={addThreshold} onChange={e => setAddThreshold(e.target.value)} placeholder="20" className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md">
                  Save Drug
                </button>
              </div>
            </form>
          )}

          {/* Grid layout of Medicines */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicines.map(med => {
              const isLowStock = med.stock <= med.threshold;
              
              // Near expiry calculation (assuming current local date is July 2026)
              const expiry = new Date(med.expiryDate);
              const limitDate = new Date('2026-09-01'); // Within 2 months
              const isNearExpiry = expiry < limitDate;

              return (
                <div key={med._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-500 font-semibold">{med.category}</span>
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1">{med.name}</p>
                      </div>
                      
                      {/* Warning badges */}
                      <div className="flex flex-col items-end gap-1">
                        {isLowStock && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                          </span>
                        )}
                        {isNearExpiry && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Expiring Soon
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                      <div>Stock: <strong className={isLowStock ? 'text-rose-500 font-extrabold' : 'text-slate-800 dark:text-slate-200 font-extrabold'}>{med.stock} units</strong></div>
                      <div className="text-right">Price: <strong className="text-slate-800 dark:text-slate-200 font-bold">Rs {med.price}</strong></div>
                      <div className="col-span-2 mt-1">Expiry: <strong className={isNearExpiry ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'}>{med.expiryDate}</strong></div>
                    </div>
                  </div>

                  {/* Stock quick edit */}
                  <div className="flex gap-2">
                    {editingMedId === med._id ? (
                      <>
                        <input
                          type="number"
                          value={newStockVal}
                          onChange={e => setNewStockVal(e.target.value)}
                          placeholder="New StockQty"
                          className="w-full text-xs p-1.5 border rounded-lg dark:bg-slate-950"
                        />
                        <button
                          onClick={() => handleUpdateStockSubmit(med._id)}
                          className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setEditingMedId(med._id); setNewStockVal(med.stock.toString()); }}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Stock Levels
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. BARCODE CHECKOUT SCANNER */}
      {activeTab === 'barcode' && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          {/* Scan simulator */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-sky-500 animate-pulse" />
              Barcode Scanner Simulator
            </h3>
            
            <form onSubmit={handleBarcodeSearch} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Input Barcode / Medicine ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    placeholder="Enter barcode e.g., 890100200301"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold"
                  >
                    Scan Code
                  </button>
                </div>
              </div>
            </form>

            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/50 text-center">
              <p className="text-[11px] text-slate-400 font-mono">Barcode Presets available to test:</p>
              <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                {medicines.map(m => (
                  <button 
                    key={m._id} 
                    onClick={() => { setBarcodeInput(m.barcode); }} 
                    className="text-[10px] bg-white dark:bg-slate-850 hover:bg-slate-100 border px-2 py-0.5 rounded text-slate-500 font-mono transition-all"
                  >
                    {m.name} ({m.barcode})
                  </button>
                ))}
              </div>
            </div>
            
            {scanErr && <p className="text-xs text-rose-500 font-semibold">{scanErr}</p>}
          </div>

          {/* Scanned result card & checkout */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold">Scan Checkout Results</h3>
            {scannedMed ? (
              <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 animate-fade-in">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-sky-50 dark:bg-sky-950/20 px-2 py-0.5 rounded text-sky-600 font-bold">{scannedMed.category}</span>
                    <h4 className="text-sm font-bold mt-1 text-slate-800 dark:text-white">{scannedMed.name}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Shelf Stock</p>
                    <p className={`text-sm font-extrabold ${scannedMed.stock <= scannedMed.threshold ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                      {scannedMed.stock} units
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-xl border text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Dispense Quantity</label>
                    <input
                      type="number"
                      value={dispenseQty}
                      onChange={e => setDispenseQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 p-1 border rounded bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total cost</p>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100">Rs {scannedMed.price * dispenseQty}</p>
                  </div>
                </div>

                <button
                  onClick={handleDispenseScanned}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4" /> Checkout & Dispense Stock
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Scan a barcode key to load transaction cards.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. VERIFY PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold">Doctor-Issued Prescriptions (E-Locker Queue)</h3>
          <div className="space-y-3">
            {prescriptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No prescription verifications queued.
              </div>
            ) : (
              prescriptions.map(presc => (
                <div key={presc._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Patient: {presc.patient?.name || 'Walkin User'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Doctor: {presc.doctor?.name || 'Hospital Doctor'} | Diag: {presc.diagnosis}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {presc.medicines.map((med, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 border rounded text-slate-600 dark:text-slate-400">
                          {med.name} - {med.dosage} ({med.duration})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      presc.status === 'Dispensed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {presc.status || 'Pending'}
                    </span>
                    {presc.status !== 'Dispensed' && (
                      <button
                        onClick={() => dispensePrescription(presc)}
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                      >
                        Verify & Dispense
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
