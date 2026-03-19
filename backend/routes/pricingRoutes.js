import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getPricing,
  getPricingByType,
  createOrUpdatePricing,
  deletePricing
} from '../controllers/pricingController.js';

const router = express.Router();

// Get all pricing
router.get('/', getPricing);

// Get pricing by service type
router.get('/:serviceType', getPricingByType);

// Create or update pricing (admin only)
router.post('/', authMiddleware, createOrUpdatePricing);
router.put('/:serviceType', authMiddleware, createOrUpdatePricing);

// Delete pricing (admin only)
router.delete('/:serviceType', authMiddleware, deletePricing);

export default router;
