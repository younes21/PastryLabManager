import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../helpers/test-app';
import { createTestUser, createTestCategory, testData } from '../setup';

describe('Module 5: Réservation Stock de Préparation', () => {
  let app: any;
  let authToken: string;
  let userId: number;
  let categoryId: number;
  let ingredient1Id: number;
  let ingredient2Id: number;
  let productId: number;
  let recipeId: number;
  let preparationId: number;

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
        trackStock: true
      });
    ingredient1Id = ingredient1.body.id;

    const ingredient2 = await request(app)
      .post('/api/articles')
      .send({
        designation: 'Sucre',
        categoryId: categoryId,
        type: 'ingredient',
        forSale: false,
        trackStock: true
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
        trackStock: true
      });
    productId = product.body.id;

    // Créer une recette de test
    const recipe = await request(app)
      .post('/api/recipes')
      .send({
        name: 'Gâteau au Chocolat',
        productId: productId,
        yield: 8,
        ingredients: [
          {
            articleId: ingredient1Id,
            quantity: 200,
            unitId: 1
          },
          {
            articleId: ingredient2Id,
            quantity: 150,
            unitId: 1
          }
        ],
        operations: []
      });
    recipeId = recipe.body.id;

    // Créer une préparation de test
    const preparation = await request(app)
      .post('/api/preparations')
      .send({
        recipeId: recipeId,
        quantity: 2,
        plannedDate: new Date().toISOString()
      });
    preparationId = preparation.body.id;
    
    // Simuler l'authentification
    authToken = 'test-token';
  });

  describe('POST /api/stock-reservations', () => {
    it('devrait créer une réservation de stock avec succès', async () => {
      const reservationData = {
        preparationId: preparationId,
        articleId: ingredient1Id,
        quantity: 400, // 2 gâteaux * 200g de farine
        unitId: 1,
        reservedBy: userId,
        notes: 'Réservation pour préparation gâteau'
      };

      const response = await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reservationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.preparationId).toBe(preparationId);
      expect(response.body.articleId).toBe(ingredient1Id);
      expect(response.body.quantity).toBe(400);
      expect(response.body.status).toBe('active');
    });

    it('devrait échouer si la préparation n\'existe pas', async () => {
      const reservationData = {
        preparationId: 99999, // ID inexistant
        articleId: ingredient1Id,
        quantity: 400,
        unitId: 1,
        reservedBy: userId
      };

      await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reservationData)
        .expect(400);
    });

    it('devrait échouer si l\'article n\'existe pas', async () => {
      const reservationData = {
        preparationId: preparationId,
        articleId: 99999, // ID inexistant
        quantity: 400,
        unitId: 1,
        reservedBy: userId
      };

      await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reservationData)
        .expect(400);
    });

    it('devrait échouer si la quantité est invalide', async () => {
      const reservationData = {
        preparationId: preparationId,
        articleId: ingredient1Id,
        quantity: 0, // Quantité invalide
        unitId: 1,
        reservedBy: userId
      };

      await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reservationData)
        .expect(400);
    });
  });

  describe('GET /api/stock-reservations', () => {
    it('devrait récupérer la liste des réservations', async () => {
      // Créer quelques réservations de test
      await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preparationId: preparationId,
          articleId: ingredient1Id,
          quantity: 400,
          unitId: 1,
          reservedBy: userId
        });

      await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preparationId: preparationId,
          articleId: ingredient2Id,
          quantity: 300,
          unitId: 1,
          reservedBy: userId
        });

      const response = await request(app)
        .get('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait filtrer les réservations par statut', async () => {
      const response = await request(app)
        .get('/api/stock-reservations?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait filtrer les réservations par préparation', async () => {
      const response = await request(app)
        .get(`/api/stock-reservations?preparationId=${preparationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait filtrer les réservations par article', async () => {
      const response = await request(app)
        .get(`/api/stock-reservations?articleId=${ingredient1Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/stock-reservations/:id', () => {
    it('devrait récupérer une réservation spécifique', async () => {
      // Créer une réservation
      const createResponse = await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preparationId: preparationId,
          articleId: ingredient1Id,
          quantity: 400,
          unitId: 1,
          reservedBy: userId,
          notes: 'Réservation de test'
        });

      const reservationId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/stock-reservations/${reservationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(reservationId);
      expect(response.body.preparationId).toBe(preparationId);
      expect(response.body.articleId).toBe(ingredient1Id);
      expect(response.body.notes).toBe('Réservation de test');
    });

    it('devrait retourner 404 si la réservation n\'existe pas', async () => {
      await request(app)
        .get('/api/stock-reservations/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/stock-reservations/:id', () => {
    it('devrait mettre à jour une réservation existante', async () => {
      // Créer une réservation
      const createResponse = await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preparationId: preparationId,
          articleId: ingredient1Id,
          quantity: 400,
          unitId: 1,
          reservedBy: userId
        });

      const reservationId = createResponse.body.id;

      const updateData = {
        quantity: 500, // Augmenter la quantité
        notes: 'Quantité ajustée'
      };

      const response = await request(app)
        .put(`/api/stock-reservations/${reservationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.quantity).toBe(500);
      expect(response.body.notes).toBe('Quantité ajustée');
    });

    it('devrait échouer si la réservation n\'existe pas', async () => {
      const updateData = {
        quantity: 500
      };

      await request(app)
        .put('/api/stock-reservations/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('PUT /api/stock-reservations/:id/confirm', () => {
    it('devrait confirmer une réservation', async () => {
      // Créer une réservation
      const createResponse = await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preparationId: preparationId,
          articleId: ingredient1Id,
          quantity: 400,
          unitId: 1,
          reservedBy: userId
        });

      const reservationId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/stock-reservations/${reservationId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmedBy: userId,
          actualQuantity: 400
        })
        .expect(200);

      expect(response.body.status).toBe('confirmed');
      expect(response.body.confirmedAt).toBeDefined();
      expect(response.body.confirmedBy).toBe(userId);
    });

    it('devrait échouer si la réservation n\'est pas active', async () => {
      // Créer une réservation
      const createResponse = await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preparationId: preparationId,
          articleId: ingredient1Id,
          quantity: 400,
          unitId: 1,
          reservedBy: userId
        });

      const reservationId = createResponse.body.id;

      // Confirmer la réservation
      await request(app)
        .put(`/api/stock-reservations/${reservationId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmedBy: userId,
          actualQuantity: 400
        });

      // Tentative de reconfirmation devrait échouer
      await request(app)
        .put(`/api/stock-reservations/${reservationId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmedBy: userId,
          actualQuantity: 400
        })
        .expect(400);
    });
  });

  describe('PUT /api/stock-reservations/:id/cancel', () => {
    it('devrait annuler une réservation', async () => {
      // Créer une réservation
      const createResponse = await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preparationId: preparationId,
          articleId: ingredient1Id,
          quantity: 400,
          unitId: 1,
          reservedBy: userId
        });

      const reservationId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/stock-reservations/${reservationId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cancelledBy: userId,
          reason: 'Préparation annulée'
        })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
      expect(response.body.cancelledAt).toBeDefined();
      expect(response.body.cancelledBy).toBe(userId);
      expect(response.body.cancellationReason).toBe('Préparation annulée');
    });
  });

  describe('DELETE /api/stock-reservations/:id', () => {
    it('devrait supprimer une réservation existante', async () => {
      // Créer une réservation
      const createResponse = await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preparationId: preparationId,
          articleId: ingredient1Id,
          quantity: 400,
          unitId: 1,
          reservedBy: userId
        });

      const reservationId = createResponse.body.id;

      await request(app)
        .delete(`/api/stock-reservations/${reservationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Vérifier que la réservation a été supprimée
      await request(app)
        .get(`/api/stock-reservations/${reservationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('devrait échouer si la réservation n\'existe pas', async () => {
      await request(app)
        .delete('/api/stock-reservations/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/stock-reservations/preparation/:preparationId', () => {
    it('devrait récupérer toutes les réservations d\'une préparation', async () => {
      // Créer des réservations pour la préparation
      await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preparationId: preparationId,
          articleId: ingredient1Id,
          quantity: 400,
          unitId: 1,
          reservedBy: userId
        });

      await request(app)
        .post('/api/stock-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preparationId: preparationId,
          articleId: ingredient2Id,
          quantity: 300,
          unitId: 1,
          reservedBy: userId
        });

      const response = await request(app)
        .get(`/api/stock-reservations/preparation/${preparationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body.every((reservation: any) => reservation.preparationId === preparationId)).toBe(true);
    });
  });

  describe('GET /api/stock-reservations/availability', () => {
    it('devrait vérifier la disponibilité du stock', async () => {
      const response = await request(app)
        .get(`/api/stock-reservations/availability?articleId=${ingredient1Id}&quantity=400`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('available');
      expect(response.body).toHaveProperty('currentStock');
      expect(response.body).toHaveProperty('reservedQuantity');
      expect(response.body).toHaveProperty('availableQuantity');
    });

    it('devrait vérifier la disponibilité pour plusieurs articles', async () => {
      const articles = [
        { articleId: ingredient1Id, quantity: 400 },
        { articleId: ingredient2Id, quantity: 300 }
      ];

      const response = await request(app)
        .post('/api/stock-reservations/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ articles })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('articleId');
      expect(response.body[0]).toHaveProperty('available');
    });
  });

  describe('POST /api/stock-reservations/bulk', () => {
    it('devrait créer plusieurs réservations en lot', async () => {
      const reservations = [
        {
          preparationId: preparationId,
          articleId: ingredient1Id,
          quantity: 400,
          unitId: 1,
          reservedBy: userId
        },
        {
          preparationId: preparationId,
          articleId: ingredient2Id,
          quantity: 300,
          unitId: 1,
          reservedBy: userId
        }
      ];

      const response = await request(app)
        .post('/api/stock-reservations/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reservations })
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[1]).toHaveProperty('id');
    });

    it('devrait échouer si une des réservations est invalide', async () => {
      const reservations = [
        {
          preparationId: preparationId,
          articleId: ingredient1Id,
          quantity: 400,
          unitId: 1,
          reservedBy: userId
        },
        {
          preparationId: 99999, // ID inexistant
          articleId: ingredient2Id,
          quantity: 300,
          unitId: 1,
          reservedBy: userId
        }
      ];

      await request(app)
        .post('/api/stock-reservations/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reservations })
        .expect(400);
    });
  });
});
