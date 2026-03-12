import { Router } from 'express';
import { paymentController } from './payment.controller';

const router = Router();
//TODO: const paymentController = new PaymentController(/* TODO: inject service */);

// paymentRouter.get('/',      (req, res) => paymentController.findAll(req, res));
// paymentRouter.get('/:id',   (req, res) => paymentController.findOne(req, res));
// paymentRouter.post('/',     (req, res) => paymentController.create(req, res));
// paymentRouter.put('/:id',   (req, res) => paymentController.replace(req, res));
// paymentRouter.patch('/:id', (req, res) => paymentController.update(req, res));
// paymentRouter.delete('/:id',(req, res) => paymentController.remove(req, res));

export default router;
