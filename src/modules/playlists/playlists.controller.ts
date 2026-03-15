import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { PlaylistsService } from './playlists.service';

export class PlaylistsController {
  constructor(private readonly service: PlaylistsService) {}

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
