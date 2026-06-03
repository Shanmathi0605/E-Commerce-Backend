const { BaseConsumer, Topics } = require('@ecommerce/common');
const { esClient } = require('../config/elasticsearch');
const kafka = require('../config/kafka');

class ProductCreatedConsumer extends BaseConsumer {
  get topic() {
    return Topics.PRODUCT_CREATED;
  }
  get groupId() {
    return 'product-service-es-sync-created';
  }
}

class ProductUpdatedConsumer extends BaseConsumer {
  get topic() {
    return Topics.PRODUCT_UPDATED;
  }
  get groupId() {
    return 'product-service-es-sync-updated';
  }
}

class ProductDeletedConsumer extends BaseConsumer {
  get topic() {
    return Topics.PRODUCT_DELETED;
  }
  get groupId() {
    return 'product-service-es-sync-deleted';
  }
}

const initializeESIndex = async () => {
  try {
    const exists = await esClient.indices.exists({ index: 'products' });
    if (!exists) {
      await esClient.indices.create({
        index: 'products',
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              vendorId: { type: 'keyword' },
              title: { type: 'text', analyzer: 'english' },
              description: { type: 'text', analyzer: 'english' },
              price: { type: 'float' },
              category: { type: 'keyword' },
              brand: { type: 'text' },
              averageRating: { type: 'float' },
              numReviews: { type: 'integer' },
              status: { type: 'keyword' }
            }
          }
        }
      });
      console.log('[Product Service] Created Elasticsearch products index.');
    }
  } catch (err) {
    console.warn('[Product Service] Failed to initialize ES index. ES search may not function.', err.message);
  }
};

const startConsumers = async () => {
  await initializeESIndex();

  const createdConsumer = new ProductCreatedConsumer(kafka);
  const updatedConsumer = new ProductUpdatedConsumer(kafka);
  const deletedConsumer = new ProductDeletedConsumer(kafka);

  try {
    // Listen to Product Created
    await createdConsumer.listen(async (data) => {
      console.log(`[ES Sync] Indexing product: ${data.title} (${data.id})`);
      try {
        await esClient.index({
          index: 'products',
          id: data.id,
          body: data
        });
      } catch (err) {
        console.error('[ES Sync] Failed to index product', err.message);
      }
    });

    // Listen to Product Updated
    await updatedConsumer.listen(async (data) => {
      console.log(`[ES Sync] Updating product index: ${data.title} (${data.id})`);
      try {
        await esClient.index({
          index: 'products',
          id: data.id,
          body: data
        });
      } catch (err) {
        console.error('[ES Sync] Failed to update product index', err.message);
      }
    });

    // Listen to Product Deleted
    await deletedConsumer.listen(async (data) => {
      console.log(`[ES Sync] Removing product from index: ${data.id}`);
      try {
        await esClient.delete({
          index: 'products',
          id: data.id
        });
      } catch (err) {
        console.error('[ES Sync] Failed to delete product index', err.message);
      }
    });

  } catch (err) {
    console.error('[Product Service Consumers] Kafka consumer register error:', err);
  }
};

module.exports = { startConsumers };
