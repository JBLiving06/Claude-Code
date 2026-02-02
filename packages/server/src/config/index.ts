/**
 * Server Configuration
 */

import 'dotenv/config';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },

  // Avatar Provider Configurations
  did: {
    apiKey: process.env.DID_API_KEY || '',
    baseUrl: process.env.DID_BASE_URL || 'https://api.d-id.com',
  },

  heygen: {
    apiKey: process.env.HEYGEN_API_KEY || '',
    baseUrl: process.env.HEYGEN_BASE_URL || 'https://api.heygen.com',
  },

  // LLM Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4-turbo-preview',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  },

  // Vector Database
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    environment: process.env.PINECONE_ENVIRONMENT || '',
    indexName: process.env.PINECONE_INDEX_NAME || 'avatar-workshop',
  },

  // Storage (for documents and generated videos)
  storage: {
    type: (process.env.STORAGE_TYPE || 'local') as 'local' | 's3',
    localPath: process.env.STORAGE_LOCAL_PATH || './data',
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'us-east-1',
    },
  },

  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
} as const;

// Validate required configuration
export function validateConfig(): void {
  const warnings: string[] = [];

  if (!config.did.apiKey && !config.heygen.apiKey) {
    warnings.push('No avatar provider API key configured (DID_API_KEY or HEYGEN_API_KEY)');
  }

  if (!config.openai.apiKey && !config.anthropic.apiKey) {
    warnings.push('No LLM API key configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)');
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
  }
}

validateConfig();
