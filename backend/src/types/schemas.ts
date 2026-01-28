import { z } from 'zod';

// Visual format enum matching Prisma/frontend
export const VisualFormatSchema = z.enum(['waveform', 'bars', 'spectrum']);
export type VisualFormat = z.infer<typeof VisualFormatSchema>;

// Font type enum matching frontend
export const FontTypeSchema = z.enum(['rubik-glitch', 'kapakana', 'shadows']);
export type FontType = z.infer<typeof FontTypeSchema>;

// Coordinate validation (reasonable bounds for a web page)
const coordinateSchema = z.number().min(0).max(10000);
const scaleSchema = z.number().min(25).max(300);
const opacitySchema = z.number().min(0).max(100);

// Audio Item Schemas
export const CreateAudioItemSchema = z.object({
  visualFormat: VisualFormatSchema.optional().default('waveform'),
  x: coordinateSchema,
  y: coordinateSchema,
  scale: scaleSchema.optional().default(100),
});
export type CreateAudioItemInput = z.infer<typeof CreateAudioItemSchema>;

export const UpdateAudioItemSchema = z.object({
  visualFormat: VisualFormatSchema.optional(),
  x: coordinateSchema.optional(),
  y: coordinateSchema.optional(),
  scale: scaleSchema.optional(),
});
export type UpdateAudioItemInput = z.infer<typeof UpdateAudioItemSchema>;

// Text Item Schemas
export const CreateTextItemSchema = z.object({
  text: z.string().min(1).max(200),
  font: FontTypeSchema.optional().default('rubik-glitch'),
  opacity: opacitySchema.optional().default(100),
  x: coordinateSchema,
  y: coordinateSchema,
  scale: scaleSchema.optional().default(100),
});
export type CreateTextItemInput = z.infer<typeof CreateTextItemSchema>;

export const UpdateTextItemSchema = z.object({
  text: z.string().min(1).max(200).optional(),
  font: FontTypeSchema.optional(),
  opacity: opacitySchema.optional(),
  x: coordinateSchema.optional(),
  y: coordinateSchema.optional(),
  scale: scaleSchema.optional(),
});
export type UpdateTextItemInput = z.infer<typeof UpdateTextItemSchema>;

// Board query params
export const BoardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
export type BoardQuery = z.infer<typeof BoardQuerySchema>;

// ID param validation
export const IdParamSchema = z.object({
  id: z.string().uuid(),
});
