import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import express from 'express';

// Simuler l'API des préparations
const createPreparationAPI = () => {
  const app = express();
  app.use(express.json());
  
  let preparations: any[] = [];
  let nextId = 1;

  // GET /api/preparations - Récupérer toutes les préparations
  app.get('/api/preparations', (req, res) => {
    const { status, date, priority } = req.query;
    let filteredPreparations = preparations;
    
    if (status) {
      filteredPreparations = filteredPreparations.filter(p => p.status === status);
    }
    if (date) {
      filteredPreparations = filteredPreparations.filter(p => p.plannedDate.startsWith(date));
    }
    if (priority) {
      filteredPreparations = filteredPreparations.filter(p => p.priority === priority);
    }
    
    res.json(filteredPreparations);
  });

  // GET /api/preparations/schedule - Récupérer le planning
  app.get('/api/preparations/schedule', (req, res) => {
    const { date, startDate, endDate } = req.query;
    
    let filteredPreparations = preparations;
    
    if (date) {
      filteredPreparations = filteredPreparations.filter(p => p.plannedDate.startsWith(date));
    } else if (startDate && endDate) {
      filteredPreparations = filteredPreparations.filter(p => 
        p.plannedDate >= startDate && p.plannedDate <= endDate
      );
    }
    
    res.json(filteredPreparations);
  });

  // GET /api/preparations/statistics - Récupérer les statistiques
  app.get('/api/preparations/statistics', (req, res) => {
    const stats = {
      total: preparations.length,
      planned: preparations.filter(p => p.status === 'planned').length,
      inProgress: preparations.filter(p => p.status === 'in_progress').length,
      completed: preparations.filter(p => p.status === 'completed').length,
      cancelled: preparations.filter(p => p.status === 'cancelled').length
    };
    
    res.json(stats);
  });

  // GET /api/preparations/:id - Récupérer une préparation spécifique
  app.get('/api/preparations/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const preparation = preparations.find(p => p.id === id);
    
    if (!preparation) {
      return res.status(404).json({ message: 'Préparation non trouvée' });
    }
    
    res.json(preparation);
  });

  // POST /api/preparations - Créer une nouvelle préparation
  app.post('/api/preparations', (req, res) => {
    const { recipeId, quantity, plannedDate, priority, notes } = req.body;
    
    if (!recipeId || !quantity || !plannedDate) {
      return res.status(400).json({ message: 'Données requises manquantes' });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantité invalide' });
    }
    
    const newPreparation = {
      id: nextId++,
      recipeId,
      quantity,
      plannedDate,
      priority: priority || 'normal',
      status: 'planned',
      notes: notes || null,
      createdAt: new Date().toISOString()
    };
    
    preparations.push(newPreparation);
    res.status(201).json(newPreparation);
  });

  // PUT /api/preparations/:id/start - Démarrer une préparation
  app.put('/api/preparations/:id/start', (req, res) => {
    const id = parseInt(req.params.id);
    const preparationIndex = preparations.findIndex(p => p.id === id);
    
    if (preparationIndex === -1) {
      return res.status(404).json({ message: 'Préparation non trouvée' });
    }
    
    if (preparations[preparationIndex].status !== 'planned') {
      return res.status(400).json({ message: 'Préparation déjà démarrée ou terminée' });
    }
    
    const { startedBy, workstationId } = req.body;
    preparations[preparationIndex] = {
      ...preparations[preparationIndex],
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      startedBy,
      workstationId
    };
    
    res.json(preparations[preparationIndex]);
  });

  // PUT /api/preparations/:id/complete - Compléter une préparation
  app.put('/api/preparations/:id/complete', (req, res) => {
    const id = parseInt(req.params.id);
    const preparationIndex = preparations.findIndex(p => p.id === id);
    
    if (preparationIndex === -1) {
      return res.status(404).json({ message: 'Préparation non trouvée' });
    }
    
    if (preparations[preparationIndex].status !== 'in_progress') {
      return res.status(400).json({ message: 'Préparation non en cours' });
    }
    
    const { completedBy, actualQuantity, notes } = req.body;
    preparations[preparationIndex] = {
      ...preparations[preparationIndex],
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedBy,
      actualQuantity: actualQuantity || preparations[preparationIndex].quantity,
      completionNotes: notes
    };
    
    res.json(preparations[preparationIndex]);
  });

  // PUT /api/preparations/:id/cancel - Annuler une préparation
  app.put('/api/preparations/:id/cancel', (req, res) => {
    const id = parseInt(req.params.id);
    const preparationIndex = preparations.findIndex(p => p.id === id);
    
    if (preparationIndex === -1) {
      return res.status(404).json({ message: 'Préparation non trouvée' });
    }
    
    const { reason } = req.body;
    preparations[preparationIndex] = {
      ...preparations[preparationIndex],
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason
    };
    
    res.json(preparations[preparationIndex]);
  });

  return app;
};

