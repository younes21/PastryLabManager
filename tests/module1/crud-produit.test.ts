import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../helpers/test-app';
import { createTestUser, createTestCategory, testData } from '../setup';

describe('Module 1: CRUD Produit', () => {
  let app: any;
  let authToken: string;
  let userId: number;
  let categoryId: number;

  beforeEach(async () => {
    app = await createApp();
    
    // Créer un utilisateur de test
    const user = await createTestUser();
    userId = user.id;
    
    // Créer une catégorie de test
    const category = await createTestCategory();
    categoryId = category.id;
    
    // Simuler l'authentification
    authToken = 'test-token';
  });

  describe('POST /api/articles', () => {
    it('devrait créer un nouveau produit avec succès', async () => {
      const productData = {
        designation: 'Produit Test',
        description: 'Description du produit test',
        categoryId: categoryId,
        unitId: 1,
        type: 'produit',
        forSale: true,
        trackStock: true,
        minStock: 10,
        maxStock: 100,
        costPrice: 50.00,
        sellingPrice: 75.00
      };

      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.designation).toBe(productData.designation);
      expect(response.body.type).toBe('produit');
      expect(response.body.forSale).toBe(true);
      expect(response.body.trackStock).toBe(true);
    });

    it('devrait échouer si les données requises sont manquantes', async () => {
      const invalidData = {
        designation: 'Produit Test'
        // Manque categoryId, type, etc.
      };

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('devrait échouer si la catégorie n\'existe pas', async () => {
      const productData = {
        designation: 'Produit Test',
        categoryId: 99999, // ID inexistant
        type: 'produit',
        forSale: true
      };

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(400);
    });
  });

  describe('GET /api/articles', () => {
    it('devrait récupérer la liste des produits', async () => {
      // Créer quelques produits de test
      const product1 = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Produit 1',
          categoryId: categoryId,
          type: 'produit',
          forSale: true
        });

      const product2 = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Produit 2',
          categoryId: categoryId,
          type: 'produit',
          forSale: true
        });

      const response = await request(app)
        .get('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait filtrer les produits par type', async () => {
      // Créer un produit et un ingrédient
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Produit Test',
          categoryId: categoryId,
          type: 'produit',
          forSale: true
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Ingrédient Test',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false
        });

      const response = await request(app)
        .get('/api/articles?type=produit')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.every((item: any) => item.type === 'produit')).toBe(true);
    });

    it('devrait filtrer les produits par catégorie', async () => {
      const response = await request(app)
        .get(`/api/articles?categoryId=${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/articles/:id', () => {
    it('devrait récupérer un produit spécifique', async () => {
      // Créer un produit
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Produit Test',
          categoryId: categoryId,
          type: 'produit',
          forSale: true
        });

      const productId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/articles/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(productId);
      expect(response.body.designation).toBe('Produit Test');
    });

    it('devrait retourner 404 si le produit n\'existe pas', async () => {
      await request(app)
        .get('/api/articles/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/articles/:id', () => {
    it('devrait mettre à jour un produit existant', async () => {
      // Créer un produit
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Produit Original',
          categoryId: categoryId,
          type: 'produit',
          forSale: true
        });

      const productId = createResponse.body.id;

      const updateData = {
        designation: 'Produit Modifié',
        description: 'Nouvelle description',
        sellingPrice: 100.00
      };

      const response = await request(app)
        .put(`/api/articles/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.designation).toBe('Produit Modifié');
      expect(response.body.description).toBe('Nouvelle description');
      expect(response.body.sellingPrice).toBe('100.00');
    });

    it('devrait échouer si le produit n\'existe pas', async () => {
      const updateData = {
        designation: 'Produit Modifié'
      };

      await request(app)
        .put('/api/articles/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/articles/:id', () => {
    it('devrait supprimer un produit existant', async () => {
      // Créer un produit
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Produit à Supprimer',
          categoryId: categoryId,
          type: 'produit',
          forSale: true
        });

      const productId = createResponse.body.id;

      await request(app)
        .delete(`/api/articles/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Vérifier que le produit a été supprimé
      await request(app)
        .get(`/api/articles/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('devrait échouer si le produit n\'existe pas', async () => {
      await request(app)
        .delete('/api/articles/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('devrait échouer si le produit est utilisé dans des commandes', async () => {
      // Créer un produit
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Produit avec Commandes',
          categoryId: categoryId,
          type: 'produit',
          forSale: true
        });

      const productId = createResponse.body.id;

      // Créer une commande avec ce produit
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId: 1,
          items: [{
            articleId: productId,
            quantity: 1,
            unitPrice: 50.00
          }]
        });

      // Tentative de suppression devrait échouer
      await request(app)
        .delete(`/api/articles/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/articles/:id/stock', () => {
    it('devrait récupérer le stock d\'un produit', async () => {
      // Créer un produit avec suivi de stock
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Produit avec Stock',
          categoryId: categoryId,
          type: 'produit',
          forSale: true,
          trackStock: true
        });

      const productId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/articles/${productId}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('articleId', productId);
      expect(response.body).toHaveProperty('totalQuantity');
      expect(response.body).toHaveProperty('reservedQuantity');
      expect(response.body).toHaveProperty('availableQuantity');
    });
  });
});
