import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../helpers/test-app';
import { createTestUser, createTestCategory, testData } from '../setup';

describe('Module 3: CRUD Recette', () => {
  let app: any;
  let authToken: string;
  let userId: number;
  let categoryId: number;
  let ingredient1Id: number;
  let ingredient2Id: number;
  let productId: number;

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
    
    // Simuler l'authentification
    authToken = 'test-token';
  });

  describe('POST /api/recipes', () => {
    it('devrait créer une nouvelle recette avec succès', async () => {
      const recipeData = {
        name: 'Gâteau au Chocolat',
        description: 'Recette de gâteau au chocolat traditionnel',
        productId: productId,
        yield: 8, // portions
        preparationTime: 30, // minutes
        cookingTime: 45, // minutes
        difficulty: 'moyen',
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
      };

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recipeData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(recipeData.name);
      expect(response.body.productId).toBe(productId);
      expect(response.body.yield).toBe(8);
      expect(response.body.ingredients).toHaveLength(2);
      expect(response.body.operations).toHaveLength(2);
    });

    it('devrait échouer si les données requises sont manquantes', async () => {
      const invalidData = {
        name: 'Recette Test'
        // Manque productId, ingredients, etc.
      };

      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('devrait échouer si le produit n\'existe pas', async () => {
      const recipeData = {
        name: 'Recette Test',
        productId: 99999, // ID inexistant
        ingredients: [],
        operations: []
      };

      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recipeData)
        .expect(400);
    });

    it('devrait échouer si un ingrédient n\'existe pas', async () => {
      const recipeData = {
        name: 'Recette Test',
        productId: productId,
        ingredients: [
          {
            articleId: 99999, // ID inexistant
            quantity: 100,
            unitId: 1
          }
        ],
        operations: []
      };

      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recipeData)
        .expect(400);
    });
  });

  describe('GET /api/recipes', () => {
    it('devrait récupérer la liste des recettes', async () => {
      // Créer quelques recettes de test
      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette 1',
          productId: productId,
          ingredients: [],
          operations: []
        });

      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette 2',
          productId: productId,
          ingredients: [],
          operations: []
        });

      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait filtrer les recettes par produit', async () => {
      const response = await request(app)
        .get(`/api/recipes?productId=${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait filtrer les recettes par difficulté', async () => {
      // Créer une recette facile
      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette Facile',
          productId: productId,
          difficulty: 'facile',
          ingredients: [],
          operations: []
        });

      const response = await request(app)
        .get('/api/recipes?difficulty=facile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.every((recipe: any) => recipe.difficulty === 'facile')).toBe(true);
    });
  });

  describe('GET /api/recipes/:id', () => {
    it('devrait récupérer une recette spécifique', async () => {
      // Créer une recette
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette Test',
          productId: productId,
          ingredients: [
            {
              articleId: ingredient1Id,
              quantity: 100,
              unitId: 1
            }
          ],
          operations: [
            {
              step: 1,
              description: 'Étape 1',
              duration: 10,
              workstationId: 1
            }
          ]
        });

      const recipeId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(recipeId);
      expect(response.body.name).toBe('Recette Test');
      expect(response.body.ingredients).toHaveLength(1);
      expect(response.body.operations).toHaveLength(1);
    });

    it('devrait retourner 404 si la recette n\'existe pas', async () => {
      await request(app)
        .get('/api/recipes/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/recipes/:id', () => {
    it('devrait mettre à jour une recette existante', async () => {
      // Créer une recette
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette Originale',
          productId: productId,
          ingredients: [],
          operations: []
        });

      const recipeId = createResponse.body.id;

      const updateData = {
        name: 'Recette Modifiée',
        description: 'Nouvelle description',
        yield: 10,
        difficulty: 'difficile'
      };

      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Recette Modifiée');
      expect(response.body.description).toBe('Nouvelle description');
      expect(response.body.yield).toBe(10);
      expect(response.body.difficulty).toBe('difficile');
    });

    it('devrait mettre à jour les ingrédients d\'une recette', async () => {
      // Créer une recette
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette Test',
          productId: productId,
          ingredients: [
            {
              articleId: ingredient1Id,
              quantity: 100,
              unitId: 1
            }
          ],
          operations: []
        });

      const recipeId = createResponse.body.id;

      const updateData = {
        ingredients: [
          {
            articleId: ingredient1Id,
            quantity: 150, // Quantité modifiée
            unitId: 1
          },
          {
            articleId: ingredient2Id, // Nouvel ingrédient
            quantity: 75,
            unitId: 1
          }
        ]
      };

      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.ingredients).toHaveLength(2);
      expect(response.body.ingredients[0].quantity).toBe(150);
      expect(response.body.ingredients[1].articleId).toBe(ingredient2Id);
    });

    it('devrait échouer si la recette n\'existe pas', async () => {
      const updateData = {
        name: 'Recette Modifiée'
      };

      await request(app)
        .put('/api/recipes/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    it('devrait supprimer une recette existante', async () => {
      // Créer une recette
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette à Supprimer',
          productId: productId,
          ingredients: [],
          operations: []
        });

      const recipeId = createResponse.body.id;

      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Vérifier que la recette a été supprimée
      await request(app)
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('devrait échouer si la recette n\'existe pas', async () => {
      await request(app)
        .delete('/api/recipes/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('devrait échouer si la recette est utilisée dans des préparations', async () => {
      // Créer une recette
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette avec Préparations',
          productId: productId,
          ingredients: [],
          operations: []
        });

      const recipeId = createResponse.body.id;

      // Créer une préparation avec cette recette
      await request(app)
        .post('/api/preparations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipeId: recipeId,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      // Tentative de suppression devrait échouer
      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/recipes/:id/ingredients', () => {
    it('devrait récupérer les ingrédients d\'une recette', async () => {
      // Créer une recette avec ingrédients
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette avec Ingrédients',
          productId: productId,
          ingredients: [
            {
              articleId: ingredient1Id,
              quantity: 200,
              unitId: 1
            },
            {
              articleId: ingredient2Id,
              quantity: 100,
              unitId: 1
            }
          ],
          operations: []
        });

      const recipeId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/recipes/${recipeId}/ingredients`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('articleId');
      expect(response.body[0]).toHaveProperty('quantity');
    });
  });

  describe('GET /api/recipes/:id/operations', () => {
    it('devrait récupérer les opérations d\'une recette', async () => {
      // Créer une recette avec opérations
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette avec Opérations',
          productId: productId,
          ingredients: [],
          operations: [
            {
              step: 1,
              description: 'Mélanger',
              duration: 10,
              workstationId: 1
            },
            {
              step: 2,
              description: 'Cuire',
              duration: 30,
              workstationId: 2
            }
          ]
        });

      const recipeId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/recipes/${recipeId}/operations`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('step');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('duration');
    });
  });

  describe('POST /api/recipes/:id/duplicate', () => {
    it('devrait dupliquer une recette existante', async () => {
      // Créer une recette
      const createResponse = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recette Originale',
          productId: productId,
          ingredients: [
            {
              articleId: ingredient1Id,
              quantity: 100,
              unitId: 1
            }
          ],
          operations: [
            {
              step: 1,
              description: 'Étape 1',
              duration: 10,
              workstationId: 1
            }
          ]
        });

      const recipeId = createResponse.body.id;

      const duplicateData = {
        name: 'Recette Dupliquée'
      };

      const response = await request(app)
        .post(`/api/recipes/${recipeId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData)
        .expect(201);

      expect(response.body.name).toBe('Recette Dupliquée');
      expect(response.body.productId).toBe(productId);
      expect(response.body.ingredients).toHaveLength(1);
      expect(response.body.operations).toHaveLength(1);
      expect(response.body.id).not.toBe(recipeId);
    });
  });
});
