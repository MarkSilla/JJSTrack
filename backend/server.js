import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/mongodb.js';
import userRoutes from './routes/userRoutes.js';

// App Config
const app = express();
const port = process.env.PORT || 4000;
connectDB()

// Middlewares
app.use(express.json());
app.use(cors());

// API Endpoints
app.get('/', (req, res) => {
  res.status(200).send('JJSTrack Backend is running');
});

// User Routes
app.use('/api/users', userRoutes);

app.listen(port, () => console.log('Server started on Port: ' + port));