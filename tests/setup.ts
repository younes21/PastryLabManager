import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { db } from '../server/db.js';
import { storage } from '../server/storage.js';
import { sql } from 'drizzle-orm';

// Configuration pour les tests
process.env.NODE_ENV = 'test';

// Nettoyage de la base de données avant chaque test
beforeEach(async () => {
  // Nettoyer les tables dans l'ordre inverse des dépendances
  await db.execute(sql`DELETE FROM stock_reservations`);
  await db.execute(sql`DELETE FROM inventory_operation_items`);
  await db.execute(sql`DELETE FROM inventory_operations`);
  await db.execute(sql`DELETE FROM order_items`);
  await db.execute(sql`DELETE FROM orders`);
  await db.execute(sql`DELETE FROM recipe_operations`);
  await db.execute(sql`DELETE FROM recipe_ingredients`);
  await db.execute(sql`DELETE FROM recipes`);
  await db.execute(sql`DELETE FROM lots`);
  await db.execute(sql`DELETE FROM stock`);
  await db.execute(sql`DELETE FROM articles`);
  await db.execute(sql`DELETE FROM article_categories`);
  await db.execute(sql`DELETE FROM suppliers`);
  await db.execute(sql`DELETE FROM clients`);
  await db.execute(sql`DELETE FROM users`);
  await db.execute(sql`DELETE FROM measurement_units`);
  await db.execute(sql`DELETE FROM measurement_categories`);
  await db.execute(sql`DELETE FROM price_rules`);
  await db.execute(sql`DELETE FROM price_lists`);
  await db.execute(sql`DELETE FROM taxes`);
  await db.execute(sql`DELETE FROM currencies`);
  await db.execute(sql`DELETE FROM delivery_methods`);
  await db.execute(sql`DELETE FROM accounting_journals`);
  await db.execute(sql`DELETE FROM accounting_accounts`);
  await db.execute(sql`DELETE FROM storage_zones`);
  await db.execute(sql`DELETE FROM work_stations`);
});

// Données de test communes
export const testData = {
  user: {
    username: 'testuser',
    password: 'testpass',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin'
  },
  category: {
    designation: 'Test Category',
    type: 'produit' as const,
    forSale: true
  },
  article: {
    name: 'Test Article',
    description: 'Test Description',
    categoryId: 1,
    unit: 'kg',
    type: 'produit' as const,
    salePrice: '10.00',
    minStock: '10',
    maxStock: '100',
    shelfLife: null
  },
  supplier: {
    type: 'societe',
    name: 'Test Supplier',
    contact: 'Test Contact',
    email: 'supplier@example.com',
    phone: '123456789',
    address: 'Test Address'
  },
  client: {
    type: 'particulier',
    name: 'Test Client',
    contact: 'Test Contact',
    email: 'client@example.com',
    phone: '123456789',
    address: 'Test Address'
  }
};

// Fonctions utilitaires pour les tests
export const createTestUser = async () => {
  return await storage.createUser(testData.user);
};

export const createTestCategory = async () => {
  return await storage.createArticleCategory(testData.category);
};

export const createTestArticle = async (categoryId: number) => {
  const articleData = { ...testData.article, categoryId };
  return await storage.createArticle(articleData);
};

export const createTestSupplier = async () => {
  return await storage.createSupplier(testData.supplier);
};

export const createTestClient = async () => {
  return await storage.createClient(testData.client);
};
