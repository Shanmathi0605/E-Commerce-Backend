const { Client } = require('@elastic/elasticsearch');

const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

// Note: local Elasticsearch container runs without security settings for ease of local testing
const esClient = new Client({
  node: esUrl
});

const checkElasticsearch = async () => {
  try {
    const health = await esClient.cluster.health({});
    console.log(`[Product Service] Connected to Elasticsearch: cluster health is ${health.status}`);
  } catch (err) {
    console.warn('[Product Service] Elasticsearch is not reachable. Local search will fallback to database queries.', err.message);
  }
};

module.exports = {
  esClient,
  checkElasticsearch
};
