import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import express from 'express';

// Simuler l'API des achats fournisseur
const createPurchaseOrderAPI = () => {
  const app = express();
  app.use(express.json());
  
  let purchaseOrders: any[] = [];
  let nextId = 1;

  // GET /api/purchase-orders - Récupérer toutes les commandes d'achat
  app.get('/api/purchase-orders', (req, res) => {
    const { status, supplierId, date } = req.query;
    let filteredOrders = purchaseOrders;
    
    if (status) {
      filteredOrders = filteredOrders.filter(po => po.status === status);
    }
    if (supplierId) {
      filteredOrders = filteredOrders.filter(po => po.supplierId === parseInt(supplierId as string));
    }
    if (date) {
      filteredOrders = filteredOrders.filter(po => po.orderDate.startsWith(date));
    }
    
    res.json(filteredOrders);
  });

  // GET /api/purchase-orders/statistics - Récupérer les statistiques
  app.get('/api/purchase-orders/statistics', (req, res) => {
    const stats = {
      total: purchaseOrders.length,
      pending: purchaseOrders.filter(po => po.status === 'pending').length,
      confirmed: purchaseOrders.filter(po => po.status === 'confirmed').length,
      received: purchaseOrders.filter(po => po.status === 'received').length,
      cancelled: purchaseOrders.filter(po => po.status === 'cancelled').length,
      totalAmount: purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0)
    };
    
    res.json(stats);
  });

  // GET /api/purchase-orders/supplier/:supplierId - Récupérer les commandes d'un fournisseur
  app.get('/api/purchase-orders/supplier/:supplierId', (req, res) => {
    const supplierId = parseInt(req.params.supplierId);
    const supplierOrders = purchaseOrders.filter(po => po.supplierId === supplierId);
    
    res.json(supplierOrders);
  });

  // GET /api/purchase-orders/:id - Récupérer une commande d'achat spécifique
  app.get('/api/purchase-orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const order = purchaseOrders.find(po => po.id === id);
    
    if (!order) {
      return res.status(404).json({ message: 'Commande d\'achat non trouvée' });
    }
    
    res.json(order);
  });

  // POST /api/purchase-orders - Créer une nouvelle commande d'achat
  app.post('/api/purchase-orders', (req, res) => {
    const { supplierId, reference, orderDate, expectedDeliveryDate, items, notes } = req.body;
    
    if (!supplierId || !reference || !items || items.length === 0) {
      return res.status(400).json({ message: 'Données requises manquantes' });
    }
    
    // Calculer le montant total
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    
    const newOrder = {
      id: nextId++,
      supplierId,
      reference,
      orderDate: orderDate || new Date().toISOString(),
      expectedDeliveryDate,
      status: 'pending',
      items,
      totalAmount,
      notes: notes || null,
      createdAt: new Date().toISOString()
    };
    
    purchaseOrders.push(newOrder);
    res.status(201).json(newOrder);
  });

  // PUT /api/purchase-orders/:id - Mettre à jour une commande d'achat
  app.put('/api/purchase-orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const orderIndex = purchaseOrders.findIndex(po => po.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Commande d\'achat non trouvée' });
    }
    
    const updateData = req.body;
    
    // Recalculer le montant total si les items sont modifiés
    if (updateData.items) {
      updateData.totalAmount = updateData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    }
    
    purchaseOrders[orderIndex] = { ...purchaseOrders[orderIndex], ...updateData };
    res.json(purchaseOrders[orderIndex]);
  });

  // PUT /api/purchase-orders/:id/confirm - Confirmer une commande d'achat
  app.put('/api/purchase-orders/:id/confirm', (req, res) => {
    const id = parseInt(req.params.id);
    const orderIndex = purchaseOrders.findIndex(po => po.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Commande d\'achat non trouvée' });
    }
    
    if (purchaseOrders[orderIndex].status !== 'pending') {
      return res.status(400).json({ message: 'Commande déjà confirmée ou reçue' });
    }
    
    const { confirmedBy, confirmedDate } = req.body;
    purchaseOrders[orderIndex] = {
      ...purchaseOrders[orderIndex],
      status: 'confirmed',
      confirmedAt: confirmedDate || new Date().toISOString(),
      confirmedBy
    };
    
    res.json(purchaseOrders[orderIndex]);
  });

  // PUT /api/purchase-orders/:id/receive - Enregistrer la réception
  app.put('/api/purchase-orders/:id/receive', (req, res) => {
    const id = parseInt(req.params.id);
    const orderIndex = purchaseOrders.findIndex(po => po.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Commande d\'achat non trouvée' });
    }
    
    if (purchaseOrders[orderIndex].status !== 'confirmed') {
      return res.status(400).json({ message: 'Commande non confirmée' });
    }
    
    const { receivedBy, receivedDate, receivedItems } = req.body;
    purchaseOrders[orderIndex] = {
      ...purchaseOrders[orderIndex],
      status: 'received',
      receivedAt: receivedDate || new Date().toISOString(),
      receivedBy,
      receivedItems
    };
    
    res.json(purchaseOrders[orderIndex]);
  });

  // PUT /api/purchase-orders/:id/cancel - Annuler une commande d'achat
  app.put('/api/purchase-orders/:id/cancel', (req, res) => {
    const id = parseInt(req.params.id);
    const orderIndex = purchaseOrders.findIndex(po => po.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Commande d\'achat non trouvée' });
    }
    
    const { cancelledBy, reason } = req.body;
    purchaseOrders[orderIndex] = {
      ...purchaseOrders[orderIndex],
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy,
      cancellationReason: reason
    };
    
    res.json(purchaseOrders[orderIndex]);
  });

  // DELETE /api/purchase-orders/:id - Supprimer une commande d'achat
  app.delete('/api/purchase-orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const orderIndex = purchaseOrders.findIndex(po => po.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Commande d\'achat non trouvée' });
    }
    
    if (purchaseOrders[orderIndex].status === 'received') {
      return res.status(400).json({ message: 'Impossible de supprimer une commande reçue' });
    }
    
    purchaseOrders.splice(orderIndex, 1);
    res.status(204).send();
  });

  return app;
};

