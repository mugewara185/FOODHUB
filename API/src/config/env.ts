import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI as string,
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  ai: {
    enabled: process.env.AI_ENABLED !== 'false',
    provider: process.env.AI_PROVIDER || 'mock',
    model: process.env.AI_MODEL || 'mock-v1',
    apiKey: process.env.AI_API_KEY || '',
    endpoint: process.env.AI_ENDPOINT || '',
    timeoutMs: parseInt(process.env.AI_TIMEOUT || '30000', 10),
    copilotEnabled: process.env.AI_COPILOT_ENABLED !== 'false',
    investigationsEnabled: process.env.AI_INVESTIGATIONS_ENABLED !== 'false',
    mcpServerPath: process.env.MCP_SERVER_PATH || '',
  },
};
