import { Router } from 'express';
import { adminController } from './admin.controller';

export const adminRouter = Router();
//TODO: const adminController = new AdminController(/* TODO: inject service */);

// adminRouter.get('/',      (req, res) => adminController.findAll(req, res));
// adminRouter.get('/:id',   (req, res) => adminController.findOne(req, res));
// adminRouter.post('/',     (req, res) => adminController.create(req, res));
// adminRouter.put('/:id',   (req, res) => adminController.replace(req, res));
// adminRouter.patch('/:id', (req, res) => adminController.update(req, res));
// adminRouter.delete('/:id',(req, res) => adminController.remove(req, res));
