import React, { useState, useEffect } from 'react';
import { 
  Users, Stethoscope, Calendar, Video, FileText, Send, 
  Activity, Check, Brain, Plus, Trash2, Camera, User 
} from 'lucide-react';
import { fetchAPI } from '../utils/api';

export default function DoctorDashboard({ activeRole, activeTab, setActiveTab }) {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // AI Assistant Diagnosis State
  const [diagnosisQuery, setDiagnosisQuery] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // New Prescription State
  const [selectedPatient, setSelectedPatient] = useState('');
  const [newDiag, setNewDiag] = useState('');
  const [prescNotes, setPrescNotes] = useState('');
  const [prescMeds, setPrescMeds] = useState([
    { name: '', dosage: '1-0-1', frequency: 'After food', duration: '5 days' }
  ]);
  const [prescLoading, setPrescLoading] = useState(false);

  // Load baseline doctor datasets
  useEffect(() => {
    loadDoctorData();
  }, [activeRole]);

  const loadDoctorData = async () => {
    try {
      const appts = await fetchAPI('/appointments', {}, activeRole);
      setAppointments(appts);

      // Fetch prescriptions
      const prescs = await fetchAPI('/prescriptions', {}, activeRole);
      setPrescriptions(prescs);

      // Extract unique patients from appointments to show in the list
      const uniquePatients = [];
      const seen = new Set();
      appts.forEach(a => {
        if (a.patient && !seen.has(a.patient._id)) {
          seen.add(a.patient._id);
          uniquePatients.push(a.patient);
        }
      });

      // Fallback patients if database is empty
      if (uniquePatients.length === 0) {
        setPatients([
          { _id: 'patient-1', name: 'Yash', email: 'patient@smarthealth.com', phone: '+91 9876543210', age: 29, bloodGroup: 'B+' }
        ]);
      } else {
        setPatients(uniquePatients);
      }
    } catch (err) {
      console.warn('Backend connection failed. Using mockup doctor dashboard.');
      setAppointments([
        { _id: '1', patient: { name: 'Yash', age: 29, bloodGroup: 'B+' }, date: '2026-07-06', time: '10:00 AM', status: 'Scheduled', notes: 'Chest tightness checkup' }
      ]);
      setPatients([
        { _id: 'patient-1', name: 'Yash', email: 'patient@smarthealth.com', phone: '+91 9876543210', age: 29, bloodGroup: 'B+' }
      ]);
      setPrescriptions([
        { _id: '1', patient: { name: 'Yash' }, diagnosis: 'Acute Pharyngitis', medicines: [{ name: 'Amoxicillin 500mg', dosage: '1-1-1', duration: '5 days' }] }
      ]);
    }
  };

  // 1. AI CLINICAL SUGGESTIONS
  const handleAISuggest = async (e) => {
    e.preventDefault();
    if (!diagnosisQuery.trim()) return;
    setAiLoading(true);
    setAiSuggestions(null);
    try {
      const data = await fetchAPI('/ai/treatment-plan', {
        method: 'POST',
        body: JSON.stringify({ diagnosis: diagnosisQuery, patientHistory: historyQuery })
      }, activeRole);
      setAiSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // 2. PRESCRIPTION BUILDER HANDLERS
  const addMedRow = () => {
    setPrescMeds([...prescMeds, { name: '', dosage: '1-0-1', frequency: 'After food', duration: '5 days' }]);
  };

  const removeMedRow = (index) => {
    setPrescMeds(prescMeds.filter((_, i) => i !== index));
  };

  const updateMedRow = (index, field, value) => {
    const updated = prescMeds.map((med, i) => i === index ? { ...med, [field]: value } : med);
    setPrescMeds(updated);
  };

  const submitPrescription = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !newDiag.trim() || prescMeds.some(m => !m.name.trim())) {
      alert('Please fill out patient, diagnosis, and medicine names.');
      return;
    }
    setPrescLoading(true);
    try {
      await fetchAPI('/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient,
          diagnosis: newDiag,
          medicines: prescMeds,
          notes: prescNotes
        })
      }, activeRole);
      
      alert('Prescription successfully registered and sent to patient!');
      // Reset
      setNewDiag('');
      setPrescNotes('');
      setPrescMeds([{ name: '', dosage: '1-0-1', frequency: 'After food', duration: '5 days' }]);
      setSelectedPatient('');
      
      // Refresh prescription logs
      const logs = await fetchAPI('/prescriptions', {}, activeRole);
      setPrescriptions(logs);
    } catch (err) {
      alert('Failed to register prescription on backend. Simulating offline log.');
      const patName = patients.find(p => p._id === selectedPatient)?.name || 'Patient';
      setPrescriptions(prev => [
        ...prev,
        { _id: Math.random().toString(), patient: { name: patName }, diagnosis: newDiag, medicines: prescMeds }
      ]);
    } finally {
      setPrescLoading(false);
    }
  };

  // 3. APPOINTMENT COMPLETION
  const completeAppointment = async (id) => {
    try {
      await fetchAPI(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Completed' })
      }, activeRole);
      // Refresh
      const appts = await fetchAPI('/appointments', {}, activeRole);
      setAppointments(appts);
    } catch (err) {
      setAppointments(appointments.map(a => a._id === id ? { ...a, status: 'Completed' } : a));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight">Clinical Doctor Panel</h2>
        <p className="text-xs text-slate-500 mt-1">Review active patient logs, issue electronic prescriptions, and launch video rooms</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-900 pb-3 overflow-x-auto scrollbar-none flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        {['patients', 'diagnosis', 'appointments', 'video', 'prescriptions'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: 1. PATIENTS */}
      {activeTab === 'patients' && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          {/* Patient Card Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold">Assigned Patients</h3>
            <div className="space-y-3">
              {patients.map(pat => (
                <div key={pat._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{pat.name}</p>
                      <p className="text-[10px] text-slate-500">{pat.email} | {pat.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/50 text-[11px] text-slate-500">
                    <span>Blood Group: <strong className="text-slate-700 dark:text-slate-300">{pat.bloodGroup || 'B+'}</strong></span>
                    <span>Age: <strong className="text-slate-700 dark:text-slate-300">{pat.age || 29}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Prescription Logs */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold">Past Clinical Records issued</h3>
            <div className="space-y-3">
              {prescriptions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No prescription histories found.
                </div>
              ) : (
                prescriptions.map(presc => (
                  <div key={presc._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-sky-600 dark:text-sky-400">Diagnosis: {presc.diagnosis}</span>
                      <span className="text-[10px] text-slate-400">{presc.date || 'July 2, 2026'}</span>
                    </div>
                    <div className="space-y-1">
                      {presc.medicines.map((m, i) => (
                        <div key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between bg-slate-50/55 dark:bg-slate-800/30 px-2.5 py-1 rounded-lg">
                          <span>{m.name}</span>
                          <span>{m.dosage} ({m.duration})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. AI DIAGNOSIS ASSISTANT */}
      {activeTab === 'diagnosis' && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          {/* Query Form */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 h-fit">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Brain className="w-5 h-5 text-sky-500 animate-pulse" />
              Gemini Clinical Diagnosis Assistant
            </h3>
            <form onSubmit={handleAISuggest} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Active Symptoms</label>
                <input
                  type="text"
                  value={diagnosisQuery}
                  onChange={(e) => setDiagnosisQuery(e.target.value)}
                  placeholder="e.g. Hypertension, blood sugar spike, sore throat..."
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Comorbidities / History</label>
                <input
                  type="text"
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder="e.g. Chronic Asthma, Penicillin allergy..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={aiLoading || !diagnosisQuery.trim()}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md"
              >
                {aiLoading ? 'Requesting Gemini suggestions...' : 'Get Clinical suggestions'}
              </button>
            </form>
          </div>

          {/* AI Output Result */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold">Clinical Suggestions</h3>
            {aiSuggestions ? (
              <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 animate-fade-in">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Suggested Prescription Protocol</p>
                  <div className="space-y-1.5 mt-2">
                    {aiSuggestions.medicines?.map((med, idx) => (
                      <div key={idx} className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{med.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{med.dosage} | {med.duration} ({med.instructions})</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Lifestyle & Safety Precautions</p>
                  <ul className="mt-2 space-y-1">
                    {aiSuggestions.lifestyleChanges?.map((chg, idx) => (
                      <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{chg}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-500 italic">
                  Followup timeline: {aiSuggestions.followUp}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Submit active diagnostics criteria to load suggestions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold">Scheduled Patient Visits</h3>
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No appointment schedules.
              </div>
            ) : (
              appointments.map(appt => (
                <div key={appt._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{appt.patient?.name || 'Walkin Patient'}</p>
                    <p className="text-[10px] text-slate-500">{appt.date} | {appt.time}</p>
                    {appt.notes && <p className="text-[11px] text-slate-400 italic">"{appt.notes}"</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      appt.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {appt.status}
                    </span>

                    {appt.status === 'Scheduled' && (
                      <button
                        onClick={() => completeAppointment(appt._id)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. VIDEO CONSULTATION */}
      {activeTab === 'video' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Main Video feed */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold">Telehealth Video consultation</h3>
            <div className="bg-slate-900 rounded-3xl overflow-hidden aspect-video flex flex-col justify-between p-4 relative shadow-2xl">
              {/* Overlay patient badge */}
              <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold w-fit z-10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live: Patient Yash
              </div>

              {/* Graphic animation placeholder simulating feed */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-3">
                <Camera className="w-10 h-10 animate-pulse text-sky-500" />
                <span className="text-xs font-semibold text-slate-500 font-mono">ESTABLISHING AUDIO/VIDEO STREAM...</span>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-3 z-10">
                <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md">
                  End Consultation
                </button>
                <button className="px-4 py-2 bg-slate-700/60 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-white/10">
                  Mute Mic
                </button>
              </div>
            </div>
          </div>

          {/* Shared Clinical Notepad */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 flex flex-col h-full">
            <h3 className="text-sm font-bold">Shared Consultation Notes</h3>
            <textarea
              placeholder="Start typing patient consultation logs or observations here..."
              className="w-full flex-1 rounded-xl border border-slate-200 p-3 text-xs bg-white dark:border-slate-800 dark:bg-slate-950 outline-none"
              rows={8}
            />
            <button className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold">
              Save Notes to EHR
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. ISSUE PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 space-y-6 animate-fade-in">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-500" />
            Digital Prescription Creator
          </h3>
          <form onSubmit={submitPrescription} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Select Target Patient</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.name} (Age: {p.age})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Clinical Diagnosis</label>
                <input
                  type="text"
                  value={newDiag}
                  onChange={(e) => setNewDiag(e.target.value)}
                  placeholder="e.g. Acute Bacterial Pharyngitis"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Medicines List Rows */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Medications & Instructions</span>
                <button
                  type="button"
                  onClick={addMedRow}
                  className="flex items-center gap-1 text-[10px] text-sky-600 hover:text-sky-700 font-extrabold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drug
                </button>
              </div>

              <div className="space-y-2">
                {prescMeds.map((med, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-850">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedRow(idx, 'name', e.target.value)}
                        placeholder="Drug name (e.g. Amoxicillin)"
                        required
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white dark:border-slate-800 dark:bg-slate-950"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedRow(idx, 'dosage', e.target.value)}
                        placeholder="Dosage (1-0-1)"
                        required
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white dark:border-slate-800 dark:bg-slate-950"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMedRow(idx, 'frequency', e.target.value)}
                        placeholder="Freq (After food)"
                        required
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white dark:border-slate-800 dark:bg-slate-950"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMedRow(idx, 'duration', e.target.value)}
                        placeholder="Dur (5 days)"
                        required
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white dark:border-slate-800 dark:bg-slate-950"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeMedRow(idx)}
                        disabled={prescMeds.length === 1}
                        className="text-rose-500 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Prescription Notes / Advice</label>
              <textarea
                value={prescNotes}
                onChange={(e) => setPrescNotes(e.target.value)}
                placeholder="Lifestyle warnings, dietary restrictions, next clinical follow-up details..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={prescLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {prescLoading ? 'Issuing Digital Record...' : 'Issue E-Prescription'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
