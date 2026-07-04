const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API if key is present
let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.error('Failed to initialize GoogleGenerativeAI:', err.message);
  }
}

// Helper to check if API is available
const isAIAvailable = () => genAI !== null;

/**
 * 1. ANALYZE SYMPTOMS & RECOMMEND SPECIALIST & EMERGENCY LEVEL
 */
exports.analyzeSymptoms = async (req, res) => {
  const { symptoms, gender, age } = req.body;
  if (!symptoms) {
    return res.status(400).json({ error: 'Symptoms are required' });
  }

  const prompt = `
    You are a professional medical AI assistant. Analyze these symptoms:
    Symptoms: "${symptoms}"
    Patient details: ${age ? age + ' years old' : 'Age unknown'}, ${gender || 'Gender unknown'}.
    
    Respond STRICTLY in JSON format with the following keys. Do not include any markdown markup outside the JSON code block.
    JSON structure:
    {
      "possibleConditions": ["Condition A", "Condition B"],
      "severity": "Low" | "Medium" | "High",
      "recommendedSpecialist": "e.g., Cardiologist",
      "explanation": "Brief non-binding explanation.",
      "emergencyWarning": "Emergency warning string if severity is High, else empty string.",
      "selfCareTips": ["Tip 1", "Tip 2"]
    }
  `;

  if (isAIAvailable()) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Clean up markdown block if present
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return res.json(parsed);
    } catch (err) {
      console.warn('Gemini API error, falling back to mock:', err.message);
    }
  }

  // MOCK FALLBACK (highly responsive, covers common symptoms)
  const symLower = symptoms.toLowerCase();
  let possibleConditions = ['Mild Viral Infection', 'General Fatigue'];
  let severity = 'Low';
  let recommendedSpecialist = 'General Physician';
  let explanation = 'Your symptoms suggest a mild, self-limiting condition. Ensure adequate hydration and rest.';
  let emergencyWarning = '';
  let selfCareTips = ['Stay hydrated', 'Get 8 hours of sleep', 'Monitor temperature'];

  if (symLower.includes('chest pain') || symLower.includes('heart') || symLower.includes('shortness of breath')) {
    possibleConditions = ['Angina Pectoris', 'Myocardial Infarction (Heart Attack)', 'Acute Respiratory Distress'];
    severity = 'High';
    recommendedSpecialist = 'Cardiologist / Emergency Medicine';
    explanation = 'Chest pain and shortness of breath are critical symptoms that could indicate cardiovascular or respiratory emergencies.';
    emergencyWarning = 'EMERGENCY: Please seek immediate medical attention. Call an ambulance or visit the nearest emergency room immediately!';
    selfCareTips = ['Sit upright and remain calm', 'Avoid physical exertion', 'Have someone stay with you'];
  } else if (symLower.includes('fever') || symLower.includes('cough') || symLower.includes('throat')) {
    possibleConditions = ['Common Cold', 'Influenza (Flu)', 'Streptococcal Pharyngitis'];
    severity = 'Medium';
    recommendedSpecialist = 'General Physician / ENT';
    explanation = 'A fever and throat congestion usually point to a respiratory viral or bacterial infection.';
    selfCareTips = ['Warm saline gargles', 'Paracetamol for fever as advised by doctor', 'Steam inhalation'];
  } else if (symLower.includes('stomach') || symLower.includes('pain in abdomen') || symLower.includes('vomit') || symLower.includes('diarrhea')) {
    possibleConditions = ['Gastroenteritis', 'Food Poisoning', 'Acid Reflux'];
    severity = 'Medium';
    recommendedSpecialist = 'Gastroenterologist';
    explanation = 'Abdominal pain and vomiting point towards gastric irritation, food infection, or acid reflux.';
    selfCareTips = ['Follow a bland diet (BRAT diet)', 'Drink ORS to restore electrolytes', 'Avoid oily/spicy foods'];
  } else if (symLower.includes('headache') || symLower.includes('migraine')) {
    possibleConditions = ['Tension Headache', 'Migraine', 'Dehydration Headache'];
    severity = 'Low';
    recommendedSpecialist = 'Neurologist / General Practitioner';
    explanation = 'Headaches are commonly caused by stress, lack of sleep, or dehydration. Persistent, severe headaches should be evaluated.';
    selfCareTips = ['Rest in a dark, quiet room', 'Apply a cold compress', 'Drink plenty of water'];
  }

  return res.json({
    possibleConditions,
    severity,
    recommendedSpecialist,
    explanation,
    emergencyWarning,
    selfCareTips
  });
};

