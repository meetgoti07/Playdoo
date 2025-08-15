import { syncProductToElasticsearch } from './elasticsearch';
import type { Product } from './elasticsearch';

// Database operations that should sync with Elasticsearch
export class ProductService {
  
  // Create product in database and sync to Elasticsearch
  static async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Simulate database creation
      const product: Product = {
        ...productData,
        id: Math.random().toString(36).substr(2, 9), // Generate random ID
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // TODO: Replace with actual database insertion
      // const dbResult = await db.product.create({ data: product });

      // Sync to Elasticsearch
      const esResult = await syncProductToElasticsearch('create', product);
      
      if (!esResult.success) {
        console.error('Failed to sync product to Elasticsearch:', esResult.error);
        // In production, you might want to queue this for retry
      }

      return { success: true, product };
    } catch (error) {
      console.error('Error creating product:', error);
      return { success: false, error };
    }
  }

  // Update product in database and sync to Elasticsearch
  static async updateProduct(id: string, updateData: Partial<Omit<Product, 'id' | 'createdAt'>>) {
    try {
      // TODO: Replace with actual database update
      // const existingProduct = await db.product.findUnique({ where: { id } });
      // if (!existingProduct) {
      //   return { success: false, error: 'Product not found' };
      // }

      // Simulate getting existing product (you'd get this from your database)
      const updatedProduct: Product = {
        id,
        name: 'Updated Product', // These would come from database
        description: 'Updated description',
        price: 999,
        category: 'Electronics',
        tags: ['updated'],
        sku: 'UPD-001',
        inStock: true,
        createdAt: new Date('2024-01-01'),
        ...updateData,
        updatedAt: new Date()
      };

      // TODO: Replace with actual database update
      // const dbResult = await db.product.update({
      //   where: { id },
      //   data: { ...updateData, updatedAt: new Date() }
      // });

      // Sync to Elasticsearch
      const esResult = await syncProductToElasticsearch('update', updatedProduct);
      
      if (!esResult.success) {
        console.error('Failed to sync product update to Elasticsearch:', esResult.error);
        // In production, you might want to queue this for retry
      }

      return { success: true, product: updatedProduct };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, error };
    }
  }

  // Delete product from database and sync to Elasticsearch
  static async deleteProduct(id: string) {
    try {
      // TODO: Replace with actual database deletion
      // const existingProduct = await db.product.findUnique({ where: { id } });
      // if (!existingProduct) {
      //   return { success: false, error: 'Product not found' };
      // }

      // TODO: Replace with actual database deletion
      // await db.product.delete({ where: { id } });

      // Sync to Elasticsearch
      const esResult = await syncProductToElasticsearch('delete', { id });
      
      if (!esResult.success) {
        console.error('Failed to sync product deletion to Elasticsearch:', esResult.error);
        // In production, you might want to queue this for retry
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error };
    }
  }

  // Bulk sync existing products from database to Elasticsearch
  static async syncAllProductsToElasticsearch() {
    try {
      // TODO: Replace with actual database query
      // const products = await db.product.findMany();
      
      // For demo, we'll use the demo products
      const { demoProducts } = await import('./demo-data');
      
      // Sync each product
      const results = await Promise.all(
        demoProducts.map(product => syncProductToElasticsearch('create', product))
      );

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      return {
        success: failCount === 0,
        synced: successCount,
        failed: failCount,
        total: demoProducts.length
      };
    } catch (error) {
      console.error('Error syncing products to Elasticsearch:', error);
      return { success: false, error };
    }
  }
}

// Database event handlers (for ORM hooks/triggers)
export const databaseEventHandlers = {
  
  // Call this after creating a product in your database
  onProductCreated: async (product: Product) => {
    console.log('Database event: Product created, syncing to Elasticsearch...');
    const result = await syncProductToElasticsearch('create', product);
    if (!result.success) {
      console.error('Failed to sync created product to Elasticsearch:', result.error);
      // TODO: Add to retry queue
    }
  },

  // Call this after updating a product in your database
  onProductUpdated: async (product: Product) => {
    console.log('Database event: Product updated, syncing to Elasticsearch...');
    const result = await syncProductToElasticsearch('update', product);
    if (!result.success) {
      console.error('Failed to sync updated product to Elasticsearch:', result.error);
      // TODO: Add to retry queue
    }
  },

  // Call this after deleting a product from your database
  onProductDeleted: async (productId: string) => {
    console.log('Database event: Product deleted, syncing to Elasticsearch...');
    const result = await syncProductToElasticsearch('delete', { id: productId });
    if (!result.success) {
      console.error('Failed to sync deleted product to Elasticsearch:', result.error);
      // TODO: Add to retry queue
    }
  }
};

// Example usage with Prisma (commented out since we don't have Prisma set up)
/*
// If using Prisma, you could create middleware like this:
prisma.$use(async (params, next) => {
  const result = await next(params);
  
  if (params.model === 'Product') {
    if (params.action === 'create') {
      await databaseEventHandlers.onProductCreated(result);
    } else if (params.action === 'update') {
      await databaseEventHandlers.onProductUpdated(result);
    } else if (params.action === 'delete') {
      await databaseEventHandlers.onProductDeleted(params.where.id);
    }
  }
  
  return result;
});
*/

export default ProductService;
