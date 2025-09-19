import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../helpers/test-app';
import { createTestUser, createTestCategory, testData } from '../setup';

describe('Module 6: Mise à Jour Stock lors des Opérations', () => {
  let app: any;
  let authToken: string;
  let userId: number;
  let categoryId: number;
  let ingredient1Id: number;
  let ingredient2Id: number;
  let productId: number;
  let supplierId: number;
  let clientId: number;

  beforeEach(async () => {
    app = await createApp();
    
    // Créer un utilisateur de test
    const user = await createTestUser();
    userId = user.id;
    
    // Créer une catégorie de test
    const category = await createTestCategory();
    categoryId = category.id;
    
    // Créer des ingrédients de test
    const ingredient1 = await request(app)
      .post('/api/articles')
      .send({
        designation: 'Farine',
        categoryId: categoryId,
        type: 'ingredient',
        forSale: false,
        trackStock: true,
        costPrice: 2.50
      });
    ingredient1Id = ingredient1.body.id;

    const ingredient2 = await request(app)
      .post('/api/articles')
      .send({
        designation: 'Sucre',
        categoryId: categoryId,
        type: 'ingredient',
        forSale: false,
        trackStock: true,
        costPrice: 3.00
      });
    ingredient2Id = ingredient2.body.id;

    // Créer un produit de test
    const product = await request(app)
      .post('/api/articles')
      .send({
        designation: 'Gâteau',
        categoryId: categoryId,
        type: 'produit',
        forSale: true,
        trackStock: true,
        sellingPrice: 15.00
      });
    productId = product.body.id;

    // Créer un fournisseur de test
    const supplier = await request(app)
      .post('/api/suppliers')
      .send({
        name: 'Fournisseur Test',
        contact: 'Contact Test',
        email: 'supplier@test.com',
        phone: '123456789',
        address: 'Adresse Test'
      });
    supplierId = supplier.body.id;

    // Créer un client de test
    const client = await request(app)
      .post('/api/clients')
      .send({
        name: 'Client Test',
        contact: 'Contact Test',
        email: 'client@test.com',
        phone: '123456789',
        address: 'Adresse Test'
      });
    clientId = client.body.id;
    
    // Simuler l'authentification
    authToken = 'test-token';
  });

  describe('POST /api/inventory-operations (Réception)', () => {
    it('devrait créer une opération de réception et mettre à jour le stock', async () => {
      const operationData = {
        type: 'reception',
        supplierId: supplierId,
        reference: 'REC-001',
        items: [
          {
            articleId: ingredient1Id,
            quantity: 1000,
            unitPrice: 2.50,
            lotNumber: 'LOT-001',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            articleId: ingredient2Id,
            quantity: 500,
            unitPrice: 3.00,
            lotNumber: 'LOT-002',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };

      const response = await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(operationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('reception');
      expect(response.body.status).toBe('completed');
      expect(response.body.items).toHaveLength(2);

      // Vérifier que le stock a été mis à jour
      const stockResponse = await request(app)
        .get(`/api/articles/${ingredient1Id}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(stockResponse.body.totalQuantity).toBe(1000);
      expect(stockResponse.body.availableQuantity).toBe(1000);
    });

    it('devrait créer une opération de réception avec lots', async () => {
      const operationData = {
        type: 'reception',
        supplierId: supplierId,
        reference: 'REC-002',
        items: [
          {
            articleId: ingredient1Id,
            quantity: 1000,
            unitPrice: 2.50,
            lotNumber: 'LOT-003',
            expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };

      const response = await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(operationData)
        .expect(201);

      expect(response.body.items[0]).toHaveProperty('lotNumber', 'LOT-003');
      expect(response.body.items[0]).toHaveProperty('expiryDate');
    });
  });

  describe('POST /api/inventory-operations (Sortie)', () => {
    beforeEach(async () => {
      // Créer du stock initial
      await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'reception',
          supplierId: supplierId,
          reference: 'REC-INITIAL',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              lotNumber: 'LOT-INITIAL'
            }
          ]
        });
    });

    it('devrait créer une opération de sortie et diminuer le stock', async () => {
      const operationData = {
        type: 'sortie',
        reference: 'SORT-001',
        reason: 'Utilisation en production',
        items: [
          {
            articleId: ingredient1Id,
            quantity: 200,
            lotNumber: 'LOT-INITIAL'
          }
        ]
      };

      const response = await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(operationData)
        .expect(201);

      expect(response.body.type).toBe('sortie');
      expect(response.body.status).toBe('completed');

      // Vérifier que le stock a été diminué
      const stockResponse = await request(app)
        .get(`/api/articles/${ingredient1Id}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(stockResponse.body.totalQuantity).toBe(800);
      expect(stockResponse.body.availableQuantity).toBe(800);
    });

    it('devrait échouer si le stock est insuffisant', async () => {
      const operationData = {
        type: 'sortie',
        reference: 'SORT-002',
        reason: 'Utilisation en production',
        items: [
          {
            articleId: ingredient1Id,
            quantity: 1500, // Plus que le stock disponible
            lotNumber: 'LOT-INITIAL'
          }
        ]
      };

      await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(operationData)
        .expect(400);
    });
  });

  describe('POST /api/inventory-operations (Ajustement)', () => {
    beforeEach(async () => {
      // Créer du stock initial
      await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'reception',
          supplierId: supplierId,
          reference: 'REC-INITIAL',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              lotNumber: 'LOT-INITIAL'
            }
          ]
        });
    });

    it('devrait créer une opération d\'ajustement positif', async () => {
      const operationData = {
        type: 'ajustement',
        reference: 'AJUST-001',
        reason: 'Inventaire physique - différence positive',
        items: [
          {
            articleId: ingredient1Id,
            quantity: 50, // Ajustement positif
            lotNumber: 'LOT-INITIAL'
          }
        ]
      };

      const response = await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(operationData)
        .expect(201);

      expect(response.body.type).toBe('ajustement');

      // Vérifier que le stock a été ajusté
      const stockResponse = await request(app)
        .get(`/api/articles/${ingredient1Id}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(stockResponse.body.totalQuantity).toBe(1050);
    });

    it('devrait créer une opération d\'ajustement négatif', async () => {
      const operationData = {
        type: 'ajustement',
        reference: 'AJUST-002',
        reason: 'Inventaire physique - différence négative',
        items: [
          {
            articleId: ingredient1Id,
            quantity: -30, // Ajustement négatif
            lotNumber: 'LOT-INITIAL'
          }
        ]
      };

      const response = await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(operationData)
        .expect(201);

      // Vérifier que le stock a été ajusté
      const stockResponse = await request(app)
        .get(`/api/articles/${ingredient1Id}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(stockResponse.body.totalQuantity).toBe(970);
    });
  });

  describe('POST /api/inventory-operations (Transfert)', () => {
    beforeEach(async () => {
      // Créer du stock initial
      await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'reception',
          supplierId: supplierId,
          reference: 'REC-INITIAL',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              lotNumber: 'LOT-INITIAL'
            }
          ]
        });
    });

    it('devrait créer une opération de transfert entre zones', async () => {
      const operationData = {
        type: 'transfert',
        reference: 'TRANS-001',
        fromZoneId: 1,
        toZoneId: 2,
        items: [
          {
            articleId: ingredient1Id,
            quantity: 200,
            lotNumber: 'LOT-INITIAL'
          }
        ]
      };

      const response = await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(operationData)
        .expect(201);

      expect(response.body.type).toBe('transfert');
      expect(response.body.fromZoneId).toBe(1);
      expect(response.body.toZoneId).toBe(2);
    });
  });

  describe('POST /api/orders (Impact sur le stock)', () => {
    beforeEach(async () => {
      // Créer du stock initial pour le produit
      await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'reception',
          supplierId: supplierId,
          reference: 'REC-PRODUIT',
          items: [
            {
              articleId: productId,
              quantity: 10,
              unitPrice: 10.00,
              lotNumber: 'LOT-PRODUIT'
            }
          ]
        });
    });

    it('devrait créer une commande et réserver le stock', async () => {
      const orderData = {
        clientId: clientId,
        items: [
          {
            articleId: productId,
            quantity: 3,
            unitPrice: 15.00
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.items).toHaveLength(1);

      // Vérifier que le stock a été réservé
      const stockResponse = await request(app)
        .get(`/api/articles/${productId}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(stockResponse.body.totalQuantity).toBe(10);
      expect(stockResponse.body.reservedQuantity).toBe(3);
      expect(stockResponse.body.availableQuantity).toBe(7);
    });

    it('devrait échouer si le stock disponible est insuffisant', async () => {
      const orderData = {
        clientId: clientId,
        items: [
          {
            articleId: productId,
            quantity: 15, // Plus que le stock disponible
            unitPrice: 15.00
          }
        ]
      };

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);
    });
  });

  describe('PUT /api/orders/:id/validate (Validation commande)', () => {
    let orderId: number;

    beforeEach(async () => {
      // Créer du stock initial
      await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'reception',
          supplierId: supplierId,
          reference: 'REC-PRODUIT',
          items: [
            {
              articleId: productId,
              quantity: 10,
              unitPrice: 10.00,
              lotNumber: 'LOT-PRODUIT'
            }
          ]
        });

      // Créer une commande
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId: clientId,
          items: [
            {
              articleId: productId,
              quantity: 3,
              unitPrice: 15.00
            }
          ]
        });
      orderId = orderResponse.body.id;
    });

    it('devrait valider une commande et confirmer la réservation', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          validatedBy: userId
        })
        .expect(200);

      expect(response.body.status).toBe('validated');

      // Vérifier que la réservation est confirmée
      const stockResponse = await request(app)
        .get(`/api/articles/${productId}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(stockResponse.body.reservedQuantity).toBe(3);
    });
  });

  describe('PUT /api/orders/:id/deliver (Livraison commande)', () => {
    let orderId: number;

    beforeEach(async () => {
      // Créer du stock initial
      await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'reception',
          supplierId: supplierId,
          reference: 'REC-PRODUIT',
          items: [
            {
              articleId: productId,
              quantity: 10,
              unitPrice: 10.00,
              lotNumber: 'LOT-PRODUIT'
            }
          ]
        });

      // Créer et valider une commande
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId: clientId,
          items: [
            {
              articleId: productId,
              quantity: 3,
              unitPrice: 15.00
            }
          ]
        });
      orderId = orderResponse.body.id;

      await request(app)
        .put(`/api/orders/${orderId}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          validatedBy: userId
        });
    });

    it('devrait livrer une commande et diminuer le stock', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/deliver`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deliveredBy: userId,
          deliveryDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.status).toBe('delivered');

      // Vérifier que le stock a été diminué
      const stockResponse = await request(app)
        .get(`/api/articles/${productId}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(stockResponse.body.totalQuantity).toBe(7);
      expect(stockResponse.body.reservedQuantity).toBe(0);
      expect(stockResponse.body.availableQuantity).toBe(7);
    });
  });

  describe('GET /api/articles/:id/stock-history', () => {
    it('devrait récupérer l\'historique des mouvements de stock', async () => {
      // Créer quelques opérations
      await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'reception',
          supplierId: supplierId,
          reference: 'REC-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              lotNumber: 'LOT-001'
            }
          ]
        });

      await request(app)
        .post('/api/inventory-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'sortie',
          reference: 'SORT-001',
          reason: 'Utilisation',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 200,
              lotNumber: 'LOT-001'
            }
          ]
        });

      const response = await request(app)
        .get(`/api/articles/${ingredient1Id}/stock-history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0]).toHaveProperty('operationType');
      expect(response.body[0]).toHaveProperty('quantity');
      expect(response.body[0]).toHaveProperty('date');
    });
  });

  describe('GET /api/stock/alerts', () => {
    it('devrait récupérer les alertes de stock', async () => {
      const response = await request(app)
        .get('/api/stock/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait récupérer les alertes de stock bas', async () => {
      const response = await request(app)
        .get('/api/stock/alerts?type=low')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait récupérer les alertes d\'expiration', async () => {
      const response = await request(app)
        .get('/api/stock/alerts?type=expiry')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
