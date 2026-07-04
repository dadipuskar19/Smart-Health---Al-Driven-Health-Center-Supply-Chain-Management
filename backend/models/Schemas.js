const mongoose = require('mongoose');

// ==========================================
// 1. USER SCHEMA
// ==========================================
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['Patient', 'Doctor', 'Pharmacist', 'Hospital Administrator', 'Supplier'] 
  },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// ==========================================
// 2. PATIENT SCHEMA
// ==========================================
const PatientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  age: { type: Number },
  gender: { type: String },
  bloodGroup: { type: String },
  medicalHistory: [String],
  languagePreference: { type: String, default: 'English', enum: ['English', 'Telugu', 'Hindi'] },
  reminders: [{
    medicineName: String,
    time: String, // HH:MM
    active: { type: Boolean, default: true }
  }]
});

// ==========================================
// 3. DOCTOR SCHEMA
// ==========================================
const DoctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization: { type: String, required: true },
  experience: { type: Number },
  consultationFee: { type: Number, default: 500 },
  availability: {
    days: [String], // e.g., ['Monday', 'Wednesday', 'Friday']
    slots: [String] // e.g., ['09:00 AM', '10:00 AM', '02:00 PM']
  },
  roomId: { type: String, default: () => Math.random().toString(36).substring(2, 10).toUpperCase() } // For video mockup
});

// ==========================================
// 4. APPOINTMENT SCHEMA
// ==========================================
const AppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:MM
  status: { 
    type: String, 
    default: 'Scheduled', 
    enum: ['Scheduled', 'Completed', 'Cancelled', 'In-Progress'] 
  },
  notes: { type: String },
  roomId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// ==========================================
// 5. MEDICINE & INVENTORY SCHEMAS
// ==========================================
const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true }, // e.g., Antibiotic, Analgesic, Cardiological
  stock: { type: Number, default: 0 },
  price: { type: Number, required: true },
  barcode: { type: String, unique: true },
  expiryDate: { type: String, required: true }, // YYYY-MM-DD
  threshold: { type: Number, default: 20 }, // Low stock reorder threshold
  reorderQuantity: { type: Number, default: 100 }
});

// ==========================================
// 6. SUPPLIER SCHEMA
// ==========================================
const SupplierSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  rating: { type: Number, default: 4.5 },
  medicinesHandled: [String], // Array of medicine names
  address: { type: String }
});

// ==========================================
// 7. ORDER SCHEMA
// ==========================================
const OrderSchema = new mongoose.Schema({
  medicine: { type: String, required: true },
  quantity: { type: Number, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    default: 'Pending', 
    enum: ['Pending', 'Approved', 'Shipped', 'Delivered'] 
  },
  cost: { type: Number }
});

// ==========================================
// 8. DELIVERY SCHEMA
// ==========================================
const DeliverySchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  status: { 
    type: String, 
    default: 'In-Transit', 
    enum: ['In-Transit', 'Out-For-Delivery', 'Delivered', 'Delayed'] 
  },
  currentLocation: { type: String, default: 'Supplier Warehouse' },
  estimatedArrival: { type: String }, // e.g. "Tomorrow, 4 PM"
  coordinates: {
    lat: { type: Number, default: 17.3850 }, // Defaults around Hyderabad coordinates
    lng: { type: Number, default: 78.4867 }
  },
  updatedAt: { type: Date, default: Date.now }
});

// ==========================================
// 9. PRESCRIPTION SCHEMA
// ==========================================
const PrescriptionSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  symptoms: { type: String },
  diagnosis: { type: String, required: true },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g., "1-0-1"
    frequency: { type: String, required: true }, // e.g., "After food"
    duration: { type: String, required: true } // e.g., "5 days"
  }],
  notes: { type: String }
});

// ==========================================
// 10. MEDICAL RECORD SCHEMA
// ==========================================
const MedicalRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  filePath: { type: String },
  uploadDate: { type: Date, default: Date.now },
  parsedOCRData: { type: String },
  geminiSummary: { type: String }
});

// ==========================================
// 11. NOTIFICATION SCHEMA
// ==========================================
const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If null, broadcasts to all
  role: { type: String }, // Broadcast to role e.g., 'Hospital Administrator'
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    default: 'info', 
    enum: ['info', 'warning', 'success', 'danger'] 
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ==========================================
// 12. AI REPORT SCHEMA
// ==========================================
const AIReportSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['SymptomChecker', 'DemandForecast', 'HealthRisk', 'TreatmentPlan'] 
  },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inputData: { type: mongoose.Schema.Types.Mixed },
  outputResult: { type: mongoose.Schema.Types.Mixed },
  generatedAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Patient: mongoose.model('Patient', PatientSchema),
  Doctor: mongoose.model('Doctor', DoctorSchema),
  Appointment: mongoose.model('Appointment', AppointmentSchema),
  Medicine: mongoose.model('Medicine', MedicineSchema),
  Supplier: mongoose.model('Supplier', SupplierSchema),
  Order: mongoose.model('Order', OrderSchema),
  Delivery: mongoose.model('Delivery', DeliverySchema),
  Prescription: mongoose.model('Prescription', PrescriptionSchema),
  MedicalRecord: mongoose.model('MedicalRecord', MedicalRecordSchema),
  Notification: mongoose.model('Notification', NotificationSchema),
  AIReport: mongoose.model('AIReport', AIReportSchema)
};
