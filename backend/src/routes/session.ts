import { Router, Request, Response } from 'express';
import { generateToken } from '../utils/jwt';
import { SessionResponse } from '../types';

const router = Router();

/**
 * @swagger
 * /api/session:
 *   post:
 *     summary: Create a new anonymous session
 *     description: Generates a new anonymous token and owner ID for the user. Store the token in localStorage and include it in the Authorization header for subsequent requests.
 *     tags: [Session]
 *     responses:
 *       200:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 ownerId:
 *                   type: string
 *                   format: uuid
 *                   description: Unique identifier for this anonymous user
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               ownerId: "550e8400-e29b-41d4-a716-446655440000"
 */
router.post('/', (req: Request, res: Response) => {
  const { token, ownerId } = generateToken();

  const response: SessionResponse = {
    token,
    ownerId,
  };

  res.json(response);
});

export default router;
