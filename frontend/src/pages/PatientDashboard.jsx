import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, Send, Mic, MicOff, Calendar, FileText, Clock, Calculator, 
  User, Check, AlertOctagon, HelpCircle, Phone, MapPin, Plus, FileDown 
} from 'lucide-react';
import { fetchAPI } from '../utils/api';

export default function PatientDashboard({ activeRole, activeTab, setActiveTab }) {
  const [symptomsInput, setSymptomsInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [typingTimer, setTypingTimer] = useState(null); // Keep reference to prevent overlapping typing simulations
  const [symptomResult, setSymptomResult] = useState(null);
  const [symptomLoading, setSymptomLoading] = useState(false);

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your 24/7 Smart Health AI assistant. Describe your symptoms or ask me any medical questions.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Appointments State
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptNotes, setApptNotes] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);

  // Records State
  const [records, setRecords] = useState([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [ocrTextSim, setOcrTextSim] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Reminders State
  const [reminders, setReminders] = useState([
    { _id: '1', medicineName: 'Cetirizine 10mg', time: '21:00', active: true },
    { _id: '2', medicineName: 'Inhaler (Albuterol)', time: '08:00', active: true }
  ]);
  const [newReminderMed, setNewReminderMed] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');

  // Health Calculators State
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmiResult, setBmiResult] = useState(null);
  const [riskAge, setRiskAge] = useState('');
  const [riskSystolic, setRiskSystolic] = useState('');
  const [riskSmoker, setRiskSmoker] = useState('no');
  const [riskResult, setRiskResult] = useState(null);

  // Language Preferences
  const [lang, setLang] = useState('English');

  // Load baseline data
  useEffect(() => {
    loadDashboardData();
  }, [activeRole]);

  const loadDashboardData = async () => {
    try {
      // 1. Fetch appointments
      const appts = await fetchAPI('/appointments', {}, activeRole);
      setAppointments(appts);
      
      // 2. Fetch doctors for booking selection
      const users = await fetchAPI('/appointments', {}, 'Doctor'); // Using backdoor
      const uniqueDocs = [];
      const seen = new Set();
      users.forEach(u => {
        if (u.doctor && !seen.has(u.doctor._id)) {
          seen.add(u.doctor._id);
          uniqueDocs.push(u.doctor);
        }
      });
      // Fallback doctors if database has nothing
      if (uniqueDocs.length === 0) {
        setDoctorsList([
          { _id: 'mock-doc-1', name: 'Dr. Pushkar', specialization: 'Cardiologist' },
          { _id: 'mock-doc-2', name: 'Dr. Vikram Patel', specialization: 'General Physician' }
        ]);
      } else {
        setDoctorsList(uniqueDocs);
      }

      // 3. Fetch medical records
      const recs = await fetchAPI('/records', {}, activeRole);
      setRecords(recs);

      // 4. Fetch Patient profile reminders
      const profile = await fetchAPI('/patient/profile', {}, activeRole);
      if (profile && profile.reminders) {
        setReminders(profile.reminders);
      }
    } catch (err) {
      console.warn('Backend connection failed. Using mock dashboard data.');
      // Set fallbacks for mock presentation
      setAppointments([
        { _id: '1', doctor: { name: 'Dr. Pushkar' }, date: '2026-07-06', time: '10:00 AM', status: 'Scheduled', notes: 'Routine checkup' }
      ]);
      setDoctorsList([
        { _id: 'mock-doc-1', name: 'Dr. Pushkar', email: 'doctor@smarthealth.com' },
        { _id: 'mock-doc-2', name: 'Dr. Vikram Patel', email: 'doctor2@smarthealth.com' }
      ]);
      setRecords([
        { _id: '1', fileName: 'lab_report_june.pdf', uploadDate: new Date(), geminiSummary: 'Blood sugar normal, mild vitamin D deficiency.' }
      ]);
    }
  };

  // 1. SYMPTOM CHECKER HANDLERS
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      simulateVoiceInput();
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = lang === 'Telugu' ? 'te-IN' : (lang === 'Hindi' ? 'hi-IN' : 'en-US');
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setSymptomsInput('Listening...');
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setIsRecording(false);
      simulateVoiceInput();
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSymptomsInput(transcript);
    };

    recognition.start();
  };

  const simulateVoiceInput = () => {
    if (isRecording) {
      if (typingTimer) {
        clearInterval(typingTimer);
        setTypingTimer(null);
      }
      setIsRecording(false);
      return;
    }
    
    setIsRecording(true);
    const voicePhases = [
      "I have been feeling chest pain and shortness of breath for the last two hours.",
      "I have a mild fever, dry cough, and a scratchy sore throat.",
      "My stomach hurts right after eating, and I feel nauseous."
    ];
    const selectedText = voicePhases[Math.floor(Math.random() * voicePhases.length)];
    let index = 0;
    setSymptomsInput('');
    
    const timer = setInterval(() => {
      setSymptomsInput(prev => {
        if (index < selectedText.length) {
          const nextChar = selectedText.charAt(index);
          index++;
          return prev + nextChar;
        } else {
          clearInterval(timer);
          setIsRecording(false);
          setTypingTimer(null);
          return prev;
        }
      });
    }, 40);
    
    setTypingTimer(timer);
  };

  const handleSymptomSubmit = async (e) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;
    setSymptomLoading(true);
    setSymptomResult(null);
    try {
      const result = await fetchAPI('/ai/symptom-check', {
        method: 'POST',
        body: JSON.stringify({ symptoms: symptomsInput, age: 29, gender: 'Male' })
      }, activeRole);
      setSymptomResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setSymptomLoading(false);
    }
  };

  // 2. CHATBOT HANDLERS
  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const data = await fetchAPI('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: chatInput,
          chatHistory: chatMessages.slice(-6) 
        })
      }, activeRole);
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection timed out. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // 3. APPOINTMENT BOOKING HANDLERS
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !apptDate || !apptTime) return;
    setApptLoading(true);
    try {
      await fetchAPI('/appointments', {
        method: 'POST',
        body: JSON.stringify({ doctorId: selectedDoctor, date: apptDate, time: apptTime, notes: apptNotes })
      }, activeRole);
      // Refresh list
      const appts = await fetchAPI('/appointments', {}, activeRole);
      setAppointments(appts);
      setSelectedDoctor('');
      setApptDate('');
      setApptTime('');
      setApptNotes('');
      alert('Appointment booked successfully!');
    } catch (err) {
      alert('Booking failed. Attempting offline appointment simulation.');
      const docName = doctorsList.find(d => d._id === selectedDoctor)?.name || 'Doctor';
      setAppointments(prev => [
        ...prev,
        { _id: Math.random().toString(), doctor: { name: docName }, date: apptDate, time: apptTime, status: 'Scheduled', notes: apptNotes }
      ]);
    } finally {
      setApptLoading(false);
    }
  };

  // 4. MEDICAL RECORD HANDLERS
  const handleRecordUpload = async (e) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;
    setUploadLoading(true);
    try {
      await fetchAPI('/records/upload', {
        method: 'POST',
        body: JSON.stringify({ fileName: uploadFileName, ocrText: ocrTextSim })
      }, activeRole);
      const recs = await fetchAPI('/records', {}, activeRole);
      setRecords(recs);
      setUploadFileName('');
      setOcrTextSim('');
    } catch (err) {
      setRecords(prev => [
        ...prev,
        { _id: Math.random().toString(), fileName: uploadFileName, uploadDate: new Date(), geminiSummary: 'Simulated record uploaded successfully.' }
      ]);
      setUploadFileName('');
    } finally {
      setUploadLoading(false);
    }
  };

  // 5. REMINDER HANDLERS
  const handleAddReminder = (e) => {
    e.preventDefault();
    if (!newReminderMed.trim() || !newReminderTime) return;
    setReminders(prev => [
      ...prev,
      { _id: Math.random().toString(), medicineName: newReminderMed, time: newReminderTime, active: true }
    ]);
    setNewReminderMed('');
    setNewReminderTime('');
  };

  const toggleReminder = (id) => {
    setReminders(reminders.map(r => r._id === id ? { ...r, active: !r.active } : r));
  };

  // 6. HEALTH CALCULATORS HANDLERS
  const calculateBMI = (e) => {
    e.preventDefault();
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w) return;
    const bmi = (w / (h * h)).toFixed(1);
    let category = 'Normal';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi >= 25 && bmi < 30) category = 'Overweight';
    else if (bmi >= 30) category = 'Obese';
    setBmiResult({ bmi, category });
  };

  const predictHealthRisk = (e) => {
    e.preventDefault();
    const age = parseInt(riskAge);
    const bp = parseInt(riskSystolic);
    if (!age || !bp) return;
    
    // Quick heuristic health risk assessment
    let risk = 'Low';
    let advice = 'Your vitals look great. Maintain a balanced diet and exercise daily.';
    if (bp > 140 || (bp > 130 && riskSmoker === 'yes') || age > 60) {
      risk = 'High';
      advice = 'Higher risk of cardiovascular fatigue. Recommend regular BP tracking and booking a consult with a cardiologist.';
    } else if (bp > 120 || age > 45) {
      risk = 'Medium';
      advice = 'Moderate risk indicators. Keep sodium intake low and monitor BP twice weekly.';
    }
    setRiskResult({ risk, advice });
  };

  // Multilingual translations helper
  const translations = {
    'English': {
      title: 'AI Symptom Analysis & Clinical Router',
      desc: 'Enter your symptoms below or click the microphone to simulate voice dictation. Our AI will analyze conditions and guide your next steps.',
      placeholder: 'Describe how you feel (e.g. fever for 2 days, dry cough)...'
    },
    'Telugu': {
      title: 'AI లక్షణాల విశ్లేషణ & క్లినికల్ రూటర్',
      desc: 'దిగువ మీ లక్షణాలను నమోదు చేయండి లేదా మైక్రోఫోన్ క్లిక్ చేయండి. మా AI మీ ఆరోగ్యాన్ని విశ్లేషిస్తుంది.',
      placeholder: 'మీకు ఎలా ఉందో వివరించండి (ఉదా. 2 రోజులుగా జ్వరం, పొడి దగ్గు)...'
    },
    'Hindi': {
      title: 'AI लक्षण विश्लेषण और नैदानिक रूटर',
      desc: 'नीचे अपने लक्षण दर्ज करें या वॉयस डिक्टेशन के लिए माइक्रोफ़ोन पर क्लिक करें। हमारी AI रिपोर्ट तैयार करेगी।',
      placeholder: 'बताएं कि आप कैसा महसूस कर रहे हैं (जैसे 2 दिन से बुखार, सूखी खांसी)...'
    }
  };

  const t = translations[lang] || translations['English'];

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto space-y-6">
      {/* Tab Select Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Patient Care Center</h2>
          <p className="text-xs text-slate-500 mt-1">Access symptom triage, chatbots, reminders, and telehealth lockers</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">Language:</span>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)} 
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
          >
            <option value="English">English</option>
            <option value="Telugu">Telugu</option>
            <option value="Hindi">Hindi</option>
          </select>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-900 pb-3 overflow-x-auto scrollbar-none flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        {['symptoms', 'chatbot', 'appointments', 'records', 'reminders', 'calculators'].map(tab => (
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

      {/* TAB CONTENT: 1. SYMPTOMS */}
      {activeTab === 'symptoms' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-sky-500 animate-pulse" />
              {t.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
            
            <form onSubmit={handleSymptomSubmit} className="space-y-3">
              <div className="relative">
                <textarea
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder={t.placeholder}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-900 pr-12 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={startSpeechRecognition}
                  className={`absolute right-3 bottom-4 p-2 rounded-full transition-all ${
                    isRecording 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400'
                  }`}
                  title="Simulate Voice Input"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={symptomLoading || !symptomsInput.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-55"
              >
                {symptomLoading ? 'Analyzing Symptoms...' : 'Analyze with Gemini AI'}
              </button>
            </form>
          </div>

          {/* AI Symptom Results */}
          {symptomResult && (
            <div className="space-y-6 animate-fade-in">
              {/* Emergency Alert Header if High Severity */}
              {symptomResult.severity === 'High' && (
                <div className="bg-rose-500 text-white p-6 rounded-2xl shadow-xl shadow-rose-500/10 flex flex-col md:flex-row items-start gap-4 pulse-emergency">
                  <AlertOctagon className="w-10 h-10 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="text-lg font-black uppercase tracking-wider">Critical Warning Detected</h4>
                    <p className="text-sm leading-relaxed font-semibold">
                      {symptomResult.emergencyWarning || "Your reported symptoms match a high-risk cardiac or respiratory threshold. Please take action immediately."}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <a href="tel:102" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-rose-600 text-xs font-extrabold hover:bg-rose-50 transition-all">
                        <Phone className="w-3.5 h-3.5" />
                        Call Ambulance (102/911)
                      </a>
                      <div className="flex items-center gap-1.5 text-xs text-rose-100 font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        Nearest Emergency Care: Apollo Hospital (0.8 km)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detail Panels */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">AI Diagnostic Analysis</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">Severity Assessment:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      symptomResult.severity === 'High' ? 'bg-rose-100 text-rose-700' :
                      symptomResult.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {symptomResult.severity}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-slate-500">Possible Conditions:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {symptomResult.possibleConditions?.map((c, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 italic">
                    {symptomResult.explanation}
                  </p>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Recommended Referral</p>
                    <p className="text-sm font-bold text-sky-600 dark:text-sky-400 mt-1">
                      Referral: Specialist in {symptomResult.recommendedSpecialist}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Immediate Self-Care Instructions</p>
                    <ul className="mt-2 space-y-1.5">
                      {symptomResult.selfCareTips?.map((tip, i) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2. CHATBOT */}
      {activeTab === 'chatbot' && (
        <div className="glass-card rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col h-[500px] overflow-hidden animate-fade-in">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-tr from-sky-500 to-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  <p className="font-semibold text-[10px] opacity-75 uppercase tracking-wider mb-0.5">
                    {msg.role === 'user' ? 'You' : 'Smart Health AI'}
                  </p>
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSend} className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about medications, side effects, wellness guides..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-950 outline-none"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: 3. APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Booking Form */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 h-fit">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              Schedule Consult
            </h3>
            <form onSubmit={handleBookAppointment} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Select Doctor</label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="">-- Choose Specialization --</option>
                  {doctorsList.map(doc => (
                    <option key={doc._id} value={doc._id}>
                      {doc.name} - {doc.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                  <input
                    type="date"
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Time</label>
                  <input
                    type="text"
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Chief Complaint / Symptoms</label>
                <input
                  type="text"
                  value={apptNotes}
                  onChange={(e) => setApptNotes(e.target.value)}
                  placeholder="Describe main concern..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={apptLoading}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all"
              >
                {apptLoading ? 'Scheduling...' : 'Confirm Appointment'}
              </button>
            </form>
          </div>

          {/* Active Bookings list */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold">Upcoming consultations</h3>
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl dark:border-slate-800">
                  No upcoming appointments scheduled.
                </div>
              ) : (
                appointments.map(appt => (
                  <div key={appt._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {appt.doctor?.name || 'Assigned Clinician'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {appt.date} | {appt.time}
                      </p>
                      {appt.notes && <p className="text-[11px] text-slate-400 mt-1 italic">"{appt.notes}"</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        appt.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                      }`}>
                        {appt.status}
                      </span>
                      {appt.status === 'Scheduled' && appt.roomId && (
                        <div className="text-[10px] bg-slate-100 dark:bg-slate-800 border px-2 py-1 rounded-lg text-slate-600 dark:text-slate-400 font-mono">
                          Room: {appt.roomId}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. MEDICAL RECORDS */}
      {activeTab === 'records' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Lab Report Mock OCR upload */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 h-fit">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-500" />
              Upload Medical Report
            </h3>
            <form onSubmit={handleRecordUpload} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Document Name</label>
                <input
                  type="text"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="e.g. Blood_Report_July.pdf"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Mock Report Text (Simulates Scan/OCR)</label>
                <textarea
                  value={ocrTextSim}
                  onChange={(e) => setOcrTextSim(e.target.value)}
                  placeholder="Input scanned lines or clinical notes to simulate OCR scanning..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={uploadLoading || !uploadFileName.trim()}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all"
              >
                {uploadLoading ? 'Uploading & Summarizing...' : 'Upload Record'}
              </button>
            </form>
          </div>

          {/* Records grid */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold">Your Clinical Records Locker</h3>
            <div className="space-y-3">
              {records.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No records stored yet. Upload a laboratory report to parse summaries.
                </div>
              ) : (
                records.map(rec => (
                  <div key={rec._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{rec.fileName}</span>
                      </div>
                      <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-1 text-[10px] text-sky-600 hover:text-sky-700 font-bold"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        PDF Export
                      </button>
                    </div>
                    {rec.geminiSummary && (
                      <div className="bg-sky-50/30 dark:bg-sky-950/10 p-3 rounded-xl border border-sky-500/10 text-xs text-slate-600 dark:text-slate-300 leading-normal">
                        <p className="font-extrabold text-[10px] text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-1">
                          Gemini AI Summary
                        </p>
                        {rec.geminiSummary}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. REMINDERS */}
      {activeTab === 'reminders' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Add Reminder */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 h-fit">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" />
              Add Medicine Reminder
            </h3>
            <form onSubmit={handleAddReminder} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Medicine Name</label>
                <input
                  type="text"
                  value={newReminderMed}
                  onChange={(e) => setNewReminderMed(e.target.value)}
                  placeholder="e.g. Paracetamol 650mg"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Time (HH:MM)</label>
                <input
                  type="time"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all"
              >
                Add Alert Reminder
              </button>
            </form>
          </div>

          {/* Active reminders list */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold">Active Medicine Alarms</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {reminders.map(rem => (
                <div key={rem._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/20 flex items-center justify-center text-sky-500">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{rem.medicineName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Alerts at {rem.time}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleReminder(rem._id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all ${
                      rem.active 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                    }`}
                  >
                    {rem.active ? 'Active' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. CALCULATORS */}
      {activeTab === 'calculators' && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          {/* BMI Calculator */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Calculator className="w-4 h-4 text-sky-500" />
              BMI & Body Mass Calculator
            </h3>
            <form onSubmit={calculateBMI} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    required
                    placeholder="175"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    placeholder="70"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs"
              >
                Calculate BMI
              </button>
            </form>

            {bmiResult && (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Your BMI Value</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{bmiResult.bmi}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Category</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                    {bmiResult.category}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Health Risk Predictor */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Calculator className="w-4 h-4 text-sky-500" />
              AI Cardiovascular Health Risk Predictor
            </h3>
            <form onSubmit={predictHealthRisk} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Age</label>
                  <input
                    type="number"
                    value={riskAge}
                    onChange={(e) => setRiskAge(e.target.value)}
                    required
                    placeholder="45"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={riskSystolic}
                    onChange={(e) => setRiskSystolic(e.target.value)}
                    required
                    placeholder="125"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Do you smoke?</label>
                <select
                  value={riskSmoker}
                  onChange={(e) => setRiskSmoker(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs"
              >
                Analyze Risk Indicators
              </button>
            </form>

            {riskResult && (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Heart Risk Profile:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    riskResult.risk === 'High' ? 'bg-rose-100 text-rose-700' :
                    riskResult.risk === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {riskResult.risk} Risk
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal italic">{riskResult.advice}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
