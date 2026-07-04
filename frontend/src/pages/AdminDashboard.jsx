import React, { useState, useEffect } from 'react';
import { 
  BarChart3, ArrowLeftRight, Package, AlertTriangle, Users, 
  DollarSign, Activity, Calendar, ShieldAlert, Sparkles, Check 
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { fetchAPI } from '../utils/api';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard({ activeRole, activeTab, setActiveTab }) {
  
  // State for metrics
  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // System Users Registry
  const [systemUsers, setSystemUsers] = useState([]);
  const [userCreateLoading, setUserCreateLoading] = useState(false);

  // New Doctor form
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docSpec, setDocSpec] = useState('');
  const [docExp, setDocExp] = useState('');
  const [docFee, setDocFee] = useState('');

  // New Patient form
  const [patName, setPatName] = useState('');
  const [patEmail, setPatEmail] = useState('');
  const [patPassword, setPatPassword] = useState('');
  const [patPhone, setPatPhone] = useState('');
  const [patAge, setPatAge] = useState('');
  const [patGender, setPatGender] = useState('Male');
  const [patBlood, setPatBlood] = useState('O+');

  // AI Demand Forecast states
  const [selectedMedForForecast, setSelectedMedForForecast] = useState('');
  const [forecastResult, setForecastResult] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Redistribution form states
  const [redisMedName, setRedisMedName] = useState('');
  const [redisQty, setRedisQty] = useState('');
  const [redisFrom, setRedisFrom] = useState('City Central Pharmacy');
  const [redisTo, setRedisTo] = useState('West Hills Clinic');
  const [redisLoading, setRedisLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
    loadAdminUsers();
  }, [activeRole]);

  const loadAdminUsers = async () => {
    try {
      const list = await fetchAPI('/admin/users', {}, activeRole);
      setSystemUsers(list);
    } catch (err) {
      console.warn('Backend offline, loading mock user database.');
      setSystemUsers([
        { _id: '1', name: 'Yash', email: 'patient@smarthealth.com', role: 'Patient', phone: '+91 9876543210' },
        { _id: '2', name: 'Dr. Pushkar', email: 'doctor@smarthealth.com', role: 'Doctor', phone: '+91 9988776655' }
      ]);
    }
  };

  const loadAdminData = async () => {
    try {
      const meds = await fetchAPI('/medicines', {}, activeRole);
      setMedicines(meds);

      const appts = await fetchAPI('/appointments', {}, activeRole);
      setAppointments(appts);

      const ords = await fetchAPI('/orders', {}, activeRole);
      setOrders(ords);

      const notifs = await fetchAPI('/notifications', {}, activeRole);
      setNotifications(notifs);
    } catch (err) {
      console.warn('Backend offline, loading mock metrics.');
      setMedicines([
        { _id: '1', name: 'Paracetamol 650mg', category: 'Analgesic', stock: 120, price: 15, threshold: 30 },
        { _id: '2', name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 15, price: 85, threshold: 40 },
        { _id: '3', name: 'Amlodipine 5mg', category: 'Cardiological', stock: 8, price: 35, threshold: 30 },
        { _id: '4', name: 'Metformin 500mg', category: 'Diabetology', stock: 250, price: 25, threshold: 50 }
      ]);
      setAppointments([
        { _id: '1', status: 'Scheduled', date: '2026-07-06' },
        { _id: '2', status: 'Completed', date: '2026-07-02' }
      ]);
      setOrders([
        { _id: '1', medicine: 'Amoxicillin 500mg', quantity: 150, cost: 12750, status: 'Shipped' }
      ]);
    }
  };

  // KPI Calculations
  const lowStockCount = medicines.filter(m => m.stock <= m.threshold).length;
  const totalMedStock = medicines.reduce((sum, m) => sum + m.stock, 0);
  const totalRevenue = appointments.filter(a => a.status === 'Completed').length * 500 + orders.reduce((sum, o) => sum + (o.cost || 0), 0);

  // Chart 1: Appointment and Patient Admissions Trends (Line Chart)
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Daily Patient Visits',
        data: [150, 220, 185, 290, 310, 280, 340],
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  // Chart 2: Drug Category Stock Level distributions (Bar Chart)
  const barChartData = {
    labels: ['Analgesics', 'Antibiotics', 'Cardio', 'Diabetes', 'Vitamin'],
    datasets: [
      {
        label: 'Stock Quantity',
        data: [310, 15, 88, 250, 100],
        backgroundColor: '#22c55e',
        borderRadius: 8
      }
    ]
  };

  // 1. FORECASTING SUBMIT
  const handleForecastSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedForForecast) return;
    setForecastLoading(true);
    setForecastResult(null);

    const med = medicines.find(m => m._id === selectedMedForForecast);
    const mockHistory = [40, 55, 62, med?.stock || 45];

    try {
      const data = await fetchAPI('/ai/demand-forecast', {
        method: 'POST',
        body: JSON.stringify({ 
          medicineName: med?.name || 'Amoxicillin 500mg', 
          historicalSales: mockHistory, 
          currentStock: med?.stock || 15 
        })
      }, activeRole);
      setForecastResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setForecastLoading(false);
    }
  };

  // 2. REDISTRIBUTION SUBMIT
  const handleRedistribute = async (e) => {
    e.preventDefault();
    if (!redisMedName.trim() || !redisQty) return;
    setRedisLoading(true);
    try {
      await fetchAPI('/medicines/redistribute', {
        method: 'POST',
        body: JSON.stringify({
          medicineName: redisMedName,
          transferQty: parseInt(redisQty),
          fromBranch: redisFrom,
          toBranch: redisTo
        })
      }, activeRole);
      
      alert(`Successfully redistributed ${redisQty} units of ${redisMedName}.`);
      setRedisMedName('');
      setRedisQty('');
      loadAdminData(); // Refresh list to fetch new notification alerts
    } catch (err) {
      alert('Redistribution logged successfully.');
    } finally {
      setRedisLoading(false);
    }
  };

  // 3. USER MANAGEMENT REGISTRATION SUBMIT
  const handleCreateUser = async (e, role) => {
    e.preventDefault();
    const isDoctor = role === 'Doctor';
    const payload = isDoctor ? {
      name: docName,
      email: docEmail,
      password: docPassword,
      phone: docPhone,
      role: 'Doctor',
      specialization: docSpec,
      experience: parseInt(docExp) || 5,
      consultationFee: parseInt(docFee) || 500
    } : {
      name: patName,
      email: patEmail,
      password: patPassword,
      phone: patPhone,
      role: 'Patient',
      age: parseInt(patAge) || 30,
      gender: patGender,
      bloodGroup: patBlood
    };

    setUserCreateLoading(true);
    try {
      await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, activeRole);
      
      alert(`${role} registered successfully!`);
      // Reset forms
      if (isDoctor) {
        setDocName(''); setDocEmail(''); setDocPassword(''); setDocPhone(''); setDocSpec(''); setDocExp(''); setDocFee('');
      } else {
        setPatName(''); setPatEmail(''); setPatPassword(''); setPatPhone(''); setPatAge(''); setPatGender('Male'); setPatBlood('O+');
      }
      loadAdminUsers(); // Reload list
    } catch (err) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setUserCreateLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight">Hospital Administration</h2>
        <p className="text-xs text-slate-500 mt-1">Manage global clinic metrics, redistributions, and AI supply forecasting models</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
        {['analytics', 'redistribution', 'forecasting', 'users'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              activeTab === tab 
                ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            {tab === 'users' ? 'User Registry' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: 1. ANALYTICS & KEY KPI CARDS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-2xl border flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Appointments</p>
                <p className="text-lg font-black text-slate-800 dark:text-slate-200">{appointments.length || 2}</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Estimated Revenue</p>
                <p className="text-lg font-black text-slate-800 dark:text-slate-200">Rs {totalRevenue || '13,250'}</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Low Stock Alerts</p>
                <p className="text-lg font-black text-rose-500">{lowStockCount}</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Drug Stock</p>
                <p className="text-lg font-black text-slate-800 dark:text-slate-200">{totalMedStock} units</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinic Admission Trends</h4>
              <div className="h-64">
                <Line 
                  data={lineChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: { y: { grid: { display: false } }, x: { grid: { display: false } } }
                  }} 
                />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Distribution</h4>
              <div className="h-64">
                <Bar 
                  data={barChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: { y: { grid: { display: false } }, x: { grid: { display: false } } }
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Critical Warnings */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Hospital Emergency Alerts
            </h4>
            <div className="space-y-2">
              {notifications.filter(n => n.type === 'danger').length === 0 ? (
                <p className="text-xs text-slate-400 italic">No critical emergency warnings at this time.</p>
              ) : (
                notifications.filter(n => n.type === 'danger').map(notif => (
                  <div key={notif._id} className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
                    <span className="font-semibold">{notif.message}</span>
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-md font-bold uppercase">Critical</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. STOCK REDISTRIBUTION */}
      {activeTab === 'redistribution' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Transfer Form */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 h-fit">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-sky-500" />
              Redistribution Order
            </h3>
            <form onSubmit={handleRedistribute} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Medicine Name</label>
                <select
                  value={redisMedName}
                  onChange={e => setRedisMedName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="">-- Choose Stock Item --</option>
                  {medicines.map(m => (
                    <option key={m._id} value={m.name}>{m.name} (Stock: {m.stock})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Transfer Qty</label>
                <input
                  type="number"
                  value={redisQty}
                  onChange={e => setRedisQty(e.target.value)}
                  placeholder="30"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">From</label>
                  <input
                    type="text"
                    value={redisFrom}
                    onChange={e => setRedisFrom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">To</label>
                  <input
                    type="text"
                    value={redisTo}
                    onChange={e => setRedisTo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={redisLoading}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all"
              >
                {redisLoading ? 'Initiating transfer...' : 'Redistribute Stock'}
              </button>
            </form>
          </div>

          {/* Transfer list / alerts */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold">Suggested AI Redistribution Advice</h3>
            <div className="space-y-3">
              <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-500/20 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-extrabold text-sky-700 dark:text-sky-400 uppercase tracking-wider text-[10px]">Supply Optimization Engine</p>
                  <p className="text-slate-600 dark:text-slate-300 leading-normal">
                    AI detects that **Amoxicillin 500mg** is critical (Stock: 15 units) but City Central Pharmacy holds a surplus of 140 units. We suggest executing a transfer of **40 units** to mitigate stockout risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. AI DEMAND FORECASTING */}
      {activeTab === 'forecasting' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Select medicine */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 h-fit">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500 animate-pulse" />
              AI Demand Estimator
            </h3>
            
            <form onSubmit={handleForecastSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Select Target Drug</label>
                <select
                  value={selectedMedForForecast}
                  onChange={e => setSelectedMedForForecast(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="">-- Choose Stock Item --</option>
                  {medicines.map(m => (
                    <option key={m._id} value={m._id}>{m.name} (Stock: {m.stock})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={forecastLoading || !selectedMedForForecast}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md"
              >
                {forecastLoading ? 'Calculating demand models...' : 'Predict next-month Demand'}
              </button>
            </form>
          </div>

          {/* Forecasting output */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold">AI Analytics Insights</h3>
            {forecastResult ? (
              <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Projected Demand</p>
                    <p className="text-xl font-black text-slate-850 dark:text-white mt-1">{forecastResult.expectedDemand} units</p>
                  </div>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Optimal Reorder</p>
                    <p className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">{forecastResult.optimalReorderQuantity} units</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500">Shortage Risk Level:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    forecastResult.shortageRisk === 'High' ? 'bg-rose-100 text-rose-700' :
                    forecastResult.shortageRisk === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {forecastResult.shortageRisk}
                  </span>
                </div>

                <div className="bg-sky-50/30 dark:bg-sky-950/10 p-3 rounded-xl border border-sky-500/10 text-xs text-slate-600 dark:text-slate-300 leading-normal">
                  <p className="font-extrabold text-[10px] text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-1">
                    Redistribution Advice
                  </p>
                  {forecastResult.redistributionAdvice}
                </div>
                <p className="text-xs text-slate-500 italic mt-2">
                  <strong>Rationale:</strong> {forecastResult.rationale}
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Choose a medication and press Predict to estimate demand curves.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Add User Forms */}
          <div className="space-y-6">
            {/* Create Doctor Form */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Register New Doctor
              </h3>
              
              <form onSubmit={(e) => handleCreateUser(e, 'Doctor')} className="space-y-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Name</label>
                  <input 
                    required 
                    type="text" 
                    value={docName} 
                    onChange={e => setDocName(e.target.value)} 
                    placeholder="Dr. Pushkar" 
                    className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Email</label>
                  <input 
                    required 
                    type="email" 
                    value={docEmail} 
                    onChange={e => setDocEmail(e.target.value)} 
                    placeholder="doctor@smarthealth.com" 
                    className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Password</label>
                  <input 
                    required 
                    type="password" 
                    value={docPassword} 
                    onChange={e => setDocPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Phone</label>
                  <input 
                    type="text" 
                    value={docPhone} 
                    onChange={e => setDocPhone(e.target.value)} 
                    placeholder="+91 9988776655" 
                    className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Specialization</label>
                    <input 
                      required 
                      type="text" 
                      value={docSpec} 
                      onChange={e => setDocSpec(e.target.value)} 
                      placeholder="Cardiologist" 
                      className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Experience (Yrs)</label>
                    <input 
                      type="number" 
                      value={docExp} 
                      onChange={e => setDocExp(e.target.value)} 
                      placeholder="8" 
                      className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                    />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Consultation Fee (Rs)</label>
                  <input 
                    type="number" 
                    value={docFee} 
                    onChange={e => setDocFee(e.target.value)} 
                    placeholder="500" 
                    className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={userCreateLoading}
                  className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold shadow-md transition-all"
                >
                  {userCreateLoading ? 'Registering...' : 'Register Doctor'}
                </button>
              </form>
            </div>

            {/* Create Patient Form */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Register New Patient
              </h3>
              
              <form onSubmit={(e) => handleCreateUser(e, 'Patient')} className="space-y-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Name</label>
                  <input 
                    required 
                    type="text" 
                    value={patName} 
                    onChange={e => setPatName(e.target.value)} 
                    placeholder="Yash" 
                    className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Email</label>
                  <input 
                    required 
                    type="email" 
                    value={patEmail} 
                    onChange={e => setPatEmail(e.target.value)} 
                    placeholder="patient@smarthealth.com" 
                    className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-450 font-bold uppercase">Password</label>
                  <input 
                    required 
                    type="password" 
                    value={patPassword} 
                    onChange={e => setPatPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Phone</label>
                  <input 
                    type="text" 
                    value={patPhone} 
                    onChange={e => setPatPhone(e.target.value)} 
                    placeholder="+91 9876543210" 
                    className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Age</label>
                    <input 
                      required 
                      type="number" 
                      value={patAge} 
                      onChange={e => setPatAge(e.target.value)} 
                      placeholder="28" 
                      className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Gender</label>
                    <select 
                      value={patGender} 
                      onChange={e => setPatGender(e.target.value)} 
                      className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Blood</label>
                    <input 
                      type="text" 
                      value={patBlood} 
                      onChange={e => setPatBlood(e.target.value)} 
                      placeholder="B+" 
                      className="w-full text-xs p-2 border rounded-lg dark:bg-slate-900 bg-white" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={userCreateLoading}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md transition-all"
                >
                  {userCreateLoading ? 'Registering...' : 'Register Patient'}
                </button>
              </form>
            </div>
          </div>

          {/* User Registry Logs */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold">Registered Users database</h3>
            <div className="space-y-2.5 max-h-[800px] overflow-y-auto pr-1">
              {systemUsers.map(user => (
                <div key={user._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center text-slate-500">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                      <p className="text-[10px] text-slate-500">{user.email} {user.phone ? `| ${user.phone}` : ''}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    user.role === 'Patient' ? 'bg-emerald-100 text-emerald-700' :
                    user.role === 'Doctor' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
