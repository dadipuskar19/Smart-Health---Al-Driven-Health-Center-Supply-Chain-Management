import React from 'react';
import { 
  HeartPulse, MessageSquare, Calendar, FileText, Clock, Calculator, 
  Users, Stethoscope, Video, Package, ScanLine, ArrowLeftRight, 
  BarChart3, Truck, ShoppingBag, Eye 
} from 'lucide-react';

export default function Sidebar({ activeRole, currentTab, setCurrentTab }) {
  // Sidebar items mapping based on role
  const menuItems = {
    'Patient': [
      { id: 'symptoms', label: 'AI Symptom Checker', icon: HeartPulse },
      { id: 'chatbot', label: 'AI 24/7 Chatbot', icon: MessageSquare },
      { id: 'appointments', label: 'Book Appointment', icon: Calendar },
      { id: 'records', label: 'Medical Records', icon: FileText },
      { id: 'reminders', label: 'Medicine Reminders', icon: Clock },
      { id: 'calculators', label: 'Health Calculators', icon: Calculator }
    ],
    'Doctor': [
      { id: 'patients', label: 'Patient History', icon: Users },
      { id: 'diagnosis', label: 'AI Diagnosis suggestion', icon: Stethoscope },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'video', label: 'Video Consultations', icon: Video },
      { id: 'prescriptions', label: 'Issue Prescriptions', icon: FileText }
    ],
    'Pharmacist': [
      { id: 'inventory', label: 'Inventory Manager', icon: Package },
      { id: 'barcode', label: 'Barcode/QR Scanner', icon: ScanLine },
      { id: 'prescriptions', label: 'Verify Prescriptions', icon: FileText }
    ],
    'Hospital Administrator': [
      { id: 'analytics', label: 'Hospital Analytics', icon: BarChart3 },
      { id: 'redistribution', label: 'Stock Redistribution', icon: ArrowLeftRight },
      { id: 'forecasting', label: 'AI Supply Chain Forecast', icon: Package }
    ],
    'Supplier': [
      { id: 'orders', label: 'Incoming Orders', icon: ShoppingBag },
      { id: 'logistics', label: 'Delivery Tracking', icon: Truck }
    ]
  };

  const items = menuItems[activeRole] || [];

  return (
    <aside className="w-64 h-[calc(100vh-62px)] border-r border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 flex flex-col gap-1.5 flex-shrink-0">
      <div className="px-3 py-2 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Navigation</p>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1 truncate">{activeRole} Dashboard</p>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white font-medium shadow-md shadow-sky-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-sky-500'}`} />
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Smart Health AI v1.0</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-emerald-500">Connected</span>
        </div>
      </div>
    </aside>
  );
}
