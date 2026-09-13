import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import crypto from 'crypto';
import { AIAgent } from './agent/ai.agent';
import { createAIProvider } from './providers/provider.factory';
import { MCPClient } from './mcp/mcp.client';
import { aiLogger } from './observability/ai.logger';
import { AIRequest, AIExecutionContext, AIError } from './types/ai.types';

// Instantiate dependencies
const provider = createAIProvider();
const mcpClient = new MCPClient();
const agent = new AIAgent(provider, mcpClient, aiLogger);

export class AIController {
  async chat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messages, conversationId, context: reqContext } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ success: false, message: 'Messages array is required' });
        return;
      }

      const requestId = crypto.randomUUID();
      const traceId = crypto.randomUUID();

      const context: AIExecutionContext = {
        requestId,
        traceId,
        conversationId,
        userId: req.user?.id || 'anonymous',
        userRole: req.user?.roles?.[0] || 'user',
        timestamp: new Date(),
        entityType: reqContext?.entityType,
        entityId: reqContext?.entityId,
        entityName: reqContext?.entityName,
      };

      const request: AIRequest = {
        conversationId,
        messages,
        context: reqContext,
      };

      const result = await agent.execute(request, context);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async createInvestigation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, entityType, entityId, entityName } = req.body;

      if (!query) {
        res.status(400).json({ success: false, message: 'Query is required for investigation' });
        return;
      }

      const requestId = crypto.randomUUID();
      const traceId = crypto.randomUUID();

      const context: AIExecutionContext = {
        requestId,
        traceId,
        userId: req.user?.id || 'anonymous',
        userRole: req.user?.roles?.[0] || 'user',
        timestamp: new Date(),
        entityType,
        entityId,
        entityName,
      };

      const request: AIRequest = {
        messages: [{ role: 'user', content: query }],
        context: { entityType, entityId, entityName },
      };

      const result = await agent.execute(request, context);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof AIError) {
         res.status(500).json({ success: false, message: error.safeMessage, code: error.code });
      } else {
         next(error);
      }
    }
  }
}

export const aiController = new AIController();
