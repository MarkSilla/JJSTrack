import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bookingModel from './models/bookingModel.js';
import notificationModel from './models/notificationModel.js';
import { syncDropoffReminderNotifications } from './utils/bookingDropoffReminderNotifications.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB.');
    const totalBookings = await bookingModel.countDocuments();
    console.log(`Total Bookings in DB: ${totalBookings}`);
    const activeBookings = await bookingModel.find({
      userId: { $exists: true, $ne: null },
      pickupDate: { $exists: true, $ne: '' },
      status: { $nin: ['Cancelled', 'Released', 'Completed'] },
    }).select('_id bookingId status createdAt').lean();

    console.log('Active Bookings:', activeBookings.map(b => ({
      id: b._id,
      bookingId: b.bookingId,
      status: b.status,
      createdAt: b.createdAt,
      ageMs: Date.now() - new Date(b.createdAt).getTime()
    })));

    console.log('Running syncDropoffReminderNotifications...');
    const createdCount = await syncDropoffReminderNotifications();
    console.log(`Created drop-off reminder notifications: ${createdCount}`);

    const latestNotifications = await notificationModel.find({
      'metadata.event': 'dropoff_reminder'
    }).sort({ createdAt: -1 }).limit(5).lean();

    console.log('Latest Dropoff Notifications in DB:');
    console.log(JSON.stringify(latestNotifications, null, 2));

  } catch (error) {
    console.error('Error in script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

run();
