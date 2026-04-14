import mongoose from 'mongoose';
import userModel from '../models/userModel.js';

export const ENV_ADMIN_ID = 'admin';

const buildEnvAdminActor = () => ({
  _id: ENV_ADMIN_ID,
  id: ENV_ADMIN_ID,
  role: 'admin',
  email: process.env.ADMIN_USERNAME || 'admin',
  fullName: 'Admin',
  name: 'Admin',
});

export const isEnvAdminRequest = (req = {}) =>
  req?.userId === ENV_ADMIN_ID && req?.userRole === 'admin';

export const getRequestActor = async (req = {}) => {
  if (isEnvAdminRequest(req)) {
    return buildEnvAdminActor();
  }

  if (!req?.userId || !mongoose.isValidObjectId(req.userId)) {
    return null;
  }

  return userModel.findById(req.userId);
};
