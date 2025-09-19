import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';

// Simuler l'API des produits
const createProductAPI = () => {
  const app = express();
  app.use(express.json());
  
  let products: any[] = [];
  let nextId = 1;

  // GET /api/articles - Récupérer tous les articles
  app.get('/api/articles', (req, res) => {
    const { type, categoryId } = req.query;
    let filteredProducts = products;
    
    if (type) {
      filteredProducts = filteredProducts.filter(p => p.type === type);
    }
    if (categoryId) {
      filteredProducts = filteredProducts.filter(p => p.categoryId === parseInt(categoryId as string));
    }
    
    res.json(filteredProducts);
  });

  // GET /api/articles/:id - Récupérer un article spécifique
  app.get('/api/articles/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }
    
    res.json(product);
  });

  // POST /api/articles - Créer un nouvel article
  app.post('/api/articles', (req, res) => {
    const { designation, categoryId, type, forSale, trackStock, costPrice, sellingPrice } = req.body;
    
    if (!designation || !categoryId || !type) {
      return res.status(400).json({ message: 'Données requises manquantes' });
    }
    
    const newProduct = {
      id: nextId++,
      designation,
      categoryId,
      type,
      forSale: forSale || false,
      trackStock: trackStock || false,
      costPrice: costPrice || null,
      sellingPrice: sellingPrice || null,
      createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
  });

  // PUT /api/articles/:id - Mettre à jour un article
  app.put('/api/articles/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }
    
    products[productIndex] = { ...products[productIndex], ...req.body };
    res.json(products[productIndex]);
  });

  // DELETE /api/articles/:id - Supprimer un article
  app.delete('/api/articles/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }
    
    products.splice(productIndex, 1);
    res.status(204).send();
  });

  // GET /api/articles/:id/stock - Récupérer le stock d'un article
  app.get('/api/articles/:id/stock', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }
    
    res.json({
      articleId: id,
      totalQuantity: 100,
      reservedQuantity: 10,
      availableQuantity: 90
    });
  });

  return app;
};

describe('Module 1: CRUD Produit - Tests API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createProductAPI();
  });

  describe('POST /api/articles', () => {
    it('devrait créer un nouveau produit avec succès', async () => {
      const productData = {
        designation: 'Gâteau au Chocolat',
        categoryId: 1,
        type: 'produit',
        forSale: true,
        trackStock: true,
        costPrice: 5.00,
        sellingPrice: 10.00
      };

      const response = await request(app)
        .post('/api/articles')
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
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/articles', () => {
    it('devrait récupérer la liste des produits', async () => {
      // Créer quelques produits de test
      await request(app)
        .post('/api/articles')
        .send({
          designation: 'Produit 1',
          categoryId: 1,
          type: 'produit',
          forSale: true
        });

      await request(app)
        .post('/api/articles')
        .send({
          designation: 'Produit 2',
          categoryId: 1,
          type: 'produit',
          forSale: true
        });

      const response = await request(app)
        .get('/api/articles')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait filtrer les produits par type', async () => {
      // Créer un produit et un ingrédient
      await request(app)
        .post('/api/articles')
        .send({
          designation: 'Produit Test',
          categoryId: 1,
          type: 'produit',
          forSale: true
        });

      await request(app)
        .post('/api/articles')
        .send({
          designation: 'Ingrédient Test',
          categoryId: 1,
          type: 'ingredient',
          forSale: false
        });

      const response = await request(app)
        .get('/api/articles?type=produit')
        .expect(200);

      expect(response.body.every((item: any) => item.type === 'produit')).toBe(true);
    });
  });

  describe('GET /api/articles/:id', () => {
    it('devrait récupérer un produit spécifique', async () => {
      // Créer un produit
      const createResponse = await request(app)
        .post('/api/articles')
        .send({
          designation: 'Produit Test',
          categoryId: 1,
          type: 'produit',
          forSale: true
        });

      const productId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/articles/${productId}`)
        .expect(200);

      expect(response.body.id).toBe(productId);
      expect(response.body.designation).toBe('Produit Test');
    });

    it('devrait retourner 404 si le produit n\'existe pas', async () => {
      await request(app)
        .get('/api/articles/99999')
        .expect(404);
    });
  });

  describe('PUT /api/articles/:id', () => {
    it('devrait mettre à jour un produit existant', async () => {
      // Créer un produit
      const createResponse = await request(app)
        .post('/api/articles')
        .send({
          designation: 'Produit Original',
          categoryId: 1,
          type: 'produit',
          forSale: true
        });

      const productId = createResponse.body.id;

      const updateData = {
        designation: 'Produit Modifié',
        description: 'Nouvelle description',
        sellingPrice: 15.00
      };

      const response = await request(app)
        .put(`/api/articles/${productId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.designation).toBe('Produit Modifié');
      expect(response.body.description).toBe('Nouvelle description');
      expect(response.body.sellingPrice).toBe(15.00);
    });

    it('devrait échouer si le produit n\'existe pas', async () => {
      const updateData = {
        designation: 'Produit Modifié'
      };

      await request(app)
        .put('/api/articles/99999')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/articles/:id', () => {
    it('devrait supprimer un produit existant', async () => {
      // Créer un produit
      const createResponse = await request(app)
        .post('/api/articles')
        .send({
          designation: 'Produit à Supprimer',
          categoryId: 1,
          type: 'produit',
          forSale: true
        });

      const productId = createResponse.body.id;

      await request(app)
        .delete(`/api/articles/${productId}`)
        .expect(204);

      // Vérifier que le produit a été supprimé
      await request(app)
        .get(`/api/articles/${productId}`)
        .expect(404);
    });

    it('devrait échouer si le produit n\'existe pas', async () => {
      await request(app)
        .delete('/api/articles/99999')
        .expect(404);
    });
  });

  describe('GET /api/articles/:id/stock', () => {
    it('devrait récupérer le stock d\'un produit', async () => {
      // Créer un produit avec suivi de stock
      const createResponse = await request(app)
        .post('/api/articles')
        .send({
          designation: 'Produit avec Stock',
          categoryId: 1,
          type: 'produit',
          forSale: true,
          trackStock: true
        });

      const productId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/articles/${productId}/stock`)
        .expect(200);

      expect(response.body).toHaveProperty('articleId', productId);
      expect(response.body).toHaveProperty('totalQuantity');
      expect(response.body).toHaveProperty('reservedQuantity');
      expect(response.body).toHaveProperty('availableQuantity');
    });
  });
});