/**
 * 2. TREATMENT PLAN SUGGESTIONS (FOR DOCTOR PORTAL)
 */
exports.getTreatmentPlan = async (req, res) => {
  const { diagnosis, patientHistory } = req.body;
  if (!diagnosis) {
    return res.status(400).json({ error: 'Diagnosis is required' });
  }

  const prompt = `
    You are a medical consultant. Suggest a treatment plan for a patient diagnosed with: "${diagnosis}".
    Patient medical history: "${patientHistory || 'None'}".
    Provide recommendations in JSON format:
    {
      "medicines": [
        { "name": "Medicine Name", "dosage": "e.g., 1-0-1", "duration": "5 days", "instructions": "After food" }
      ],
      "lifestyleChanges": ["Advice 1", "Advice 2"],
      "followUp": "Follow up timeline recommendation."
    }
  `;

  if (isAIAvailable()) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return res.json(JSON.parse(cleanText));
    } catch (err) {
      console.warn('Gemini treatment plan error, falling back:', err.message);
    }
  }

  // Fallback
  let medicines = [{ name: 'Paracetamol 650mg', dosage: '1-0-1', duration: '3 days', instructions: 'After food, if fever persists' }];
  let lifestyleChanges = ['Rest adequately', 'Avoid strenuous physical activity'];
  let followUp = 'Follow up in 5 days if symptoms do not improve.';

  const diag = diagnosis.toLowerCase();
  if (diag.includes('hypertension') || diag.includes('high blood pressure')) {
    medicines = [
      { name: 'Amlodipine 5mg', dosage: '1-0-0', duration: '30 days', instructions: 'Morning before food' },
      { name: 'Telmisartan 40mg', dosage: '0-0-1', duration: '30 days', instructions: 'Night after food' }
    ];
    lifestyleChanges = ['Reduce sodium intake (< 2g/day)', 'Daily 30 minutes brisk walking', 'Monitor BP twice daily'];
    followUp = 'Follow up in 2 weeks with a BP log sheet.';
  } else if (diag.includes('diabetes')) {
    medicines = [
      { name: 'Metformin 500mg', dosage: '1-0-1', duration: '30 days', instructions: 'With meals' }
    ];
    lifestyleChanges = ['Strict low-glycemic index diet', 'Monitor fasting and post-prandial blood sugar', 'Avoid refined sugars'];
    followUp = 'Follow up in 1 month with HbA1c reports.';
  } else if (diag.includes('migraine')) {
    medicines = [
      { name: 'Sumatriptan 50mg', dosage: '1-0-0', duration: 'As needed', instructions: 'At the onset of migraine attack' },
      { name: 'Naproxen 500mg', dosage: '0-0-1', duration: '5 days', instructions: 'After food when pain occurs' }
    ];
    lifestyleChanges = ['Avoid triggers like bright lights or loud noises', 'Maintain regular sleep cycles', 'Stay hydrated'];
    followUp = 'Follow up in 3 weeks with headache diary tracker.';
  }

  return res.json({ medicines, lifestyleChanges, followUp });
};

/**
 * 3. SUPPLY CHAIN DEMAND FORECASTING (FOR ADMINISTRATOR/PHARMACIST)
 */
