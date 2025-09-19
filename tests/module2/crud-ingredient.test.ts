import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../helpers/test-app';
import { createTestUser, createTestCategory, testData } from '../setup';

describe('Module 2: CRUD Ingrédient', () => {
  let app: any;
  let authToken: string;
  let userId: number;
  let categoryId: number;

  beforeEach(async () => {
    app = await createApp();
    
    // Créer un utilisateur de test
    const user = await createTestUser();
    userId = user.id;
    
    // Créer une catégorie de test pour ingrédients
    const category = await createTestCategory();
    categoryId = category.id;
    
    // Simuler l'authentification
    authToken = 'test-token';
  });

  describe('POST /api/articles', () => {
    it('devrait créer un nouvel ingrédient avec succès', async () => {
      const ingredientData = {
        designation: 'Farine T55',
        description: 'Farine de blé type 55',
        categoryId: categoryId,
        unitId: 1,
        type: 'ingredient',
        forSale: false,
        trackStock: true,
        minStock: 50,
        maxStock: 500,
        costPrice: 2.50,
        perishable: true,
        shelfLife: 365 // jours
      };

      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ingredientData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.designation).toBe(ingredientData.designation);
      expect(response.body.type).toBe('ingredient');
      expect(response.body.forSale).toBe(false);
      expect(response.body.trackStock).toBe(true);
      expect(response.body.perishable).toBe(true);
    });

    it('devrait créer un ingrédient non périssable', async () => {
      const ingredientData = {
        designation: 'Sel',
        description: 'Sel de cuisine',
        categoryId: categoryId,
        unitId: 1,
        type: 'ingredient',
        forSale: false,
        trackStock: true,
        costPrice: 1.00,
        perishable: false
      };

      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ingredientData)
        .expect(201);

      expect(response.body.perishable).toBe(false);
      expect(response.body.shelfLife).toBeNull();
    });

    it('devrait échouer si les données requises sont manquantes', async () => {
      const invalidData = {
        designation: 'Ingrédient Test'
        // Manque categoryId, type, etc.
      };

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/articles', () => {
    it('devrait récupérer la liste des ingrédients', async () => {
      // Créer quelques ingrédients de test
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Farine',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Sucre',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false
        });

      const response = await request(app)
        .get('/api/articles?type=ingredient')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((item: any) => item.type === 'ingredient')).toBe(true);
    });

    it('devrait filtrer les ingrédients périssables', async () => {
      // Créer un ingrédient périssable
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Lait',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false,
          perishable: true,
          shelfLife: 7
        });

      // Créer un ingrédient non périssable
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Sel',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false,
          perishable: false
        });

      const response = await request(app)
        .get('/api/articles?type=ingredient&perishable=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.every((item: any) => item.perishable === true)).toBe(true);
    });
  });

  describe('GET /api/articles/:id', () => {
    it('devrait récupérer un ingrédient spécifique', async () => {
      // Créer un ingrédient
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Beurre',
          description: 'Beurre doux',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false,
          perishable: true,
          shelfLife: 30
        });

      const ingredientId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/articles/${ingredientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(ingredientId);
      expect(response.body.designation).toBe('Beurre');
      expect(response.body.perishable).toBe(true);
      expect(response.body.shelfLife).toBe(30);
    });
  });

  describe('PUT /api/articles/:id', () => {
    it('devrait mettre à jour un ingrédient existant', async () => {
      // Créer un ingrédient
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Oeufs',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false,
          perishable: true,
          shelfLife: 21
        });

      const ingredientId = createResponse.body.id;

      const updateData = {
        designation: 'Oeufs Bio',
        description: 'Oeufs biologiques',
        costPrice: 0.50,
        shelfLife: 28
      };

      const response = await request(app)
        .put(`/api/articles/${ingredientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.designation).toBe('Oeufs Bio');
      expect(response.body.description).toBe('Oeufs biologiques');
      expect(response.body.costPrice).toBe('0.50');
      expect(response.body.shelfLife).toBe(28);
    });

    it('devrait changer un ingrédient de périssable à non-périssable', async () => {
      // Créer un ingrédient périssable
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Ingrédient Test',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false,
          perishable: true,
          shelfLife: 30
        });

      const ingredientId = createResponse.body.id;

      const updateData = {
        perishable: false,
        shelfLife: null
      };

      const response = await request(app)
        .put(`/api/articles/${ingredientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.perishable).toBe(false);
      expect(response.body.shelfLife).toBeNull();
    });
  });

  describe('DELETE /api/articles/:id', () => {
    it('devrait supprimer un ingrédient existant', async () => {
      // Créer un ingrédient
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Ingrédient à Supprimer',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false
        });

      const ingredientId = createResponse.body.id;

      await request(app)
        .delete(`/api/articles/${ingredientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Vérifier que l'ingrédient a été supprimé
      await request(app)
        .get(`/api/articles/${ingredientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('devrait échouer si l\'ingrédient est utilisé dans des recettes', async () => {
      // Créer un ingrédient
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Ingrédient avec Recettes',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false
        });

      const ingredientId = createResponse.body.id;

      // Créer une recette avec cet ingrédient
      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette Test',
          description: 'Recette de test',
          ingredients: [{
            articleId: ingredientId,
            quantity: 100,
            unitId: 1
          }]
        });

      // Tentative de suppression devrait échouer
      await request(app)
        .delete(`/api/articles/${ingredientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/articles/:id/stock', () => {
    it('devrait récupérer le stock d\'un ingrédient', async () => {
      // Créer un ingrédient avec suivi de stock
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Ingrédient avec Stock',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false,
          trackStock: true
        });

      const ingredientId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/articles/${ingredientId}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('articleId', ingredientId);
      expect(response.body).toHaveProperty('totalQuantity');
      expect(response.body).toHaveProperty('reservedQuantity');
      expect(response.body).toHaveProperty('availableQuantity');
    });
  });

  describe('GET /api/articles/expiring', () => {
    it('devrait récupérer les ingrédients qui expirent bientôt', async () => {
      // Créer un ingrédient périssable
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designation: 'Ingrédient Périssable',
          categoryId: categoryId,
          type: 'ingredient',
          forSale: false,
          perishable: true,
          shelfLife: 7
        });

      const response = await request(app)
        .get('/api/articles/expiring?days=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
