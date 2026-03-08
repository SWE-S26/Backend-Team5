import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { EngagementService } from './engagement.service';

export class EngagementController {
  constructor(private readonly service: EngagementService) {}

  async findAll(_req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async findOne(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async create(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async replace(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async update(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async remove(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }
}
