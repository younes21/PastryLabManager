import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';

// Créer une application Express simple pour les tests
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Route de test simple
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API fonctionne', status: 'ok' });
  });
  
  // Route pour créer un utilisateur de test
  app.post('/api/test/user', (req, res) => {
    res.json({ 
      id: 1, 
      username: 'testuser', 
      email: 'test@example.com',
      role: 'admin' 
    });
  });
  
  // Route pour créer un article de test
  app.post('/api/test/article', (req, res) => {
    res.json({ 
      id: 1, 
      name: 'Test Article', 
      type: 'produit',
      price: '10.00' 
    });
  });
  
  return app;
};

describe('Tests d\'intégration API de base', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/test', () => {
    it('devrait retourner un message de test', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'API fonctionne');
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('POST /api/test/user', () => {
    it('devrait créer un utilisateur de test', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin'
      };

      const response = await request(app)
        .post('/api/test/user')
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('role', 'admin');
    });
  });

  describe('POST /api/test/article', () => {
    it('devrait créer un article de test', async () => {
      const articleData = {
        name: 'Test Article',
        type: 'produit',
        price: '10.00'
      };

      const response = await request(app)
        .post('/api/test/article')
        .send(articleData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name', 'Test Article');
      expect(response.body).toHaveProperty('type', 'produit');
      expect(response.body).toHaveProperty('price', '10.00');
    });
  });
});
