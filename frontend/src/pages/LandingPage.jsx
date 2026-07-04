import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, BrainCircuit, Activity, ShieldCheck, ArrowRight, UserPlus, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: BrainCircuit,
      title: "AI Symptom Triage",
      desc: "Instantly analyze symptoms, predict risks, and get directed to the right clinical specialist, all backed by Google Gemini AI."
    },
    {
      icon: Activity,
      title: "Predictive Supply Chain",
      desc: "Automated low-stock alerts, AI-driven demand forecasting, and seamless redistribution prevent drug shortages before they occur."
    },
    {
      icon: HeartPulse,
      title: "Integrated Care Flow",
      desc: "Connects patients, doctors, pharmacists, and suppliers in a single encrypted network. Speeds up diagnostics and prescriptions."
    },
    {
      icon: ShieldCheck,
      title: "Secure Digital Records",
      desc: "Secure medical lockers, instant barcode-based patient lookup, and OCR-scanned prescription sheets stored securely."
    }
  ];

  const stats = [
    { value: "98.7%", label: "AI Diagnosis Precision" },
    { value: "45%", label: "Supply Reorder Speedup" },
    { value: "10k+", label: "Successful Consultations" },
    { value: "24/7", label: "Patient Care Availability" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex-1 space-y-6 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-100 bg-sky-50 dark:border-sky-950 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            Next-Gen AI Healthcare Ecosystem
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Intelligent Health &{' '}
            <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
              Supply Chain
            </span>{' '}
            Automation
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Smart Health bridges the clinical and supply chain divide. Real-time patient triage, AI clinical suggestions, barcode checkouts, and demand forecasting unite in a single unified dashboard.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button 
              onClick={() => navigate('/patient')} 
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Explore Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a 
              href="#features" 
              className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 font-semibold transition-all"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Hero Illustration Graphic */}
        <div className="flex-1 w-full max-w-md lg:max-w-xl z-10">
          <div className="glass p-4 rounded-3xl shadow-2xl relative border border-white/40 dark:border-white/5">
            {/* Simulation Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] font-bold text-slate-400">SMART HEALTH LABS</span>
            </div>
            
            {/* Visual Panels */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">AI Diagnosis Recommendation</p>
                  <p className="text-sm font-bold text-sky-600 dark:text-sky-400 mt-1">Acute Viral Pharyngitis</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Suggested: Amoxicillin 500mg, 5 Days</p>
                </div>
                <div className="flex-1 bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Supply Chain Risk</p>
                  <p className="text-sm font-bold text-rose-500 mt-1">High Shortage Risk</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Amlodipine 5mg: 8 units left</p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Global Inventory Analytics</p>
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">85% Accuracy Rate</p>
                </div>
                <div className="w-16 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center text-xs text-sky-600 dark:text-sky-400 font-bold border border-sky-500/20">
                  +12% Trend
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-sky-600 dark:text-sky-400">{stat.value}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Platform Features</h2>
          <p className="text-slate-600 dark:text-slate-400">
            A comprehensive clinical environment built to connect patient diagnoses directly with automated logistics.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="glass-card p-6 rounded-2xl hover:scale-[1.03] transition-all duration-300 border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500/10 to-emerald-500/10 flex items-center justify-center border border-sky-500/20">
                  <Icon className="w-6 h-6 text-sky-500" />
                </div>
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white dark:bg-slate-900 px-4">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold sm:text-4xl">How Smart Health Works</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Integrating four components of modern healthcare management into one real-time cycle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3 relative">
              <div className="text-6xl font-black text-sky-500/10 absolute -top-8 left-0">01</div>
              <h3 className="text-lg font-bold pt-2">Patient Checkup & AI Triage</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Patients describe symptoms (voice/text). Gemini AI categorizes severity and maps them to specialized doctors, notifying emergency units if critical.
              </p>
            </div>
            <div className="space-y-3 relative">
              <div className="text-6xl font-black text-sky-500/10 absolute -top-8 left-0">02</div>
              <h3 className="text-lg font-bold pt-2">Clinical Diagnostics & Prescribing</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Doctors write prescriptions in digital rooms. Suggested treatments are cross-verified against pharmacy inventory to ensure drug availability.
              </p>
            </div>
            <div className="space-y-3 relative">
              <div className="text-6xl font-black text-sky-500/10 absolute -top-8 left-0">03</div>
              <h3 className="text-lg font-bold pt-2">Automated Supply Fulfillment</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Low stock triggers reorders automatically. Suppliers ship products with real-time GPS tracking, updating inventory statistics automatically upon arrival.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-12 px-4 text-center text-sm text-slate-500">
        <p className="font-bold text-slate-800 dark:text-slate-300">Smart Health Web Application</p>
        <p className="mt-2 text-xs">Developed for Advanced AI Healthcare & Supply Chain Competitions</p>
        <p className="mt-6">&copy; {new Date().getFullYear()} Smart Health. All rights reserved.</p>
      </footer>
    </div>
  );
}
