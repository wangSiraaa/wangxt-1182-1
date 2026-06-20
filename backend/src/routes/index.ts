import { Router } from 'express';
import authRoutes from './auth';
import sampleBoxRoutes from './sampleBox';
import documentRoutes from './document';
import flightRoutes from './flight';
import temperatureRoutes from './temperature';
import freezeRoutes from './freeze';
import dashboardRoutes from './dashboard';
import approvalRoutes from './approval';
import sampleTubeRoutes from './sampleTube';
import boxSplitRoutes from './boxSplit';
import flightChangeRoutes from './flightChange';
import temperatureReviewRoutes from './temperatureReview';
import customsRoutes from './customs';

const router = Router();

router.use('/auth', authRoutes);
router.use('/sample-boxes', sampleBoxRoutes);
router.use('/documents', documentRoutes);
router.use('/flights', flightRoutes);
router.use('/temperature-records', temperatureRoutes);
router.use('/freeze-records', freezeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/approvals', approvalRoutes);
router.use('/sample-tubes', sampleTubeRoutes);
router.use('/box-splits', boxSplitRoutes);
router.use('/flight-changes', flightChangeRoutes);
router.use('/temperature-reviews', temperatureReviewRoutes);
router.use('/customs', customsRoutes);

export default router;
