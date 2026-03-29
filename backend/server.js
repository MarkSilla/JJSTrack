import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/mongodb.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import staffRoutes from './routes/staffRoutes.js';

import dns from 'dns';
dotenv.config();

dns.setServers(['1.1.1.1', '8.8.8.8']);

// App Config
const app = express();
const port = process.env.PORT || 4000;
connectDB();



// Middlewares
app.use(express.json());
app.use(cors());

// API Endpoints
app.get('/', (req, res) => {
  res.status(200).send('JJSTrack Backend is running');
});

// User Routes
app.use('/api/users', userRoutes);

// Order Routes
app.use('/api/orders', orderRoutes);

// Invoice Routes
app.use('/api/invoices', invoiceRoutes);

// Appointment Routes
app.use('/api/appointments', appointmentRoutes);

// Booking Routes
app.use('/api/bookings', bookingRoutes);

// Service Routes
app.use('/api/services', serviceRoutes);

// Inventory Routes
app.use('/api/inventory', inventoryRoutes);

// Pricing Routes
app.use('/api/pricing', pricingRoutes);

// Staff Routes
app.use('/api/staff', staffRoutes);

app.listen(port, () => console.log('Server started on Port: ' + port));
