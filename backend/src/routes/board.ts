import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { validateQuery } from '../middleware/validation';
import { BoardQuerySchema } from '../types/schemas';
import { BoardResponse, transformAudioItem, transformTextItem } from '../types';

const router = Router();

router.get(
  '/',
  validateQuery(BoardQuerySchema),
  async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 100;
    const offset = Number(req.query.offset) || 0;

    const [audioItems, textItems, audioCount, textCount] = await Promise.all([
      prisma.audioItem.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.textItem.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.audioItem.count(),
      prisma.textItem.count(),
    ]);

    const response: BoardResponse = {
      audioItems: audioItems.map(transformAudioItem),
      textItems: textItems.map(transformTextItem),
      pagination: {
        limit,
        offset,
        total: audioCount + textCount,
      },
    };

    res.json(response);
  }
);

export default router;
