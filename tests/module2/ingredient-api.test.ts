import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import express from 'express';

// Simuler l'API des ingrédients
const createIngredientAPI = () => {
  const app = express();
  app.use(express.json());
  
  let ingredients: any[] = [];
  let nextId = 1;

  // GET /api/articles - Récupérer tous les ingrédients
  app.get('/api/articles', (req, res) => {
    const { type, perishable } = req.query;
    let filteredIngredients = ingredients;
    
    if (type) {
      filteredIngredients = filteredIngredients.filter(i => i.type === type);
    }
    if (perishable !== undefined) {
      filteredIngredients = filteredIngredients.filter(i => i.perishable === (perishable === 'true'));
    }
    
    res.json(filteredIngredients);
  });

  // GET /api/articles/expiring - Récupérer les ingrédients qui expirent bientôt
  app.get('/api/articles/expiring', (req, res) => {
    const { days } = req.query;
    const daysToExpiry = parseInt(days as string) || 30;
    
    const expiringIngredients = ingredients.filter(ingredient => {
      if (!ingredient.perishable || !ingredient.shelfLife) return false;
      // Simulation simple - en réalité on vérifierait les dates
      return ingredient.shelfLife <= daysToExpiry;
    });
    
    res.json(expiringIngredients);
  });

  // GET /api/articles/:id - Récupérer un ingrédient spécifique
  app.get('/api/articles/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const ingredient = ingredients.find(i => i.id === id);
    
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingrédient non trouvé' });
    }
    
    res.json(ingredient);
  });

  // POST /api/articles - Créer un nouvel ingrédient
  app.post('/api/articles', (req, res) => {
    const { designation, categoryId, type, forSale, trackStock, costPrice, perishable, shelfLife } = req.body;
    
    if (!designation || !categoryId || !type) {
      return res.status(400).json({ message: 'Données requises manquantes' });
    }
    
    const newIngredient = {
      id: nextId++,
      designation,
      categoryId,
      type,
      forSale: forSale || false,
      trackStock: trackStock || false,
      costPrice: costPrice || null,
      perishable: perishable || false,
      shelfLife: shelfLife || null,
      createdAt: new Date().toISOString()
    };
    
    ingredients.push(newIngredient);
    res.status(201).json(newIngredient);
  });

  // PUT /api/articles/:id - Mettre à jour un ingrédient
  app.put('/api/articles/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const ingredientIndex = ingredients.findIndex(i => i.id === id);
    
    if (ingredientIndex === -1) {
      return res.status(404).json({ message: 'Ingrédient non trouvé' });
    }
    
    ingredients[ingredientIndex] = { ...ingredients[ingredientIndex], ...req.body };
    res.json(ingredients[ingredientIndex]);
  });

  // DELETE /api/articles/:id - Supprimer un ingrédient
  app.delete('/api/articles/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const ingredientIndex = ingredients.findIndex(i => i.id === id);
    
    if (ingredientIndex === -1) {
      return res.status(404).json({ message: 'Ingrédient non trouvé' });
    }
    
    ingredients.splice(ingredientIndex, 1);
    res.status(204).send();
  });

  return app;
};

describe('Module 2: CRUD Ingrédient - Tests API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createIngredientAPI();
  });

  describe('POST /api/articles', () => {
    it('devrait créer un nouvel ingrédient avec succès', async () => {
      const ingredientData = {
        designation: 'Farine T55',
        categoryId: 1,
        type: 'ingredient',
        forSale: false,
        trackStock: true,
        costPrice: 2.50,
        perishable: true,
        shelfLife: 365
      };

      const response = await request(app)
        .post('/api/articles')
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
        categoryId: 1,
        type: 'ingredient',
        forSale: false,
        trackStock: true,
        costPrice: 1.00,
        perishable: false
      };

      const response = await request(app)
        .post('/api/articles')
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
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/articles', () => {
    it('devrait récupérer la liste des ingrédients', async () => {
      // Créer quelques ingrédients de test
      await request(app)
        .post('/api/articles')
        .send({
          designation: 'Farine',
          categoryId: 1,
          type: 'ingredient',
          forSale: false
        });

      await request(app)
        .post('/api/articles')
        .send({
          designation: 'Sucre',
          categoryId: 1,
          type: 'ingredient',
          forSale: false
        });

      const response = await request(app)
        .get('/api/articles?type=ingredient')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((item: any) => item.type === 'ingredient')).toBe(true);
    });

    it('devrait filtrer les ingrédients périssables', async () => {
      // Créer un ingrédient périssable
      await request(app)
        .post('/api/articles')
        .send({
          designation: 'Lait',
          categoryId: 1,
          type: 'ingredient',
          forSale: false,
          perishable: true,
          shelfLife: 7
        });

      // Créer un ingrédient non périssable
      await request(app)
        .post('/api/articles')
        .send({
          designation: 'Sel',
          categoryId: 1,
          type: 'ingredient',
          forSale: false,
          perishable: false
        });

      const response = await request(app)
        .get('/api/articles?type=ingredient&perishable=true')
        .expect(200);

      expect(response.body.every((item: any) => item.perishable === true)).toBe(true);
    });
  });

  describe('GET /api/articles/:id', () => {
    it('devrait récupérer un ingrédient spécifique', async () => {
      // Créer un ingrédient
      const createResponse = await request(app)
        .post('/api/articles')
        .send({
          designation: 'Beurre',
          categoryId: 1,
          type: 'ingredient',
          forSale: false,
          perishable: true,
          shelfLife: 30
        });

      const ingredientId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/articles/${ingredientId}`)
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
        .send({
          designation: 'Oeufs',
          categoryId: 1,
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
        .send(updateData)
        .expect(200);

      expect(response.body.designation).toBe('Oeufs Bio');
      expect(response.body.description).toBe('Oeufs biologiques');
      expect(response.body.costPrice).toBe(0.50);
      expect(response.body.shelfLife).toBe(28);
    });

    it('devrait changer un ingrédient de périssable à non-périssable', async () => {
      // Créer un ingrédient périssable
      const createResponse = await request(app)
        .post('/api/articles')
        .send({
          designation: 'Ingrédient Test',
          categoryId: 1,
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
        .send({
          designation: 'Ingrédient à Supprimer',
          categoryId: 1,
          type: 'ingredient',
          forSale: false
        });

      const ingredientId = createResponse.body.id;

      await request(app)
        .delete(`/api/articles/${ingredientId}`)
        .expect(204);

      // Vérifier que l'ingrédient a été supprimé
      await request(app)
        .get(`/api/articles/${ingredientId}`)
        .expect(404);
    });
  });

  describe('GET /api/articles/expiring', () => {
    it('devrait récupérer les ingrédients qui expirent bientôt', async () => {
      // Créer un ingrédient périssable
      await request(app)
        .post('/api/articles')
        .send({
          designation: 'Ingrédient Périssable',
          categoryId: 1,
          type: 'ingredient',
          forSale: false,
          perishable: true,
          shelfLife: 7
        });

      const response = await request(app)
        .get('/api/articles/expiring?days=10')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
