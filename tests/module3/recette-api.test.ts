import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import express from 'express';

// Simuler l'API des recettes
const createRecipeAPI = () => {
  const app = express();
  app.use(express.json());
  
  let recipes: any[] = [];
  let nextId = 1;

  // GET /api/recipes - Récupérer toutes les recettes
  app.get('/api/recipes', (req, res) => {
    const { productId, difficulty } = req.query;
    let filteredRecipes = recipes;
    
    if (productId) {
      filteredRecipes = filteredRecipes.filter(r => r.productId === parseInt(productId as string));
    }
    if (difficulty) {
      filteredRecipes = filteredRecipes.filter(r => r.difficulty === difficulty);
    }
    
    res.json(filteredRecipes);
  });

  // GET /api/recipes/:id - Récupérer une recette spécifique
  app.get('/api/recipes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const recipe = recipes.find(r => r.id === id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recette non trouvée' });
    }
    
    res.json(recipe);
  });

  // POST /api/recipes - Créer une nouvelle recette
  app.post('/api/recipes', (req, res) => {
    const { name, productId, yield: recipeYield, preparationTime, cookingTime, difficulty, ingredients, operations } = req.body;
    
    if (!name || !productId || !ingredients || !operations) {
      return res.status(400).json({ message: 'Données requises manquantes' });
    }
    
    const newRecipe = {
      id: nextId++,
      name,
      productId,
      yield: recipeYield || 1,
      preparationTime: preparationTime || 0,
      cookingTime: cookingTime || 0,
      difficulty: difficulty || 'facile',
      ingredients,
      operations,
      createdAt: new Date().toISOString()
    };
    
    recipes.push(newRecipe);
    res.status(201).json(newRecipe);
  });

  // PUT /api/recipes/:id - Mettre à jour une recette
  app.put('/api/recipes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const recipeIndex = recipes.findIndex(r => r.id === id);
    
    if (recipeIndex === -1) {
      return res.status(404).json({ message: 'Recette non trouvée' });
    }
    
    recipes[recipeIndex] = { ...recipes[recipeIndex], ...req.body };
    res.json(recipes[recipeIndex]);
  });

  // DELETE /api/recipes/:id - Supprimer une recette
  app.delete('/api/recipes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const recipeIndex = recipes.findIndex(r => r.id === id);
    
    if (recipeIndex === -1) {
      return res.status(404).json({ message: 'Recette non trouvée' });
    }
    
    recipes.splice(recipeIndex, 1);
    res.status(204).send();
  });

  // GET /api/recipes/:id/ingredients - Récupérer les ingrédients d'une recette
  app.get('/api/recipes/:id/ingredients', (req, res) => {
    const id = parseInt(req.params.id);
    const recipe = recipes.find(r => r.id === id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recette non trouvée' });
    }
    
    res.json(recipe.ingredients);
  });

  // GET /api/recipes/:id/operations - Récupérer les opérations d'une recette
  app.get('/api/recipes/:id/operations', (req, res) => {
    const id = parseInt(req.params.id);
    const recipe = recipes.find(r => r.id === id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recette non trouvée' });
    }
    
    res.json(recipe.operations);
  });

  // POST /api/recipes/:id/duplicate - Dupliquer une recette
  app.post('/api/recipes/:id/duplicate', (req, res) => {
    const id = parseInt(req.params.id);
    const recipe = recipes.find(r => r.id === id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recette non trouvée' });
    }
    
    const { name } = req.body;
    const duplicatedRecipe = {
      ...recipe,
      id: nextId++,
      name: name || `${recipe.name} (Copie)`,
      createdAt: new Date().toISOString()
    };
    
    recipes.push(duplicatedRecipe);
    res.status(201).json(duplicatedRecipe);
  });

  return app;
};

