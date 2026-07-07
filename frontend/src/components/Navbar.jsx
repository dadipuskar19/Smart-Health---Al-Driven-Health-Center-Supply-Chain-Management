import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, Bell, Shield, ChevronDown, Check, AlertTriangle, Info, CheckCircle2, Menu } from 'lucide-react';
import { fetchAPI } from '../utils/api';

export default function Navbar({ activeRole, setActiveRole, darkMode, setDarkMode, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roles = [
    'Patient',
    'Doctor',
    'Pharmacist',
    'Hospital Administrator',
    'Supplier'
  ];

  // Fetch notifications based on active role
  const loadNotifications = async () => {
    try {
      const data = await fetchAPI('/notifications', {}, activeRole);
      setNotifications(data);
    } catch (err) {
      console.warn('Could not load notifications from API');
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll notifications every 10 seconds for real-time feel
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [activeRole]);

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setShowRoleDropdown(false);
    
    // Redirect to corresponding dashboard
    if (role === 'Patient') navigate('/patient');
    else if (role === 'Doctor') navigate('/doctor');
    else if (role === 'Pharmacist') navigate('/pharmacist');
    else if (role === 'Hospital Administrator') navigate('/admin');
    else if (role === 'Supplier') navigate('/supplier');
  };

  const markAsRead = async (id) => {
    try {
      await fetchAPI(`/notifications/${id}/read`, { method: 'PUT' }, activeRole);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="sticky top-0 z-40 glass w-full border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-3 flex items-center justify-between">
      {/* Menu & Branding */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden transition-all"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20">
            SH
          </div>
          <span className="hidden sm:inline font-extrabold text-xl bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-emerald-400">
            Smart Health
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* DEMO ROLE SWITCHER */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-200 bg-sky-50/50 hover:bg-sky-50 text-sky-700 text-xs font-semibold shadow-sm transition-all dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-400 dark:hover:bg-sky-950/40"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Role: {activeRole || 'Guest'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 dark:bg-slate-900 dark:border-slate-800 animate-fade-in z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Demo Role Switcher
              </div>
              <div className="space-y-0.5">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl text-left transition-all ${
                      activeRole === role
                        ? 'bg-gradient-to-r from-sky-500/10 to-emerald-500/10 text-sky-700 dark:text-sky-300 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{role}</span>
                    {activeRole === role && <Check className="w-4 h-4 text-emerald-500" />}
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 px-3 py-1 text-[10px] text-slate-400 italic">
                * Switches sandbox users instantly.
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS CENTER */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 dark:bg-slate-900 dark:border-slate-800 animate-fade-in z-50">
              <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">System Alerts</span>
                <span className="text-[10px] text-slate-400">{unreadCount} new</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      onClick={() => !notif.isRead && markAsRead(notif._id)}
                      className={`p-3 text-left transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                        !notif.isRead ? 'bg-sky-50/20 dark:bg-sky-950/10' : ''
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        {notif.type === 'danger' && <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />}
                        {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
                        {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                        {notif.type === 'info' && <Info className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />}
                        
                        <div className="space-y-0.5">
                          <p className={`text-xs ${!notif.isRead ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* LIGHT/DARK MODE TOGGLE */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </nav>
  );
}
