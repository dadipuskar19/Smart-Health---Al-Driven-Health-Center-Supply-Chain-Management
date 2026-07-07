import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SupplierDashboard from './pages/SupplierDashboard';

export default function App() {
  const [activeRole, setActiveRole] = useState('Patient'); // Default role
  const [currentTab, setCurrentTab] = useState('symptoms');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const defaultTabs = {
    'Patient': 'symptoms',
    'Doctor': 'patients',
    'Pharmacist': 'inventory',
    'Hospital Administrator': 'analytics',
    'Supplier': 'orders'
  };

  // Sync currentTab when activeRole changes
  useEffect(() => {
    if (defaultTabs[activeRole]) {
      setCurrentTab(defaultTabs[activeRole]);
    }
  }, [activeRole]);

  // Apply dark mode class to HTML body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Wrapper layout to inject Sidebar & Navbar for dashboard pages
  const DashboardLayout = ({ children, roleName }) => {
    // Keep activeRole state in sync if navigated directly
    useEffect(() => {
      if (activeRole !== roleName) {
        setActiveRole(roleName);
      }
      setSidebarOpen(false); // Close mobile sidebar on navigation
    }, [roleName]);

    return (
      <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Navbar 
          activeRole={activeRole} 
          setActiveRole={setActiveRole} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            activeRole={activeRole} 
            currentTab={currentTab} 
            setCurrentTab={setCurrentTab}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 overflow-y-auto bg-slate-50/40 dark:bg-slate-950/20">
            {React.cloneElement(children, { 
              activeTab: currentTab, 
              setActiveTab: setCurrentTab 
            })}
          </main>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        {/* Landing Page Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard Routes */}
        <Route 
          path="/patient" 
          element={
            <DashboardLayout roleName="Patient">
              <PatientDashboard activeRole={activeRole} />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/doctor" 
          element={
            <DashboardLayout roleName="Doctor">
              <DoctorDashboard activeRole={activeRole} />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/pharmacist" 
          element={
            <DashboardLayout roleName="Pharmacist">
              <PharmacistDashboard activeRole={activeRole} />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <DashboardLayout roleName="Hospital Administrator">
              <AdminDashboard activeRole={activeRole} />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/supplier" 
          element={
            <DashboardLayout roleName="Supplier">
              <SupplierDashboard activeRole={activeRole} />
            </DashboardLayout>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