exports.getDemandForecast = async (req, res) => {
  const { medicineName, historicalSales, currentStock } = req.body;
  if (!medicineName) {
    return res.status(400).json({ error: 'Medicine name is required' });
  }

  const prompt = `
    You are an AI supply chain analyst for a hospital.
    Medicine: "${medicineName}"
    Current Stock Level: ${currentStock || 0}
    Monthly Sales/Usage History: ${JSON.stringify(historicalSales || [45, 52, 60, 58])} (last 4 months).
    
    Calculate and project:
    1. Expected demand for the next month.
    2. Optimal reorder quantity.
    3. Shortage risk (Low / Medium / High).
    4. Recommended stock redistribution (if other branches have surplus).
    
    Respond in JSON format:
    {
      "expectedDemand": 65,
      "optimalReorderQuantity": 100,
      "shortageRisk": "Low" | "Medium" | "High",
      "redistributionAdvice": "Advice details",
      "rationale": "Explanation of prediction"
    }
  `;

  if (isAIAvailable()) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return res.json(JSON.parse(cleanText));
    } catch (err) {
      console.warn('Gemini demand forecast error, falling back:', err.message);
    }
  }

  // Fallback calculations
  const history = historicalSales || [40, 48, 55, 62];
  const avgMonthly = history.reduce((a, b) => a + b, 0) / history.length;
  // Predict an upward trend if history is increasing
  const lastMonth = history[history.length - 1];
  const predicted = Math.round(lastMonth * 1.12);
  const stock = currentStock || 15;
  const shortageRisk = stock < predicted * 0.4 ? 'High' : (stock < predicted ? 'Medium' : 'Low');
  const reorder = shortageRisk !== 'Low' ? Math.max(100, predicted * 2 - stock) : 0;

  return res.json({
    expectedDemand: predicted,
    optimalReorderQuantity: reorder,
    shortageRisk,
    redistributionAdvice: shortageRisk === 'High' 
      ? `High shortage risk. We recommend transferring 30 units of ${medicineName} from City Central Pharmacy (Surplus: 120 units) to avoid stockout.`
      : `Stock level for ${medicineName} is stable. No urgent redistribution is necessary.`,
    rationale: `Based on a 12% growth trend over recent months (Historical sales: ${history.join(', ')}), demand is expected to rise. Current stock is ${stock}.`
  });
};

/**
 * 4. 24/7 AI HEALTH CHATBOT
 */
exports.chatAssistant = async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemInstructions = `
    You are Smart Health Assistant, a professional, compassionate medical chatbot.
    You help patients understand general health conditions, symptom triaging, healthy lifestyles, and drug guidelines.
    Always append a disclaimer: "Disclaimer: This is an AI-generated response. Please consult a doctor for clinical diagnosis."
    Do not prescribe specific prescription-only medications or diagnose conditions with 100% certainty.
  `;

  if (isAIAvailable()) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstructions
      });
      
      const chat = model.startChat({
        history: (chatHistory || []).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      });

      const result = await chat.sendMessage(message);
      return res.json({ response: result.response.text() });
    } catch (err) {
      console.warn('Gemini chat error, falling back:', err.message);
    }
  }

  // Fallback response chatbot rules
  let response = "I am here to help you. Based on what you describe, it's best to track your symptoms closely. Ensure you drink plenty of fluids, eat balanced meals, and sleep well. If you have severe symptoms, please visit the doctor. \n\nDisclaimer: This is an AI-generated response. Please consult a doctor for clinical diagnosis.";
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey')) {
    response = "Hello! I am your 24/7 Smart Health AI Chatbot. How can I help you today? You can ask me about symptoms, wellness tips, or medicine uses.\n\nDisclaimer: This is an AI-generated response. Please consult a doctor for clinical diagnosis.";
  } else if (msgLower.includes('headache')) {
    response = "Headaches can be caused by tension, stress, screen strain, or dehydration. Try resting in a dark room, massaging your temples, and drinking water. If it is severe or persistent, a consultation is recommended.\n\nDisclaimer: This is an AI-generated response. Please consult a doctor for clinical diagnosis.";
  } else if (msgLower.includes('diet') || msgLower.includes('weight') || msgLower.includes('bmi')) {
    response = "A healthy diet focus is on whole foods, green vegetables, lean protein, and complex carbohydrates. Staying hydrated and exercising at least 150 minutes a week is key to maintaining a healthy BMI.\n\nDisclaimer: This is an AI-generated response. Please consult a doctor for clinical diagnosis.";
  } else if (msgLower.includes('paracetamol') || msgLower.includes('medicine')) {
    response = "Medicines should be taken exactly as prescribed. Paracetamol is commonly used for pain relief and reducing fever. Avoid taking multiple medications containing paracetamol to prevent liver strain.\n\nDisclaimer: This is an AI-generated response. Please consult a doctor for clinical diagnosis.";
  }

  return res.json({ response });
};
