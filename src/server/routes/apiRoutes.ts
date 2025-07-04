import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { Store } from '@reduxjs/toolkit';
import { authenticateAPI, authorize } from '../middleware/auth';
import { validationConfig } from '../../config';
import {
  StateUpdateRequest,
  StateUpdateResponse,
  ActionRequest,
  ActionResponse,
  ScreenshotRequest,
  ScreenshotResponse,
} from '../../types';

const router = Router();

// Validation schemas
const stateUpdateSchema = Joi.object({
  path: Joi.string().required().messages({
    'any.required': 'Path is required',
  }),
  value: Joi.any().required().messages({
    'any.required': 'Value is required',
  }),
});

const actionSchema = Joi.object({
  target: Joi.string().optional(),
  payload: Joi.any().optional(),
});

const screenshotSchema = Joi.object({
  format: Joi.string().valid('png', 'jpg').default('png'),
  quality: Joi.number().min(0.1).max(1.0).default(0.9),
  width: Joi.number().integer().min(100).max(4096).optional(),
  height: Joi.number().integer().min(100).max(4096).optional(),
});

/**
 * Setup API routes with Redux store
 */
export function setupAPIRoutes(store: Store): Router {
  /**
   * GET /api/state
   * Get current application state
   */
  router.get('/state', authenticateAPI, authorize('read'), (_req: Request, res: Response): void => {
    try {
      const state = store.getState();

      // Return sanitized state (remove sensitive server info)
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        ui_state: state.ui || {},
        device_state: state.devices || {},
        server_state: {
          uptime: state.server?.startTime ? Date.now() - state.server.startTime : 0,
          requests_handled: state.server?.requestCount || 0,
          active_connections: 1, // Mock value for single connection
          is_running: state.server?.isRunning || false,
        },
      });
    } catch (error) {
      console.error('Failed to retrieve state:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve state',
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /api/state
   * Update application state
   */
  router.post(
    '/state',
    authenticateAPI,
    authorize('write'),
    (req: Request, res: Response): void => {
      try {
        const { error, value } = stateUpdateSchema.validate(req.body);
        if (error) {
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: error.details[0].message,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const { path, value: newValue } = value as StateUpdateRequest;

        // Validate path depth
        const pathParts = path.split('.');
        if (pathParts.length > validationConfig.api.maxPathDepth) {
          res.status(400).json({
            success: false,
            error: 'Path too deep',
            message: `Maximum path depth is ${validationConfig.api.maxPathDepth}`,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        // Dispatch state update action
        store.dispatch({
          type: 'UPDATE_STATE_BY_PATH',
          payload: { path, value: newValue },
        });

        const response: StateUpdateResponse = {
          success: true,
          updated: {
            path,
            value: newValue,
            timestamp: new Date().toISOString(),
          },
        };

        res.json(response);
      } catch (error) {
        console.error('Failed to update state:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update state',
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
        });
      }
    },
  );

  /**
   * POST /api/actions/:type
   * Execute application actions
   */
  router.post(
    '/actions/:type',
    authenticateAPI,
    authorize('write'),
    (req: Request, res: Response): void => {
      try {
        const { type } = req.params;

        // Validate action type
        if (!validationConfig.api.allowedActionTypes.includes(type)) {
          res.status(400).json({
            success: false,
            error: 'Invalid action type',
            message: `Allowed action types: ${validationConfig.api.allowedActionTypes.join(', ')}`,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const { error, value } = actionSchema.validate(req.body);
        if (error) {
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: error.details[0].message,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const { target, payload } = value as ActionRequest;

        // Dispatch action
        const actionType = `devices/execute${type.charAt(0).toUpperCase() + type.slice(1)}Action`;
        store.dispatch({
          type: actionType,
          payload: { target, payload },
        });

        const response: ActionResponse = {
          success: true,
          action: {
            type,
            target,
            payload,
            executedAt: new Date().toISOString(),
          },
        };

        res.json(response);
      } catch (error) {
        console.error('Failed to execute action:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to execute action',
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
        });
      }
    },
  );

  /**
   * GET /screenshot
   * Capture and return screenshot
   */
  router.get(
    '/screenshot',
    authenticateAPI,
    authorize('read'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { error, value } = screenshotSchema.validate(req.query);
        if (error) {
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: error.details[0].message,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const { format, quality, width, height } = value as ScreenshotRequest;

        // Mock screenshot implementation
        // In a real React Native app, this would use react-native-view-shot
        const mockScreenshotData = await generateMockScreenshot(format, quality, width, height);

        const response: ScreenshotResponse = {
          success: true,
          imageData: mockScreenshotData.data,
          format: format || 'png',
          capturedAt: new Date().toISOString(),
          metadata: {
            width: mockScreenshotData.width,
            height: mockScreenshotData.height,
            size: mockScreenshotData.size,
          },
        };

        res.json(response);
      } catch (error) {
        console.error('Failed to capture screenshot:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to capture screenshot',
          message: 'Screenshot functionality not available',
          timestamp: new Date().toISOString(),
        });
      }
    },
  );

  /**
   * GET /api/metrics
   * Get server performance metrics
   */
  router.get(
    '/metrics',
    authenticateAPI,
    authorize('read'),
    (_req: Request, res: Response): void => {
      try {
        const state = store.getState();
        const serverState = state.server || {};

        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          server_metrics: {
            uptime: serverState.startTime ? Date.now() - serverState.startTime : 0,
            requests_handled: serverState.requestCount || 0,
            error_count: serverState.errorCount || 0,
            average_response_time: calculateAverageResponseTime(serverState.metrics || []),
          },
          performance: {
            memory_usage: process.memoryUsage
              ? process.memoryUsage()
              : {
                  rss: 0,
                  heapUsed: 0,
                  heapTotal: 0,
                  external: 0,
                },
            cpu_usage: 'N/A', // Would need platform-specific implementation
          },
        });
      } catch (error) {
        console.error('Failed to retrieve metrics:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve metrics',
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
        });
      }
    },
  );

  return router;
}

/**
 * Generate mock screenshot data for testing
 */
async function generateMockScreenshot(
  format: string = 'png',
  _quality: number = 0.9,
  width?: number,
  height?: number,
): Promise<{ data: string; width: number; height: number; size: number }> {
  // Generate a simple mock base64 image
  const w = width || 375;
  const h = height || 667;

  // Mock base64 data for a small colored rectangle
  const mockBase64 =
    format === 'png'
      ? 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      : '/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gODAK/9sAQwAHBQUGBQQHBgUGCAcHCAoRCwoJCQoVDxQMDFQYFBIWFBQdHx0dHxkYFyAiIh8iJycvLy8vFSEsNUE2QEoxP1P/9sAQwEHCAgJCQoMCgoMDw0NDQ8VEhMUFBMVGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZ/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';

  return {
    data: mockBase64,
    width: w,
    height: h,
    size: Math.floor(mockBase64.length * 0.75), // Approximate size
  };
}

/**
 * Calculate average response time from metrics
 */
function calculateAverageResponseTime(metrics: any[]): number {
  if (!metrics || metrics.length === 0) {
    return 0;
  }

  const totalTime = metrics.reduce((sum, metric) => sum + (metric.duration || 0), 0);
  return totalTime / metrics.length;
}

export default router;
