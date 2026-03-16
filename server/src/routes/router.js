import express from 'express';
import healthRouter from './health.js';
import restaurantRouter from './restaurantRoutes.js'

const router = express.Router();

router.use('/health', healthRouter);
router.use('/restaurants', restaurantRouter)


export default router;