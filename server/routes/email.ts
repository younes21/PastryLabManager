import { Router } from 'express';
import { emailService } from '../email/service';
import { storage } from '../storage';

export const emailRouter = Router();

// Test de configuration email
emailRouter.post('/test', async (req, res) => {
  try {
    const result = await emailService.testEmailConfiguration();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du test de configuration' 
    });
  }
});

// Statut de la queue d'emails
emailRouter.get('/queue/status', async (req, res) => {
  try {
    const status = emailService.getQueueStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du statut' });
  }
});

// Envoi d'email de test
emailRouter.post('/send-test', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({ 
        message: 'Les champs to, subject et message sont requis' 
      });
    }

    const success = await emailService.sendEmail({
      to,
      subject,
      html: `<h3>${subject}</h3><p>${message}</p>`,
      text: `${subject}\n\n${message}`
    });

    res.json({ success, message: success ? 'Email envoyé' : 'Échec d\'envoi' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
  }
});

// Notification de commande confirmée
emailRouter.post('/notify/order-confirmed', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ message: 'orderId est requis' });
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const customer = await storage.getUser(order.customerId);
    if (!customer || !customer.email) {
      return res.status(404).json({ message: 'Client non trouvé ou email manquant' });
    }

    const success = await emailService.sendOrderConfirmation(order, customer);
    res.json({ success, message: success ? 'Notification envoyée' : 'Échec d\'envoi' });
  } catch (error) {
    console.error('Erreur notification commande:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de la notification' });
  }
});

// Notification de mise à jour de statut de commande
emailRouter.post('/notify/order-status-update', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const customer = await storage.getUser(order.customerId);
    if (!customer || !customer.email) {
      return res.status(404).json({ message: 'Client non trouvé ou email manquant' });
    }

    const success = await emailService.sendOrderStatusUpdate(order, customer);
    res.json({ success, message: success ? 'Notification envoyée' : 'Échec d\'envoi' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi de la notification' });
  }
});

// Notification de production programmée
emailRouter.post('/notify/production-scheduled', async (req, res) => {
  try {
    const { productionId } = req.body;
    
    const production = await storage.getProduction(productionId);
    if (!production) {
      return res.status(404).json({ message: 'Production non trouvée' });
    }

    // Récupérer le staff (préparateurs et gérants)
    const staff = await storage.getUsersByRole('preparateur');
    const managers = await storage.getUsersByRole('gerant');
    const allStaff = [...staff, ...managers].filter(user => user.email);

    if (allStaff.length === 0) {
      return res.status(404).json({ message: 'Aucun destinataire trouvé' });
    }

    const success = await emailService.sendProductionNotification(production, allStaff);
    res.json({ success, message: success ? 'Notifications envoyées' : 'Échec d\'envoi' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi des notifications' });
  }
});

// Alerte stock faible
emailRouter.post('/notify/low-stock', async (req, res) => {
  try {
    const lowStockIngredients = await storage.getLowStockIngredients();
    
    if (lowStockIngredients.length === 0) {
      return res.json({ success: true, message: 'Aucun stock faible détecté' });
    }

    // Récupérer les gérants
    const managers = await storage.getUsersByRole('gerant');
    const admins = await storage.getUsersByRole('admin');
    const recipients = [...managers, ...admins].filter(user => user.email);

    if (recipients.length === 0) {
      return res.status(404).json({ message: 'Aucun gestionnaire avec email trouvé' });
    }

    const success = await emailService.sendLowStockAlert(lowStockIngredients, recipients);
    res.json({ 
      success, 
      message: success ? `Alerte envoyée à ${recipients.length} destinataires` : 'Échec d\'envoi',
      ingredientsCount: lowStockIngredients.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'alerte' });
  }
});

// Notification système personnalisée
emailRouter.post('/notify/system', async (req, res) => {
  try {
    const { title, message, type, roles } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'title et message sont requis' });
    }

    let recipients: any[] = [];
    
    if (roles && Array.isArray(roles)) {
      for (const role of roles) {
        const users = await storage.getUsersByRole(role);
        recipients.push(...users);
      }
    } else {
      // Par défaut, envoyer aux admins et gérants
      const admins = await storage.getUsersByRole('admin');
      const managers = await storage.getUsersByRole('gerant');
      recipients = [...admins, ...managers];
    }

    recipients = recipients.filter(user => user.email);

    if (recipients.length === 0) {
      return res.status(404).json({ message: 'Aucun destinataire trouvé' });
    }

    const success = await emailService.sendSystemNotification(
      { title, message, type: type || 'info' },
      recipients
    );

    res.json({ 
      success, 
      message: success ? `Notification envoyée à ${recipients.length} destinataires` : 'Échec d\'envoi',
      recipientsCount: recipients.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi de la notification' });
  }
});