describe('Module 3: CRUD Recette - Tests API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createRecipeAPI();
  });

  describe('POST /api/recipes', () => {
    it('devrait créer une nouvelle recette avec succès', async () => {
      const recipeData = {
        name: 'Gâteau au Chocolat',
        productId: 1,
        yield: 8,
        preparationTime: 30,
        cookingTime: 45,
        difficulty: 'moyen',
        ingredients: [
          {
            articleId: 1,
            quantity: 200,
            unitId: 1
          },
          {
            articleId: 2,
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
        .send(recipeData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(recipeData.name);
      expect(response.body.productId).toBe(1);
      expect(response.body.yield).toBe(8);
      expect(response.body.ingredients).toHaveLength(2);
      expect(response.body.operations).toHaveLength(2);
    });

    it('devrait échouer si les données requises sont manquantes', async () => {
      const invalidData = {
        name: 'Recette Test'
        // Manque productId, ingredients, operations
      };

      await request(app)
        .post('/api/recipes')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/recipes', () => {
    it('devrait récupérer la liste des recettes', async () => {
      // Créer quelques recettes de test
      await request(app)
        .post('/api/recipes')
        .send({
          name: 'Recette 1',
          productId: 1,
          ingredients: [],
          operations: []
        });

      await request(app)
        .post('/api/recipes')
        .send({
          name: 'Recette 2',
          productId: 1,
          ingredients: [],
          operations: []
        });

      const response = await request(app)
        .get('/api/recipes')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait filtrer les recettes par produit', async () => {
      const response = await request(app)
        .get('/api/recipes?productId=1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait filtrer les recettes par difficulté', async () => {
      // Créer une recette facile
      await request(app)
        .post('/api/recipes')
        .send({
          name: 'Recette Facile',
          productId: 1,
          difficulty: 'facile',
          ingredients: [],
          operations: []
        });

      const response = await request(app)
        .get('/api/recipes?difficulty=facile')
        .expect(200);

      expect(response.body.every((recipe: any) => recipe.difficulty === 'facile')).toBe(true);
    });
  });

  describe('GET /api/recipes/:id', () => {
    it('devrait récupérer une recette spécifique', async () => {
      // Créer une recette
      const createResponse = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Recette Test',
          productId: 1,
          ingredients: [
            {
              articleId: 1,
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
        .expect(200);

      expect(response.body.id).toBe(recipeId);
      expect(response.body.name).toBe('Recette Test');
      expect(response.body.ingredients).toHaveLength(1);
      expect(response.body.operations).toHaveLength(1);
    });

    it('devrait retourner 404 si la recette n\'existe pas', async () => {
      await request(app)
        .get('/api/recipes/99999')
        .expect(404);
    });
  });

  describe('PUT /api/recipes/:id', () => {
    it('devrait mettre à jour une recette existante', async () => {
      // Créer une recette
      const createResponse = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Recette Originale',
          productId: 1,
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
        .send({
          name: 'Recette Test',
          productId: 1,
          ingredients: [
            {
              articleId: 1,
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
            articleId: 1,
            quantity: 150, // Quantité modifiée
            unitId: 1
          },
          {
            articleId: 2, // Nouvel ingrédient
            quantity: 75,
            unitId: 1
          }
        ]
      };

      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.ingredients).toHaveLength(2);
      expect(response.body.ingredients[0].quantity).toBe(150);
      expect(response.body.ingredients[1].articleId).toBe(2);
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    it('devrait supprimer une recette existante', async () => {
      // Créer une recette
      const createResponse = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Recette à Supprimer',
          productId: 1,
          ingredients: [],
          operations: []
        });

      const recipeId = createResponse.body.id;

      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .expect(204);

      // Vérifier que la recette a été supprimée
      await request(app)
        .get(`/api/recipes/${recipeId}`)
        .expect(404);
    });
  });

  describe('GET /api/recipes/:id/ingredients', () => {
    it('devrait récupérer les ingrédients d\'une recette', async () => {
      // Créer une recette avec ingrédients
      const createResponse = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Recette avec Ingrédients',
          productId: 1,
          ingredients: [
            {
              articleId: 1,
              quantity: 200,
              unitId: 1
            },
            {
              articleId: 2,
              quantity: 100,
              unitId: 1
            }
          ],
          operations: []
        });

      const recipeId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/recipes/${recipeId}/ingredients`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('articleId');
      expect(response.body[0]).toHaveProperty('quantity');
    });
  });

  describe('POST /api/recipes/:id/duplicate', () => {
    it('devrait dupliquer une recette existante', async () => {
      // Créer une recette
      const createResponse = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Recette Originale',
          productId: 1,
          ingredients: [
            {
              articleId: 1,
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
        .send(duplicateData)
        .expect(201);

      expect(response.body.name).toBe('Recette Dupliquée');
      expect(response.body.productId).toBe(1);
      expect(response.body.ingredients).toHaveLength(1);
      expect(response.body.operations).toHaveLength(1);
      expect(response.body.id).not.toBe(recipeId);
    });
  });
});
