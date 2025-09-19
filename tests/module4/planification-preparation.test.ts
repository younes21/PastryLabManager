import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../helpers/test-app';
import { createTestUser, createTestCategory, testData } from '../setup';

describe('Module 4: Planification et Lancement des Préparations', () => {
  let app: any;
  let authToken: string;
  let userId: number;
  let categoryId: number;
  let ingredient1Id: number;
  let ingredient2Id: number;
  let productId: number;
  let recipeId: number;

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
        preparationTime: 30,
        cookingTime: 45,
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
        operations: [
          {
            step: 1,
            description: 'Mélanger la farine et le sucre',
            duration: 5,
            workstationId: 1
          },
          {
            step: 2,
            description: 'Cuire au four à 180°C',
            duration: 45,
            workstationId: 2
          }
        ]
      });
    recipeId = recipe.body.id;
    
    // Simuler l'authentification
    authToken = 'test-token';
  });

  describe('POST /api/preparations', () => {
    it('devrait créer une nouvelle préparation avec succès', async () => {
      const preparationData = {
        recipeId: recipeId,
        quantity: 2, // 2 gâteaux
        plannedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
        priority: 'normal',
        notes: 'Préparation pour commande client'
      };

      const response = await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preparationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.recipeId).toBe(recipeId);
      expect(response.body.quantity).toBe(2);
      expect(response.body.status).toBe('planned');
      expect(response.body.priority).toBe('normal');
    });

    it('devrait créer une préparation urgente', async () => {
      const preparationData = {
        recipeId: recipeId,
        quantity: 1,
        plannedDate: new Date().toISOString(), // Aujourd'hui
        priority: 'urgent',
        notes: 'Commande urgente'
      };

      const response = await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preparationData)
        .expect(201);

      expect(response.body.priority).toBe('urgent');
      expect(response.body.status).toBe('planned');
    });

    it('devrait échouer si la recette n\'existe pas', async () => {
      const preparationData = {
        recipeId: 99999, // ID inexistant
        quantity: 1,
        plannedDate: new Date().toISOString()
      };

      await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preparationData)
        .expect(400);
    });

    it('devrait échouer si la quantité est invalide', async () => {
      const preparationData = {
        recipeId: recipeId,
        quantity: 0, // Quantité invalide
        plannedDate: new Date().toISOString()
      };

      await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preparationData)
        .expect(400);
    });
  });

  describe('GET /api/preparations', () => {
    it('devrait récupérer la liste des préparations', async () => {
      // Créer quelques préparations de test
      await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId: recipeId,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId: recipeId,
          quantity: 2,
          plannedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      const response = await request(app)
        .get('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait filtrer les préparations par statut', async () => {
      const response = await request(app)
        .get('/api/preparations?status=planned')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait filtrer les préparations par date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/preparations?date=${today}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait filtrer les préparations par priorité', async () => {
      const response = await request(app)
        .get('/api/preparations?priority=urgent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/preparations/:id', () => {
    it('devrait récupérer une préparation spécifique', async () => {
      // Créer une préparation
      const createResponse = await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId: recipeId,
          quantity: 1,
          plannedDate: new Date().toISOString(),
          notes: 'Préparation de test'
        });

      const preparationId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/preparations/${preparationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(preparationId);
      expect(response.body.recipeId).toBe(recipeId);
      expect(response.body.notes).toBe('Préparation de test');
    });

    it('devrait retourner 404 si la préparation n\'existe pas', async () => {
      await request(app)
        .get('/api/preparations/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/preparations/:id/start', () => {
    it('devrait démarrer une préparation', async () => {
      // Créer une préparation
      const createResponse = await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId: recipeId,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      const preparationId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/preparations/${preparationId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startedBy: userId,
          workstationId: 1
        })
        .expect(200);

      expect(response.body.status).toBe('in_progress');
      expect(response.body.startedAt).toBeDefined();
      expect(response.body.startedBy).toBe(userId);
    });

    it('devrait échouer si la préparation n\'est pas en statut "planned"', async () => {
      // Créer une préparation
      const createResponse = await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId: recipeId,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      const preparationId = createResponse.body.id;

      // Démarrer la préparation
      await request(app)
        .put(`/api/preparations/${preparationId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startedBy: userId,
          workstationId: 1
        });

      // Tentative de redémarrer devrait échouer
      await request(app)
        .put(`/api/preparations/${preparationId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startedBy: userId,
          workstationId: 1
        })
        .expect(400);
    });
  });

  describe('PUT /api/preparations/:id/complete', () => {
    it('devrait compléter une préparation', async () => {
      // Créer et démarrer une préparation
      const createResponse = await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId: recipeId,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      const preparationId = createResponse.body.id;

      // Démarrer la préparation
      await request(app)
        .put(`/api/preparations/${preparationId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startedBy: userId,
          workstationId: 1
        });

      // Compléter la préparation
      const response = await request(app)
        .put(`/api/preparations/${preparationId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completedBy: userId,
          actualQuantity: 1,
          notes: 'Préparation terminée avec succès'
        })
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.completedAt).toBeDefined();
      expect(response.body.completedBy).toBe(userId);
      expect(response.body.actualQuantity).toBe(1);
    });

    it('devrait échouer si la préparation n\'est pas en cours', async () => {
      // Créer une préparation
      const createResponse = await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId: recipeId,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      const preparationId = createResponse.body.id;

      // Tentative de complétion sans démarrage devrait échouer
      await request(app)
        .put(`/api/preparations/${preparationId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completedBy: userId,
          actualQuantity: 1
        })
        .expect(400);
    });
  });

  describe('PUT /api/preparations/:id/cancel', () => {
    it('devrait annuler une préparation planifiée', async () => {
      // Créer une préparation
      const createResponse = await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId: recipeId,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      const preparationId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/preparations/${preparationId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Commande annulée par le client'
        })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
      expect(response.body.cancelledAt).toBeDefined();
      expect(response.body.cancellationReason).toBe('Commande annulée par le client');
    });

    it('devrait annuler une préparation en cours', async () => {
      // Créer et démarrer une préparation
      const createResponse = await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId: recipeId,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      const preparationId = createResponse.body.id;

      // Démarrer la préparation
      await request(app)
        .put(`/api/preparations/${preparationId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startedBy: userId,
          workstationId: 1
        });

      // Annuler la préparation
      const response = await request(app)
        .put(`/api/preparations/${preparationId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Problème technique'
        })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
    });
  });

  describe('GET /api/preparations/schedule', () => {
    it('devrait récupérer le planning des préparations', async () => {
      const response = await request(app)
        .get('/api/preparations/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait récupérer le planning pour une date spécifique', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/preparations/schedule?date=${today}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait récupérer le planning pour une période', async () => {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/preparations/schedule?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/preparations/statistics', () => {
    it('devrait récupérer les statistiques des préparations', async () => {
      const response = await request(app)
        .get('/api/preparations/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('planned');
      expect(response.body).toHaveProperty('inProgress');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('cancelled');
    });

    it('devrait récupérer les statistiques pour une période', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/preparations/statistics?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('completed');
    });
  });
});
