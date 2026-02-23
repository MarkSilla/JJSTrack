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

app.listen(port, () => console.log('Server started on Port: ' + port));
