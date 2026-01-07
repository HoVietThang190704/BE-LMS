import { Client } from '@elastic/elasticsearch';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';

const elasticClient = new Client({
  node: config.ELASTICSEARCH_NODE,
  ...(config.ELASTICSEARCH_API_KEY ? { auth: { apiKey: config.ELASTICSEARCH_API_KEY } } : {}),
  ...(config.ELASTICSEARCH_NODE.startsWith('https')
    ? { tls: { rejectUnauthorized: config.ELASTICSEARCH_REJECT_UNAUTHORIZED } }
    : {}),
  requestTimeout: 30000,
  maxRetries: 3,
});

export async function testElasticsearchConnection(): Promise<boolean> {
  try {
    const info = await elasticClient.info();
    logger.info(`✅ Elasticsearch connected: ${info.name} (version ${info.version.number})`);
    return true;
  } catch (error: any) {
    logger.warn(`⚠️ Elasticsearch not available: ${error.message}. Search will fallback to MongoDB.`);
    return false;
  }
}

export { elasticClient };
