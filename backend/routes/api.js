const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { 
  User, Patient, Doctor, Appointment, Medicine, Supplier, Order, Delivery, Prescription, MedicalRecord, Notification 
} = require('../models/Schemas');
const aiController = require('../controllers/aiController');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';

// ==========================================
// AUTH MIDDLEWARE (WITH DEMO BACKDOOR)
// ==========================================
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const demoUserEmail = req.headers['x-demo-email']; // Backdoor for easy demo switching

  if (demoUserEmail) {
    try {
      const user = await User.findOne({ email: demoUserEmail });
      if (user) {
        req.user = user;
        return next();
      }
    } catch (err) {
      console.error('Demo auth error:', err);
    }
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// ==========================================
// AUTH ROUTES
// ==========================================
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, ...extraDetails } = req.body;
    
    let existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role, phone });
    await user.save();

    // Create role-specific sub-document
    if (role === 'Patient') {
      const patient = new Patient({
        user: user._id,
        age: extraDetails.age || 30,
        gender: extraDetails.gender || 'Other',
        bloodGroup: extraDetails.bloodGroup || 'O+',
        medicalHistory: extraDetails.medicalHistory || [],
        languagePreference: extraDetails.languagePreference || 'English'
      });
      await patient.save();
    } else if (role === 'Doctor') {
      const doctor = new Doctor({
        user: user._id,
        specialization: extraDetails.specialization || 'General Physician',
        experience: extraDetails.experience || 5,
        consultationFee: extraDetails.consultationFee || 500,
        availability: extraDetails.availability || { days: ['Monday', 'Wednesday', 'Friday'], slots: ['10:00 AM', '02:00 PM'] }
      });
      await doctor.save();
    } else if (role === 'Supplier') {
      const supplier = new Supplier({
        user: user._id,
        companyName: extraDetails.companyName || 'Global Pharma Logistics',
        rating: 4.8,
        medicinesHandled: extraDetails.medicinesHandled || ['Paracetamol', 'Amoxicillin', 'Atorvastatin'],
        address: extraDetails.address || 'Industrial Zone, Phase-1'
      });
      await supplier.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/users', authenticate, async (req, res) => {
  try {
    const list = await User.find({}).sort({ role: 1, name: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// APPOINTMENT ROUTES
// ==========================================
router.get('/appointments', authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'Doctor') {
      query.doctor = req.user._id;
    }
    const list = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone')
      .sort({ date: 1, time: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments', authenticate, async (req, res) => {
  try {
    const { doctorId, date, time, notes } = req.body;
    
    // Find doctor specific room id for mockup
    const doctorObj = await Doctor.findOne({ user: doctorId });
    const roomId = doctorObj ? doctorObj.roomId : 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const docUserObj = await User.findById(doctorId);
    const docName = docUserObj ? docUserObj.name : 'Dr. Pushkar';

    const appointment = new Appointment({
      patient: req.user._id,
      doctor: doctorId,
      date,
      time,
      notes,
      roomId
    });
    await appointment.save();

    // Create notifications for patient and doctor
    await new Notification({
      user: doctorId,
      title: 'New Appointment Booked',
      message: `You have a new appointment with patient ${req.user.name} on ${date} at ${time}.`,
      type: 'info'
    }).save();

    await new Notification({
      user: req.user._id,
      title: 'Appointment Confirmed',
      message: `Your appointment with ${docName} is confirmed for ${date} at ${time}. Telehealth Room ID: ${roomId}`,
      type: 'success'
    }).save();

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/appointments/:id', authenticate, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.id || req.params.id,
      { status, notes },
      { new: true }
    );
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// MEDICINE & INVENTORY ROUTES
// ==========================================
router.get('/medicines', async (req, res) => {
  try {
    const list = await Medicine.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/medicines', authenticate, async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();
    res.status(201).json(medicine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/medicines/:id', authenticate, async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Check if new stock falls below threshold
    if (medicine.stock <= medicine.threshold) {
      // Auto-trigger notification for Administrator
      await new Notification({
        role: 'Hospital Administrator',
        title: `Low Stock Alert: ${medicine.name}`,
        message: `${medicine.name} stock has dropped to ${medicine.stock} (Threshold: ${medicine.threshold}). Reorder required.`,
        type: 'danger'
      }).save();
    }
    
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Barcode Scan endpoint
router.post('/medicines/scan', async (req, res) => {
  try {
    const { barcode } = req.body;
    const medicine = await Medicine.findOne({ barcode });
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found with this code' });
    }
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Redistribute stocks between hospitals
router.post('/medicines/redistribute', authenticate, async (req, res) => {
  try {
    const { medicineName, transferQty, fromBranch, toBranch } = req.body;
    const med = await Medicine.findOne({ name: medicineName });
    if (!med) return res.status(404).json({ error: 'Medicine not found' });
    
    // In our single-db layout, we simulate this redistribution by updating stock level 
    // or writing logs. To keep it functional, let's create a global notification.
    await new Notification({
      role: 'Hospital Administrator',
      title: 'Stock Redistribution Successful',
      message: `Transferred ${transferQty} units of ${medicineName} from ${fromBranch} to ${toBranch}.`,
      type: 'success'
    }).save();

    res.json({ message: 'Redistribution transfer completed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SUPPLY CHAIN ORDERS & DELIVERIES
// ==========================================
router.get('/orders', authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Supplier') {
      query.supplier = req.user._id;
    }
    const list = await Order.find(query).populate('supplier', 'name email companyName');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders', authenticate, async (req, res) => {
  try {
    const { medicine, quantity, supplierId, cost } = req.body;
    const order = new Order({ medicine, quantity, supplier: supplierId, cost });
    await order.save();

    await new Notification({
      user: supplierId,
      title: 'New Reorder Request',
      message: `Hospital has requested a shipment of ${quantity} units of ${medicine}.`,
      type: 'info'
    }).save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/orders/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (status === 'Shipped') {
      // Create a Delivery tracking item
      const delivery = new Delivery({
        order: order._id,
        status: 'In-Transit',
        estimatedArrival: 'In 2 days, 10:00 AM'
      });
      await delivery.save();

      await new Notification({
        role: 'Hospital Administrator',
        title: 'Order Dispatched',
        message: `Order for ${order.medicine} (${order.quantity} units) has been shipped. Real-time GPS tracking active.`,
        type: 'success'
      }).save();
    } else if (status === 'Delivered') {
      // Add stock back to Medicine inventory
      const med = await Medicine.findOne({ name: order.medicine });
      if (med) {
        med.stock += order.quantity;
        await med.save();
      }

      await new Notification({
        role: 'Hospital Administrator',
        title: 'Supply Order Delivered',
        message: `${order.quantity} units of ${order.medicine} delivered. Inventory stock updated.`,
        type: 'success'
      }).save();
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/deliveries', async (req, res) => {
  try {
    const list = await Delivery.find({}).populate({
      path: 'order',
      populate: { path: 'supplier', select: 'name companyName' }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update delivery gps path simulation
router.put('/deliveries/:id', async (req, res) => {
  try {
    const { lat, lng, currentLocation, status } = req.body;
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { coordinates: { lat, lng }, currentLocation, status, updatedAt: Date.now() },
      { new: true }
    );
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PRESCRIPTION ROUTES
// ==========================================
router.get('/prescriptions', authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'Doctor') {
      query.doctor = req.user._id;
    }
    const list = await Prescription.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone')
      .sort({ date: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/prescriptions', authenticate, async (req, res) => {
  try {
    const { patientId, diagnosis, medicines, notes, appointmentId } = req.body;
    const prescription = new Prescription({
      doctor: req.user._id,
      patient: patientId,
      appointment: appointmentId,
      diagnosis,
      medicines,
      notes
    });
    await prescription.save();

    // Create notification for patient
    await new Notification({
      user: patientId,
      title: 'New Digital Prescription',
      message: `Dr. ${req.user.name} has issued a digital prescription for: ${diagnosis}.`,
      type: 'success'
    }).save();

    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// MEDICAL RECORD UPLOAD & OCR MOCK
// ==========================================
router.get('/records', authenticate, async (req, res) => {
  try {
    const list = await MedicalRecord.find({ patient: req.user._id }).sort({ uploadDate: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/records/upload', authenticate, async (req, res) => {
  try {
    const { fileName, ocrText } = req.body;
    
    // OCR Simulated Parsing
    const parsedText = ocrText || "SMART CLINIC MEDICAL REPORT\nPatient Name: Demo Patient\nDiagnosis: Hypertension & Vitamin D Deficiency\nRecommended: Amlodipine 5mg OD, Vitamin D3 weekly.\nNotes: Limit salt, repeat lipid profile in 3 months.";
    
    // Gemini Summary Mock/Actual
    const geminiSummary = `Medical record analysis for ${fileName}: The document indicates a clinical diagnosis of Hypertension and Vitamin D Deficiency. Suggested treatments include Amlodipine 5mg once daily and Vitamin D3 supplementation once a week. The patient should limit sodium intake and schedule a lipid panel check in 90 days.`;

    const record = new MedicalRecord({
      patient: req.user._id,
      fileName,
      parsedOCRData: parsedText,
      geminiSummary
    });
    await record.save();

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// NOTIFICATION ROUTES
// ==========================================
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const list = await Notification.find({
      $or: [
        { user: req.user._id },
        { role: req.user.role },
        { user: null, role: null } // Broadcast to everyone
      ]
    }).sort({ createdAt: -1 }).limit(30);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PATIENT REMINDERS & HEALTH PROFILE
// ==========================================
router.get('/patient/profile', authenticate, async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found' });
    res.json(patient);
  } catch (err) {
    res.status(550).json({ error: err.message });
  }
});

router.post('/patient/reminders', authenticate, async (req, res) => {
  try {
    const { medicineName, time } = req.body;
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found' });
    
    patient.reminders.push({ medicineName, time, active: true });
    await patient.save();
    res.status(201).json(patient.reminders[patient.reminders.length - 1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/patient/reminders/:id', authenticate, async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found' });
    
    const reminder = patient.reminders.id(req.params.id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    
    reminder.active = !reminder.active;
    await patient.save();
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/patient/reminders/:id', authenticate, async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found' });
    
    patient.reminders.pull(req.params.id);
    await patient.save();
    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    res.status(550).json({ error: err.message });
  }
});

// ==========================================
// AI CONTROLLER ROUTING
// ==========================================
router.post('/ai/symptom-check', aiController.analyzeSymptoms);
router.post('/ai/treatment-plan', aiController.getTreatmentPlan);
router.post('/ai/demand-forecast', aiController.getDemandForecast);
router.post('/ai/chat', aiController.chatAssistant);

module.exports = router;
