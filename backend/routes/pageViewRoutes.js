import express from 'express';
import { recordPageView, getPageViewCount, resetPageViewCount } from '../controllers/pageViewController.js';

const router = express.Router();

router.get('/', getPageViewCount);
router.post('/record', recordPageView);
router.post('/reset', resetPageViewCount);

export default router;
