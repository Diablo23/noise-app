import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NOISE API',
      version: '1.0.0',
      description: `
Backend API for NOISE - a shared audio/visual board application.

## Authentication

This API uses anonymous JWT-based authentication:

1. Call \`POST /api/session\` to get a token and ownerId
2. Store the token in localStorage
3. Include the token in all write operations:
   \`Authorization: Bearer <token>\`

## Features

- **Audio Items**: Record and upload audio files with visualization settings
- **Text Items**: Add text captions with custom fonts and styling
- **Real-time Updates**: WebSocket support for live board updates
- **Ownership**: Only the creator of an item can edit or delete it
      `,
      contact: {
        name: 'NOISE API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from POST /api/session',
        },
      },
      schemas: {
        AudioItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            ownerId: {
              type: 'string',
              format: 'uuid',
            },
            audioUrl: {
              type: 'string',
              description: 'URL path to the audio file',
            },
            durationMs: {
              type: 'integer',
              nullable: true,
              description: 'Duration in milliseconds (optional)',
            },
            visualFormat: {
              type: 'string',
              enum: ['waveform', 'bars', 'spectrum'],
            },
            x: {
              type: 'number',
              description: 'X position on the board',
            },
            y: {
              type: 'number',
              description: 'Y position on the board',
            },
            scale: {
              type: 'number',
              minimum: 25,
              maximum: 300,
              description: 'Size scale percentage (25-300)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TextItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            ownerId: {
              type: 'string',
              format: 'uuid',
            },
            text: {
              type: 'string',
              maxLength: 200,
            },
            font: {
              type: 'string',
              enum: ['rubik-glitch', 'kapakana', 'shadows'],
            },
            opacity: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Opacity percentage (0-100)',
            },
            x: {
              type: 'number',
            },
            y: {
              type: 'number',
            },
            scale: {
              type: 'number',
              minimum: 25,
              maximum: 300,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Session',
        description: 'Authentication and session management',
      },
      {
        name: 'Board',
        description: 'Board data retrieval',
      },
      {
        name: 'Audio Items',
        description: 'Audio item CRUD operations',
      },
      {
        name: 'Text Items',
        description: 'Text item CRUD operations',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
