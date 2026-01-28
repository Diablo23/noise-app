import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { uploadSingleAudio, handleUploadError } from '../middleware/upload';
import {
  CreateAudioItemSchema,
  UpdateAudioItemSchema,
  IdParamSchema,
} from '../types/schemas';
import { transformAudioItem } from '../types';
import { getStorage } from '../services/storage';
import { wsEvents } from '../services/websocket';
import { ApiError } from '../middleware/errorHandler';
import { VisualFormat } from '@prisma/client';

const router = Router();

// Map frontend visual format to Prisma enum
const mapVisualFormat = (format: string): VisualFormat => {
  const formatMap: Record<string, VisualFormat> = {
    waveform: 'waveform',
    bars: 'bars',
    spectrum: 'spectrum',
  };
  return formatMap[format] || 'waveform';
};

/**
 * @swagger
 * /api/audio-items:
 *   post:
 *     summary: Create a new audio item
 *     description: Upload an audio file and create a new audio item on the board
 *     tags: [Audio Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - x
 *               - y
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Audio file (webm, ogg, wav, mp3)
 *               visualFormat:
 *                 type: string
 *                 enum: [waveform, bars, spectrum]
 *                 default: waveform
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
 *         description: Audio item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AudioItem'
 *       400:
 *         description: Invalid request or file
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  requireAuth,
  uploadSingleAudio,
  handleUploadError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw ApiError.badRequest('Audio file is required');
      }

      // Parse and validate body fields
      const bodyData = {
        visualFormat: req.body.visualFormat || 'waveform',
        x: parseFloat(req.body.x),
        y: parseFloat(req.body.y),
        scale: req.body.scale ? parseFloat(req.body.scale) : 100,
      };

      const validatedData = CreateAudioItemSchema.parse(bodyData);

      // Save file to storage
      const storage = getStorage();
      const audioUrl = await storage.saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Create database record
      const audioItem = await prisma.audioItem.create({
        data: {
          ownerId: req.user!.ownerId,
          audioUrl,
          visualFormat: mapVisualFormat(validatedData.visualFormat),
          x: validatedData.x,
          y: validatedData.y,
          scale: validatedData.scale,
        },
      });

      const response = transformAudioItem(audioItem);

      // Broadcast to connected clients
      wsEvents.audioItemCreated(response);

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/audio-items/{id}:
 *   patch:
 *     summary: Update an audio item
 *     description: Update properties of an audio item (owner only)
 *     tags: [Audio Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Audio item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visualFormat:
 *                 type: string
 *                 enum: [waveform, bars, spectrum]
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
 *         description: Audio item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AudioItem'
 *       403:
 *         description: Not the owner of this item
 *       404:
 *         description: Audio item not found
 */
router.patch(
  '/:id',
  requireAuth,
  validateParams(IdParamSchema),
  validateBody(UpdateAudioItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Find the item first
      const existingItem = await prisma.audioItem.findUnique({
        where: { id },
      });

      if (!existingItem) {
        throw ApiError.notFound('Audio item not found');
      }

      // Check ownership
      if (existingItem.ownerId !== req.user!.ownerId) {
        throw ApiError.forbidden('You can only update your own items');
      }

      // Build update data
      const updateData: any = {};
      if (updates.visualFormat !== undefined) {
        updateData.visualFormat = mapVisualFormat(updates.visualFormat);
      }
      if (updates.x !== undefined) updateData.x = updates.x;
      if (updates.y !== undefined) updateData.y = updates.y;
      if (updates.scale !== undefined) updateData.scale = updates.scale;

      const audioItem = await prisma.audioItem.update({
        where: { id },
        data: updateData,
      });

      const response = transformAudioItem(audioItem);

      // Broadcast to connected clients
      wsEvents.audioItemUpdated(response);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/audio-items/{id}/rerecord:
 *   post:
 *     summary: Replace audio file for an item
 *     description: Upload a new audio file to replace the existing one (owner only)
 *     tags: [Audio Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Audio item ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: New audio file
 *     responses:
 *       200:
 *         description: Audio replaced successfully
 *       403:
 *         description: Not the owner of this item
 *       404:
 *         description: Audio item not found
 */
router.post(
  '/:id/rerecord',
  requireAuth,
  validateParams(IdParamSchema),
  uploadSingleAudio,
  handleUploadError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        throw ApiError.badRequest('Audio file is required');
      }

      // Find the item
      const existingItem = await prisma.audioItem.findUnique({
        where: { id },
      });

      if (!existingItem) {
        throw ApiError.notFound('Audio item not found');
      }

      // Check ownership
      if (existingItem.ownerId !== req.user!.ownerId) {
        throw ApiError.forbidden('You can only re-record your own items');
      }

      // Delete old file
      const storage = getStorage();
      await storage.deleteFile(existingItem.audioUrl);

      // Save new file
      const audioUrl = await storage.saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Update database
      const audioItem = await prisma.audioItem.update({
        where: { id },
        data: { audioUrl },
      });

      const response = transformAudioItem(audioItem);

      // Broadcast to connected clients
      wsEvents.audioItemUpdated(response);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/audio-items/{id}:
 *   delete:
 *     summary: Delete an audio item
 *     description: Delete an audio item and its file (owner only)
 *     tags: [Audio Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Audio item ID
 *     responses:
 *       204:
 *         description: Audio item deleted successfully
 *       403:
 *         description: Not the owner of this item
 *       404:
 *         description: Audio item not found
 */
router.delete(
  '/:id',
  requireAuth,
  validateParams(IdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Find the item
      const existingItem = await prisma.audioItem.findUnique({
        where: { id },
      });

      if (!existingItem) {
        throw ApiError.notFound('Audio item not found');
      }

      // Check ownership
      if (existingItem.ownerId !== req.user!.ownerId) {
        throw ApiError.forbidden('You can only delete your own items');
      }

      // Delete from storage
      const storage = getStorage();
      await storage.deleteFile(existingItem.audioUrl);

      // Delete from database
      await prisma.audioItem.delete({
        where: { id },
      });

      // Broadcast to connected clients
      wsEvents.audioItemDeleted(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
