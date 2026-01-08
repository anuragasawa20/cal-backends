import express from 'express';
import eventTypeRouter from "../src/modules/eventType/eventType.routes.js";
import availabilityRouter from "../src/modules/availability/availability.routes.js";
import bookingsRouter from "../src/modules/bookings/bookings.routes.js";

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Backend server is running!' });
});

router.use('/event-type', eventTypeRouter);
router.use('/availability', availabilityRouter);
router.use('/bookings', bookingsRouter);

export default router;

