import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import {
  CreateTextItemSchema,
  UpdateTextItemSchema,
  IdParamSchema,
} from '../types/schemas';
import { transformTextItem } from '../types';
import { wsEvents } from '../services/websocket';
import { ApiError } from '../middleware/errorHandler';
import { FontType } from '@prisma/client';

const router = Router();

// Map frontend font to Prisma enum
const mapFont = (font: string): FontType => {
  const fontMap: Record<string, FontType> = {
    'rubik-glitch': 'rubik_glitch',
    'kapakana': 'kapakana',
    'shadows': 'shadows',
  };
  return fontMap[font] || 'rubik_glitch';
};

/**
 * @swagger
 * /api/text-items:
 *   post:
 *     summary: Create a new text item
 *     description: Create a new text caption on the board
 *     tags: [Text Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - x
 *               - y
 *             properties:
 *               text:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Caption text
 *               font:
 *                 type: string
 *                 enum: [rubik-glitch, kapakana, shadows]
 *                 default: rubik-glitch
 *               opacity:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 100
 *               x:
 *                 type: number
 *                 description: X position on the board
 *               y:
 *                 type: number
 *                 description: Y position on the board
 *               scale:
 *                 type: number
 *                 minimum: 25
 *                 maximum: 300
 *                 default: 100
 *     responses:
 *       201:
 *         description: Text item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TextItem'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  requireAuth,
  validateBody(CreateTextItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text, font, opacity, x, y, scale } = req.body;

      const textItem = await prisma.textItem.create({
        data: {
          ownerId: req.user!.ownerId,
          text,
          font: mapFont(font),
          opacity: opacity / 100, // Convert 0-100 to 0-1 for storage
          x,
          y,
          scale,
        },
      });

      const response = transformTextItem(textItem);

      // Broadcast to connected clients
      wsEvents.textItemCreated(response);

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/text-items/{id}:
 *   patch:
 *     summary: Update a text item
 *     description: Update properties of a text item (owner only)
 *     tags: [Text Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Text item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               font:
 *                 type: string
 *                 enum: [rubik-glitch, kapakana, shadows]
 *               opacity:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               x:
 *                 type: number
 *               y:
 *                 type: number
 *               scale:
 *                 type: number
 *                 minimum: 25
 *                 maximum: 300
 *     responses:
 *       200:
 *         description: Text item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TextItem'
 *       403:
 *         description: Not the owner of this item
 *       404:
 *         description: Text item not found
 */
router.patch(
  '/:id',
  requireAuth,
  validateParams(IdParamSchema),
  validateBody(UpdateTextItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Find the item first
      const existingItem = await prisma.textItem.findUnique({
        where: { id },
      });

      if (!existingItem) {
        throw ApiError.notFound('Text item not found');
      }

      // Check ownership
      if (existingItem.ownerId !== req.user!.ownerId) {
        throw ApiError.forbidden('You can only update your own items');
      }

      // Build update data
      const updateData: any = {};
      if (updates.text !== undefined) updateData.text = updates.text;
      if (updates.font !== undefined) updateData.font = mapFont(updates.font);
      if (updates.opacity !== undefined) updateData.opacity = updates.opacity / 100;
      if (updates.x !== undefined) updateData.x = updates.x;
      if (updates.y !== undefined) updateData.y = updates.y;
      if (updates.scale !== undefined) updateData.scale = updates.scale;

      const textItem = await prisma.textItem.update({
        where: { id },
        data: updateData,
      });

      const response = transformTextItem(textItem);

      // Broadcast to connected clients
      wsEvents.textItemUpdated(response);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/text-items/{id}:
 *   delete:
 *     summary: Delete a text item
 *     description: Delete a text item (owner only)
 *     tags: [Text Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Text item ID
 *     responses:
 *       204:
 *         description: Text item deleted successfully
 *       403:
 *         description: Not the owner of this item
 *       404:
 *         description: Text item not found
 */
router.delete(
  '/:id',
  requireAuth,
  validateParams(IdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Find the item
      const existingItem = await prisma.textItem.findUnique({
        where: { id },
      });

      if (!existingItem) {
        throw ApiError.notFound('Text item not found');
      }

      // Check ownership
      if (existingItem.ownerId !== req.user!.ownerId) {
        throw ApiError.forbidden('You can only delete your own items');
      }

      // Delete from database
      await prisma.textItem.delete({
        where: { id },
      });

      // Broadcast to connected clients
      wsEvents.textItemDeleted(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
