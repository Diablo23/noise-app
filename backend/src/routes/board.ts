import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { validateQuery } from '../middleware/validation';
import { BoardQuerySchema } from '../types/schemas';
import { BoardResponse, transformAudioItem, transformTextItem } from '../types';

const router = Router();

/**
 * @swagger
 * /api/board:
 *   get:
 *     summary: Get all items on the board
 *     description: Retrieves all audio and text items currently on the shared board
 *     tags: [Board]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 100
 *         description: Maximum number of items to return per type
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of items to skip (for pagination)
 *     responses:
 *       200:
 *         description: Board items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audioItems:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AudioItem'
 *                 textItems:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TextItem'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get(
  '/',
  validateQuery(BoardQuerySchema),
  async (req: Request, res: Response) => {
    const { limit, offset } = req.query as { limit: number; offset: number };

    // Fetch items in parallel
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
