const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { 
  User, Patient, Doctor, Appointment, Medicine, Supplier, Order, Delivery, Prescription, Notification 
} = require('../models/Schemas');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_health';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Wiping existing data...');
    
    // Clear existing collections
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await Medicine.deleteMany({});
    await Supplier.deleteMany({});
    await Order.deleteMany({});
    await Delivery.deleteMany({});
    await Prescription.deleteMany({});
    await Notification.deleteMany({});
    
    console.log('Inserting default users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // 1. Create Patient User
    const patientUser = new User({
      name: 'Yash',
      email: 'patient@smarthealth.com',
      password: hashedPassword,
      role: 'Patient',
      phone: '+91 9876543210'
    });
    await patientUser.save();
    
    const patientDetails = new Patient({
      user: patientUser._id,
      age: 29,
      gender: 'Male',
      bloodGroup: 'B+',
      medicalHistory: ['Mild Asthma', 'Dust Allergy'],
      languagePreference: 'English',
      reminders: [
        { medicineName: 'Cetirizine 10mg', time: '21:00', active: true },
        { medicineName: 'Inhaler (Albuterol)', time: '08:00', active: true }
      ]
    });
    await patientDetails.save();

    // 2. Create Doctor User
    const doctorUser = new User({
      name: 'Dr. Pushkar',
      email: 'doctor@smarthealth.com',
      password: hashedPassword,
      role: 'Doctor',
      phone: '+91 9988776655'
    });
    await doctorUser.save();

    const doctorDetails = new Doctor({
      user: doctorUser._id,
      specialization: 'Cardiologist',
      experience: 12,
      consultationFee: 800,
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        slots: ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM']
      },
      roomId: 'CARDIOLOGY-ROOM-A'
    });
    await doctorDetails.save();

    // Extra doctor for diversity
    const doctorUser2 = new User({
      name: 'Dr. Vikram Patel',
      email: 'doctor2@smarthealth.com',
      password: hashedPassword,
      role: 'Doctor',
      phone: '+91 9123456789'
    });
    await doctorUser2.save();

    const doctorDetails2 = new Doctor({
      user: doctorUser2._id,
      specialization: 'General Physician',
      experience: 8,
      consultationFee: 400,
      availability: {
        days: ['Monday', 'Wednesday', 'Friday'],
        slots: ['10:00 AM', '12:00 PM', '04:00 PM']
      },
      roomId: 'MEDICINE-ROOM-B'
    });
    await doctorDetails2.save();

    // 3. Create Pharmacist User
    const pharmacistUser = new User({
      name: 'Suresh Kumar',
      email: 'pharmacist@smarthealth.com',
      password: hashedPassword,
      role: 'Pharmacist',
      phone: '+91 9555666777'
    });
    await pharmacistUser.save();

    // 4. Create Supplier User
    const supplierUser = new User({
      name: 'Rakesh Goel',
      email: 'supplier@smarthealth.com',
      password: hashedPassword,
      role: 'Supplier',
      phone: '+91 8889990001'
    });
    await supplierUser.save();

    const supplierDetails = new Supplier({
      user: supplierUser._id,
      companyName: 'Apex Pharma Distributors',
      rating: 4.7,
      medicinesHandled: ['Paracetamol 650mg', 'Amoxicillin 500mg', 'Atorvastatin 20mg', 'Metformin 500mg', 'Amlodipine 5mg', 'Ibuprofen 400mg'],
      address: 'Industrial Area Phase 2, Delhi NCR, India'
    });
    await supplierDetails.save();

    // 5. Create Hospital Administrator User
    const adminUser = new User({
      name: 'Admin Director',
      email: 'admin@smarthealth.com',
      password: hashedPassword,
      role: 'Hospital Administrator',
      phone: '+91 9000111222'
    });
    await adminUser.save();

    console.log('Inserting default medicine inventory...');
    // Create medicines with varying stock levels, thresholds, and expiry dates
    const meds = [
      {
        name: 'Paracetamol 650mg',
        category: 'Analgesic',
        stock: 120,
        price: 15,
        barcode: '890100200301',
        expiryDate: '2027-12-15',
        threshold: 30,
        reorderQuantity: 200
      },
      {
        name: 'Amoxicillin 500mg',
        category: 'Antibiotic',
        stock: 15, // Low stock
        price: 85,
        barcode: '890100200302',
        expiryDate: '2026-11-20',
        threshold: 40,
        reorderQuantity: 150
      },
      {
        name: 'Atorvastatin 20mg',
        category: 'Cardiological',
        stock: 80,
        price: 110,
        barcode: '890100200303',
        expiryDate: '2026-08-15', // Near expiry (approx 1 month from current July 2026 local time)
        threshold: 20,
        reorderQuantity: 100
      },
      {
        name: 'Metformin 500mg',
        category: 'Diabetology',
        stock: 250,
        price: 25,
        barcode: '890100200304',
        expiryDate: '2028-01-10',
        threshold: 50,
        reorderQuantity: 300
      },
      {
        name: 'Amlodipine 5mg',
        category: 'Cardiological',
        stock: 8, // Low stock
        price: 35,
        barcode: '890100200305',
        expiryDate: '2026-07-28', // Near expiry (expiring in a couple of weeks)
        threshold: 30,
        reorderQuantity: 150
      },
      {
        name: 'Ibuprofen 400mg',
        category: 'Analgesic',
        stock: 190,
        price: 20,
        barcode: '890100200306',
        expiryDate: '2027-05-30',
        threshold: 25,
        reorderQuantity: 100
      }
    ];

    const seededMeds = await Medicine.insertMany(meds);
    console.log(`Seeded ${seededMeds.length} medicines.`);

    console.log('Inserting default appointments...');
    const appointments = [
      {
        patient: patientUser._id,
        doctor: doctorUser._id,
        date: '2026-07-06',
        time: '10:00 AM',
        status: 'Scheduled',
        notes: 'Routine cardiovascular checkup following chest tightness.',
        roomId: 'CARDIOLOGY-ROOM-A'
      },
      {
        patient: patientUser._id,
        doctor: doctorUser2._id,
        date: '2026-07-02',
        time: '02:00 PM',
        status: 'Completed',
        notes: 'Fever and cold checkup.',
        roomId: 'MEDICINE-ROOM-B'
      }
    ];
    const seededAppts = await Appointment.insertMany(appointments);
    console.log(`Seeded ${seededAppts.length} appointments.`);

    console.log('Inserting default prescriptions...');
    const prescription = new Prescription({
      doctor: doctorUser2._id,
      patient: patientUser._id,
      appointment: seededAppts[1]._id,
      date: '2026-07-02',
      symptoms: 'Fever (101 F), sore throat, dry cough',
      diagnosis: 'Acute Viral Pharyngitis',
      medicines: [
        { name: 'Paracetamol 650mg', dosage: '1-0-1', frequency: 'After food', duration: '3 days' },
        { name: 'Amoxicillin 500mg', dosage: '1-1-1', frequency: 'After food', duration: '5 days' }
      ],
      notes: 'Take plenty of warm water, steam inhalation twice daily, and complete the antibiotic course.'
    });
    await prescription.save();
    console.log('Seeded prescription.');

    console.log('Inserting supply orders & deliveries...');
    const order1 = new Order({
      medicine: 'Amoxicillin 500mg',
      quantity: 150,
      supplier: supplierUser._id,
      cost: 12750, // 150 * 85
      status: 'Shipped',
      orderDate: new Date('2026-07-03')
    });
    await order1.save();

    const delivery1 = new Delivery({
      order: order1._id,
      status: 'In-Transit',
      currentLocation: 'Transit Hub - Hyderabad West',
      estimatedArrival: 'Tomorrow, 12:00 PM',
      coordinates: { lat: 17.4125, lng: 78.4350 }
    });
    await delivery1.save();

    const order2 = new Order({
      medicine: 'Metformin 500mg',
      quantity: 300,
      supplier: supplierUser._id,
      cost: 7500, // 300 * 25
      status: 'Pending',
      orderDate: new Date('2026-07-04')
    });
    await order2.save();
    console.log('Seeded supply orders & delivery tracking.');

    console.log('Inserting default alerts/notifications...');
    const notifications = [
      {
        role: 'Hospital Administrator',
        title: 'Critical Stock Alert',
        message: 'Amlodipine 5mg stock has dropped to 8 units. Automated reorder suggested.',
        type: 'danger'
      },
      {
        role: 'Hospital Administrator',
        title: 'Upcoming Expiry Warning',
        message: 'Atorvastatin 20mg (80 units) will expire on 2026-08-15. Recommend redistribution to high-usage centers.',
        type: 'warning'
      },
      {
        user: patientUser._id,
        title: 'Appointment Reminder',
        message: 'Your cardiovascular consultation with Dr. Pushkar is scheduled for Monday, July 6 at 10:00 AM.',
        type: 'info'
      },
      {
        user: supplierUser._id,
        title: 'New Reorder Request',
        message: 'Smart Health Hospital has placed a pending order for Metformin 500mg (300 units).',
        type: 'info'
      }
    ];
    await Notification.insertMany(notifications);
    console.log('Seeded notifications.');

    console.log('Database seeded successfully!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDatabase();
