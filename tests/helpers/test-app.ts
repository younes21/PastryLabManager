import express from 'express';
import { registerRoutes } from '../../server/routes';
import { createServer } from 'http';

export async function createApp(): Promise<express.Application> {
  const app = express();
  
  // Middleware pour parser JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Middleware pour simuler l'authentification
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Simuler un utilisateur authentifié
      (req as any).user = {
        id: 1,
        username: 'testuser',
        role: 'admin'
      };
    }
    next();
  });
  
  // Enregistrer les routes
  await registerRoutes(app);
  
  // Middleware de gestion d'erreurs
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Test app error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  });
  
  return app;
}