describe('Module 7: Achat Fournisseur - Tests API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createPurchaseOrderAPI();
  });

  describe('POST /api/purchase-orders', () => {
    it('devrait créer une nouvelle commande d\'achat avec succès', async () => {
      const orderData = {
        supplierId: 1,
        reference: 'PO-001',
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            articleId: 1,
            quantity: 1000,
            unitPrice: 2.50,
            totalPrice: 2500.00
          },
          {
            articleId: 2,
            quantity: 500,
            unitPrice: 3.00,
            totalPrice: 1500.00
          }
        ],
        notes: 'Commande d\'achat pour stock de base'
      };

      const response = await request(app)
        .post('/api/purchase-orders')
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.supplierId).toBe(1);
      expect(response.body.reference).toBe('PO-001');
      expect(response.body.status).toBe('pending');
      expect(response.body.items).toHaveLength(2);
      expect(response.body.totalAmount).toBe(4000);
    });

    it('devrait échouer si les données requises sont manquantes', async () => {
      const invalidData = {
        supplierId: 1
        // Manque reference, items
      };

      await request(app)
        .post('/api/purchase-orders')
        .send(invalidData)
        .expect(400);
    });

    it('devrait échouer si la liste d\'articles est vide', async () => {
      const orderData = {
        supplierId: 1,
        reference: 'PO-002',
        items: []
      };

      await request(app)
        .post('/api/purchase-orders')
        .send(orderData)
        .expect(400);
    });
  });

  describe('GET /api/purchase-orders', () => {
    it('devrait récupérer la liste des commandes d\'achat', async () => {
      // Créer quelques commandes de test
      await request(app)
        .post('/api/purchase-orders')
        .send({
          supplierId: 1,
          reference: 'PO-001',
          items: [
            {
              articleId: 1,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      await request(app)
        .post('/api/purchase-orders')
        .send({
          supplierId: 1,
          reference: 'PO-002',
          items: [
            {
              articleId: 2,
              quantity: 500,
              unitPrice: 3.00,
              totalPrice: 1500.00
            }
          ]
        });

      const response = await request(app)
        .get('/api/purchase-orders')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait filtrer les commandes par statut', async () => {
      const response = await request(app)
        .get('/api/purchase-orders?status=pending')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait filtrer les commandes par fournisseur', async () => {
      const response = await request(app)
        .get('/api/purchase-orders?supplierId=1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/purchase-orders/:id/confirm', () => {
    it('devrait confirmer une commande d\'achat', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send({
          supplierId: 1,
          reference: 'PO-001',
          items: [
            {
              articleId: 1,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const orderId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/purchase-orders/${orderId}/confirm`)
        .send({
          confirmedBy: 1,
          confirmedDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.status).toBe('confirmed');
      expect(response.body.confirmedAt).toBeDefined();
      expect(response.body.confirmedBy).toBe(1);
    });

    it('devrait échouer si la commande n\'est pas en statut "pending"', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send({
          supplierId: 1,
          reference: 'PO-001',
          items: [
            {
              articleId: 1,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const orderId = createResponse.body.id;

      // Confirmer la commande
      await request(app)
        .put(`/api/purchase-orders/${orderId}/confirm`)
        .send({
          confirmedBy: 1
        });

      // Tentative de reconfirmation devrait échouer
      await request(app)
        .put(`/api/purchase-orders/${orderId}/confirm`)
        .send({
          confirmedBy: 1
        })
        .expect(400);
    });
  });

  describe('PUT /api/purchase-orders/:id/receive', () => {
    it('devrait enregistrer la réception d\'une commande', async () => {
      // Créer et confirmer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send({
          supplierId: 1,
          reference: 'PO-001',
          items: [
            {
              articleId: 1,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const orderId = createResponse.body.id;

      await request(app)
        .put(`/api/purchase-orders/${orderId}/confirm`)
        .send({
          confirmedBy: 1
        });

      // Enregistrer la réception
      const response = await request(app)
        .put(`/api/purchase-orders/${orderId}/receive`)
        .send({
          receivedBy: 1,
          receivedDate: new Date().toISOString(),
          receivedItems: [
            {
              articleId: 1,
              quantity: 1000,
              lotNumber: 'LOT-001',
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        })
        .expect(200);

      expect(response.body.status).toBe('received');
      expect(response.body.receivedAt).toBeDefined();
      expect(response.body.receivedBy).toBe(1);
    });

    it('devrait échouer si la commande n\'est pas confirmée', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send({
          supplierId: 1,
          reference: 'PO-001',
          items: [
            {
              articleId: 1,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const orderId = createResponse.body.id;

      // Tentative de réception sans confirmation devrait échouer
      await request(app)
        .put(`/api/purchase-orders/${orderId}/receive`)
        .send({
          receivedBy: 1,
          receivedItems: [
            {
              articleId: 1,
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
        .send({
          supplierId: 1,
          reference: 'PO-001',
          items: [
            {
              articleId: 1,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const orderId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/purchase-orders/${orderId}/cancel`)
        .send({
          cancelledBy: 1,
          reason: 'Fournisseur indisponible'
        })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
      expect(response.body.cancelledAt).toBeDefined();
      expect(response.body.cancelledBy).toBe(1);
      expect(response.body.cancellationReason).toBe('Fournisseur indisponible');
    });
  });

  describe('DELETE /api/purchase-orders/:id', () => {
    it('devrait supprimer une commande d\'achat existante', async () => {
      // Créer une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send({
          supplierId: 1,
          reference: 'PO-001',
          items: [
            {
              articleId: 1,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const orderId = createResponse.body.id;

      await request(app)
        .delete(`/api/purchase-orders/${orderId}`)
        .expect(204);

      // Vérifier que la commande a été supprimée
      await request(app)
        .get(`/api/purchase-orders/${orderId}`)
        .expect(404);
    });

    it('devrait échouer si la commande est déjà reçue', async () => {
      // Créer, confirmer et recevoir une commande d'achat
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send({
          supplierId: 1,
          reference: 'PO-001',
          items: [
            {
              articleId: 1,
              quantity: 1000,
              unitPrice: 2.50,
              totalPrice: 2500.00
            }
          ]
        });

      const orderId = createResponse.body.id;

      await request(app)
        .put(`/api/purchase-orders/${orderId}/confirm`)
        .send({
          confirmedBy: 1
        });

      await request(app)
        .put(`/api/purchase-orders/${orderId}/receive`)
        .send({
          receivedBy: 1,
          receivedItems: [
            {
              articleId: 1,
              quantity: 1000,
              lotNumber: 'LOT-001'
            }
          ]
        });

      // Tentative de suppression devrait échouer
      await request(app)
        .delete(`/api/purchase-orders/${orderId}`)
        .expect(400);
    });
  });

  describe('GET /api/purchase-orders/statistics', () => {
    it('devrait récupérer les statistiques des commandes d\'achat', async () => {
      const response = await request(app)
        .get('/api/purchase-orders/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('pending');
      expect(response.body).toHaveProperty('confirmed');
      expect(response.body).toHaveProperty('received');
      expect(response.body).toHaveProperty('cancelled');
      expect(response.body).toHaveProperty('totalAmount');
    });
  });

  describe('GET /api/purchase-orders/supplier/:supplierId', () => {
    it('devrait récupérer les commandes d\'achat d\'un fournisseur', async () => {
      const response = await request(app)
        .get('/api/purchase-orders/supplier/1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
