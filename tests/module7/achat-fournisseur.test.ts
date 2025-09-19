import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../helpers/test-app';
import { createTestUser, createTestCategory, testData } from '../setup';

describe('Module 7: Achat Fournisseur', () => {
  let app: any;
  let authToken: string;
  let userId: number;
  let categoryId: number;
  let ingredient1Id: number;
  let ingredient2Id: number;
  let supplierId: number;

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

    // Créer un fournisseur de test
    const supplier = await request(app)
      .post('/api/suppliers')
      .send({
        name: 'Fournisseur Test',
        contact: 'Contact Test',
        email: 'supplier@test.com',
        phone: '123456789',
        address: 'Adresse Test',
        paymentTerms: '30 jours',
        currency: 'DA'
      });
    supplierId = supplier.body.id;
    
    // Simuler l'authentification
    authToken = 'test-token';
  });

  describe('POST /api/purchase-orders', () => {
    it('devrait créer une commande d\'achat avec succès', async () => {
      const purchaseOrderData = {
        supplierId: supplierId,
        reference: 'PO-001',
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            articleId: ingredient1Id,
            quantity: 1000,
            unitPrice: 2.50,
            totalPrice: 2500.00
          },
          {
            articleId: ingredient2Id,
            quantity: 500,
            unitPrice: 3.00,
            totalPrice: 1500.00
          }
        ],
        notes: 'Commande d\'achat pour stock de base'
      };

      const response = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchaseOrderData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.supplierId).toBe(supplierId);
      expect(response.body.reference).toBe('PO-001');
      expect(response.body.status).toBe('pending');
      expect(response.body.items).toHaveLength(2);
      expect(response.body.totalAmount).toBe('4000.00');
    });

    it('devrait échouer si le fournisseur n\'existe pas', async () => {
      const purchaseOrderData = {
        supplierId: 99999, // ID inexistant
        reference: 'PO-002',
        items: [
          {
            articleId: ingredient1Id,
            quantity: 1000,
            unitPrice: 2.50,
            totalPrice: 2500.00
          }
        ]
      };

      await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchaseOrderData)
        .expect(400);
    });

    it('devrait échouer si un article n\'existe pas', async () => {
      const purchaseOrderData = {
        supplierId: supplierId,
        reference: 'PO-003',
        items: [
          {
            articleId: 99999, // ID inexistant
            quantity: 1000,
            unitPrice: 2.50,
            totalPrice: 2500.00
          }
        ]
      };

      await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchaseOrderData)
        .expect(400);
    });

    it('devrait échouer si les données requises sont manquantes', async () => {
      const invalidData = {
        supplierId: supplierId
        // Manque reference, items, etc.
      };

      await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/purchase-orders', () => {
    it('devrait récupérer la liste des commandes d\'achat', async () => {
      // Créer quelques commandes d'achat de test
      await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-002',
          items: [
            {
              articleId: ingredient2Id,
              quantity: 500,
              unitPrice: 3.00,
              totalPrice: 1500.00
            }
          ]
        });

      const response = await request(app)
        .get('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait filtrer les commandes par statut', async () => {
      const response = await request(app)
        .get('/api/purchase-orders?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait filtrer les commandes par fournisseur', async () => {
      const response = await request(app)
        .get(`/api/purchase-orders?supplierId=${supplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait filtrer les commandes par date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/purchase-orders?date=${today}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/purchase-orders/:id', () => {
    it('devrait récupérer une commande d\'achat spécifique', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ],
          notes: 'Commande de test'
        });

      const purchaseOrderId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/purchase-orders/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(purchaseOrderId);
      expect(response.body.supplierId).toBe(supplierId);
      expect(response.body.reference).toBe('PO-001');
      expect(response.body.notes).toBe('Commande de test');
    });

    it('devrait retourner 404 si la commande n\'existe pas', async () => {
      await request(app)
        .get('/api/purchase-orders/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/purchase-orders/:id', () => {
    it('devrait mettre à jour une commande d\'achat existante', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const purchaseOrderId = createResponse.body.id;

      const updateData = {
        reference: 'PO-001-MODIFIED',
        notes: 'Commande modifiée',
        expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .put(`/api/purchase-orders/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.reference).toBe('PO-001-MODIFIED');
      expect(response.body.notes).toBe('Commande modifiée');
    });

    it('devrait mettre à jour les articles d\'une commande', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const purchaseOrderId = createResponse.body.id;

      const updateData = {
        items: [
          {
            articleId: ingredient1Id,
            quantity: 1500, // Quantité modifiée
            unitPrice: 2.50,
            totalPrice: 3750.00
          },
          {
            articleId: ingredient2Id, // Nouvel article
            quantity: 500,
            unitPrice: 3.00,
            totalPrice: 1500.00
          }
        ]
      };

      const response = await request(app)
        .put(`/api/purchase-orders/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.totalAmount).toBe('5250.00');
    });

    it('devrait échouer si la commande n\'existe pas', async () => {
      const updateData = {
        reference: 'PO-MODIFIED'
      };

      await request(app)
        .put('/api/purchase-orders/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('PUT /api/purchase-orders/:id/confirm', () => {
    it('devrait confirmer une commande d\'achat', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const purchaseOrderId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/purchase-orders/${purchaseOrderId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmedBy: userId,
          confirmedDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.status).toBe('confirmed');
      expect(response.body.confirmedAt).toBeDefined();
      expect(response.body.confirmedBy).toBe(userId);
    });

    it('devrait échouer si la commande n\'est pas en statut "pending"', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const purchaseOrderId = createResponse.body.id;

      // Confirmer la commande
      await request(app)
        .put(`/api/purchase-orders/${purchaseOrderId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmedBy: userId
        });

      // Tentative de reconfirmation devrait échouer
      await request(app)
        .put(`/api/purchase-orders/${purchaseOrderId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmedBy: userId
        })
        .expect(400);
    });
  });

  describe('PUT /api/purchase-orders/:id/receive', () => {
    it('devrait enregistrer la réception d\'une commande', async () => {
      // Créer et confirmer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const purchaseOrderId = createResponse.body.id;

      await request(app)
        .put(`/api/purchase-orders/${purchaseOrderId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmedBy: userId
        });

      // Enregistrer la réception
      const response = await request(app)
        .put(`/api/purchase-orders/${purchaseOrderId}/receive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receivedBy: userId,
          receivedDate: new Date().toISOString(),
          receivedItems: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              lotNumber: 'LOT-001',
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        })
        .expect(200);

      expect(response.body.status).toBe('received');
      expect(response.body.receivedAt).toBeDefined();
      expect(response.body.receivedBy).toBe(userId);
    });

    it('devrait échouer si la commande n\'est pas confirmée', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const purchaseOrderId = createResponse.body.id;

      // Tentative de réception sans confirmation devrait échouer
      await request(app)
        .put(`/api/purchase-orders/${purchaseOrderId}/receive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receivedBy: userId,
          receivedItems: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              lotNumber: 'LOT-001'
            }
          ]
        })
        .expect(400);
    });
  });

  describe('PUT /api/purchase-orders/:id/cancel', () => {
    it('devrait annuler une commande d\'achat', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const purchaseOrderId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/purchase-orders/${purchaseOrderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cancelledBy: userId,
          reason: 'Fournisseur indisponible'
        })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
      expect(response.body.cancelledAt).toBeDefined();
      expect(response.body.cancelledBy).toBe(userId);
      expect(response.body.cancellationReason).toBe('Fournisseur indisponible');
    });
  });

  describe('DELETE /api/purchase-orders/:id', () => {
    it('devrait supprimer une commande d\'achat existante', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const purchaseOrderId = createResponse.body.id;

      await request(app)
        .delete(`/api/purchase-orders/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Vérifier que la commande a été supprimée
      await request(app)
        .get(`/api/purchase-orders/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('devrait échouer si la commande n\'existe pas', async () => {
      await request(app)
        .delete('/api/purchase-orders/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('devrait échouer si la commande est déjà reçue', async () => {
      // Créer, confirmer et recevoir une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: supplierId,
          reference: 'PO-001',
          items: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const purchaseOrderId = createResponse.body.id;

      await request(app)
        .put(`/api/purchase-orders/${purchaseOrderId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmedBy: userId
        });

      await request(app)
        .put(`/api/purchase-orders/${purchaseOrderId}/receive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receivedBy: userId,
          receivedItems: [
            {
              articleId: ingredient1Id,
              quantity: 1000,
              lotNumber: 'LOT-001'
            }
          ]
        });

      // Tentative de suppression devrait échouer
      await request(app)
        .delete(`/api/purchase-orders/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/purchase-orders/statistics', () => {
    it('devrait récupérer les statistiques des commandes d\'achat', async () => {
      const response = await request(app)
        .get('/api/purchase-orders/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('pending');
      expect(response.body).toHaveProperty('confirmed');
      expect(response.body).toHaveProperty('received');
      expect(response.body).toHaveProperty('cancelled');
    });

    it('devrait récupérer les statistiques pour une période', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/purchase-orders/statistics?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('totalAmount');
    });
  });

  describe('GET /api/purchase-orders/supplier/:supplierId', () => {
    it('devrait récupérer les commandes d\'achat d\'un fournisseur', async () => {
      const response = await request(app)
        .get(`/api/purchase-orders/supplier/${supplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