describe('Module 4: Planification et Lancement des Préparations - Tests API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createPreparationAPI();
  });

  describe('POST /api/preparations', () => {
    it('devrait créer une nouvelle préparation avec succès', async () => {
      const preparationData = {
        recipeId: 1,
        quantity: 2,
        plannedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'normal',
        notes: 'Préparation pour commande client'
      };

      const response = await request(app)
        .post('/api/preparations')
        .send(preparationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.recipeId).toBe(1);
      expect(response.body.quantity).toBe(2);
      expect(response.body.status).toBe('planned');
      expect(response.body.priority).toBe('normal');
    });

    it('devrait créer une préparation urgente', async () => {
      const preparationData = {
        recipeId: 1,
        quantity: 1,
        plannedDate: new Date().toISOString(),
        priority: 'urgent',
        notes: 'Commande urgente'
      };

      const response = await request(app)
        .post('/api/preparations')
        .send(preparationData)
        .expect(201);

      expect(response.body.priority).toBe('urgent');
      expect(response.body.status).toBe('planned');
    });

    it('devrait échouer si les données requises sont manquantes', async () => {
      const invalidData = {
        recipeId: 1
        // Manque quantity, plannedDate
      };

      await request(app)
        .post('/api/preparations')
        .send(invalidData)
        .expect(400);
    });

    it('devrait échouer si la quantité est invalide', async () => {
      const preparationData = {
        recipeId: 1,
        quantity: 0,
        plannedDate: new Date().toISOString()
      };

      await request(app)
        .post('/api/preparations')
        .send(preparationData)
        .expect(400);
    });
  });

  describe('GET /api/preparations', () => {
    it('devrait récupérer la liste des préparations', async () => {
      // Créer quelques préparations de test
      await request(app)
        .post('/api/preparations')
        .send({
          recipeId: 1,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      await request(app)
        .post('/api/preparations')
        .send({
          recipeId: 1,
          quantity: 2,
          plannedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      const response = await request(app)
        .get('/api/preparations')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait filtrer les préparations par statut', async () => {
      const response = await request(app)
        .get('/api/preparations?status=planned')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait filtrer les préparations par priorité', async () => {
      const response = await request(app)
        .get('/api/preparations?priority=urgent')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/preparations/:id/start', () => {
    it('devrait démarrer une préparation', async () => {
      // Créer une préparation
      const createResponse = await request(app)
        .post('/api/preparations')
        .send({
          recipeId: 1,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      const preparationId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/preparations/${preparationId}/start`)
        .send({
          startedBy: 1,
          workstationId: 1
        })
        .expect(200);

      expect(response.body.status).toBe('in_progress');
      expect(response.body.startedAt).toBeDefined();
      expect(response.body.startedBy).toBe(1);
    });

    it('devrait échouer si la préparation n\'est pas en statut "planned"', async () => {
      // Créer une préparation
      const createResponse = await request(app)
        .post('/api/preparations')
        .send({
          recipeId: 1,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      const preparationId = createResponse.body.id;

      // Démarrer la préparation
      await request(app)
        .put(`/api/preparations/${preparationId}/start`)
        .send({
          startedBy: 1,
          workstationId: 1
        });

      // Tentative de redémarrer devrait échouer
      await request(app)
        .put(`/api/preparations/${preparationId}/start`)
        .send({
          startedBy: 1,
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
        .send({
          recipeId: 1,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      const preparationId = createResponse.body.id;

      // Démarrer la préparation
      await request(app)
        .put(`/api/preparations/${preparationId}/start`)
        .send({
          startedBy: 1,
          workstationId: 1
        });

      // Compléter la préparation
      const response = await request(app)
        .put(`/api/preparations/${preparationId}/complete`)
        .send({
          completedBy: 1,
          actualQuantity: 1,
          notes: 'Préparation terminée avec succès'
        })
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.completedAt).toBeDefined();
      expect(response.body.completedBy).toBe(1);
      expect(response.body.actualQuantity).toBe(1);
    });

    it('devrait échouer si la préparation n\'est pas en cours', async () => {
      // Créer une préparation
      const createResponse = await request(app)
        .post('/api/preparations')
        .send({
          recipeId: 1,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      const preparationId = createResponse.body.id;

      // Tentative de complétion sans démarrage devrait échouer
      await request(app)
        .put(`/api/preparations/${preparationId}/complete`)
        .send({
          completedBy: 1,
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
        .send({
          recipeId: 1,
          quantity: 1,
          plannedDate: new Date().toISOString()
        });

      const preparationId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/preparations/${preparationId}/cancel`)
        .send({
          reason: 'Commande annulée par le client'
        })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
      expect(response.body.cancelledAt).toBeDefined();
      expect(response.body.cancellationReason).toBe('Commande annulée par le client');
    });
  });

  describe('GET /api/preparations/schedule', () => {
    it('devrait récupérer le planning des préparations', async () => {
      const response = await request(app)
        .get('/api/preparations/schedule')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait récupérer le planning pour une date spécifique', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/preparations/schedule?date=${today}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/preparations/statistics', () => {
    it('devrait récupérer les statistiques des préparations', async () => {
      const response = await request(app)
        .get('/api/preparations/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('planned');
      expect(response.body).toHaveProperty('inProgress');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('cancelled');
    });
  });
});
