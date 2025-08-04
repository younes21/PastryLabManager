import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface TemplateData {
  user?: {
    name: string;
    email: string;
  };
  order?: {
    id: number;
    customerName: string;
    total: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  };
  production?: {
    id: number;
    recipeName: string;
    status: string;
    scheduledDate: string;
  };
  delivery?: {
    id: number;
    customerName: string;
    address: string;
    deliveryDate: string;
  };
  notification?: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  };
}

// Templates HTML pré-compilés
const templates = {
  base: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .alert { padding: 15px; margin: 20px 0; border-radius: 5px; }
        .alert-success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .alert-warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .alert-error { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background-color: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧁 Système Pâtisserie</h1>
            <h2>{{subject}}</h2>
        </div>
        <div class="content">
            {{{content}}}
        </div>
        <div class="footer">
            <p>© 2025 Système de Gestion Pâtisserie - Tous droits réservés</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
    </div>
</body>
</html>`,

  orderConfirmation: `
<h3>Confirmation de Commande #{{order.id}}</h3>
<p>Bonjour {{user.name}},</p>
<p>Votre commande a été confirmée avec succès !</p>

<div class="alert alert-success">
    <strong>Statut :</strong> Commande confirmée et en préparation
</div>

<h4>Détails de la commande :</h4>
<table class="table">
    <thead>
        <tr>
            <th>Article</th>
            <th>Quantité</th>
            <th>Prix unitaire</th>
            <th>Total</th>
        </tr>
    </thead>
    <tbody>
        {{#each order.items}}
        <tr>
            <td>{{this.name}}</td>
            <td>{{this.quantity}}</td>
            <td>{{this.price}} DA</td>
            <td>{{multiply this.quantity this.price}} DA</td>
        </tr>
        {{/each}}
    </tbody>
    <tfoot>
        <tr>
            <th colspan="3">Total</th>
            <th>{{order.total}} DA</th>
        </tr>
    </tfoot>
</table>

<p>Nous vous tiendrons informé de l'avancement de votre commande.</p>
<p>Merci de votre confiance !</p>`,

  orderStatusUpdate: `
<h3>Mise à jour de votre Commande #{{order.id}}</h3>
<p>Bonjour {{user.name}},</p>
<p>Le statut de votre commande a été mis à jour.</p>

<div class="alert alert-{{getAlertType order.status}}">
    <strong>Nouveau statut :</strong> {{order.status}}
</div>

<p>{{getStatusMessage order.status}}</p>

<a href="#" class="btn">Suivre ma commande</a>`,

  productionScheduled: `
<h3>Production Programmée</h3>
<p>Une nouvelle production a été programmée :</p>

<table class="table">
    <tr><td><strong>ID Production :</strong></td><td>#{{production.id}}</td></tr>
    <tr><td><strong>Recette :</strong></td><td>{{production.recipeName}}</td></tr>
    <tr><td><strong>Date programmée :</strong></td><td>{{production.scheduledDate}}</td></tr>
    <tr><td><strong>Statut :</strong></td><td>{{production.status}}</td></tr>
</table>

<p>Veuillez vous assurer que tous les ingrédients sont disponibles.</p>`,

  deliveryScheduled: `
<h3>Livraison Programmée</h3>
<p>Bonjour {{user.name}},</p>
<p>Votre livraison a été programmée :</p>

<div class="alert alert-success">
    <strong>Date de livraison :</strong> {{delivery.deliveryDate}}
</div>

<table class="table">
    <tr><td><strong>Client :</strong></td><td>{{delivery.customerName}}</td></tr>
    <tr><td><strong>Adresse :</strong></td><td>{{delivery.address}}</td></tr>
    <tr><td><strong>Commande :</strong></td><td>#{{delivery.id}}</td></tr>
</table>

<p>Un livreur vous contactera avant la livraison.</p>`,

  lowStockAlert: `
<h3>⚠️ Alerte Stock Faible</h3>
<p>Attention, certains ingrédients sont en rupture de stock ou en quantité insuffisante :</p>

<table class="table">
    <thead>
        <tr>
            <th>Ingrédient</th>
            <th>Stock Actuel</th>
            <th>Stock Minimum</th>
            <th>Statut</th>
        </tr>
    </thead>
    <tbody>
        {{#each ingredients}}
        <tr>
            <td>{{this.name}}</td>
            <td>{{this.currentStock}} {{this.unit}}</td>
            <td>{{this.minStock}} {{this.unit}}</td>
            <td><span class="alert-warning" style="padding: 4px 8px; border-radius: 3px;">Stock faible</span></td>
        </tr>
        {{/each}}
    </tbody>
</table>

<p>Veuillez procéder au réapprovisionnement rapidement.</p>
<a href="#" class="btn">Gérer les stocks</a>`,

  systemNotification: `
<h3>{{notification.title}}</h3>
<div class="alert alert-{{notification.type}}">
    {{notification.message}}
</div>
<p>Cette notification a été générée automatiquement par le système.</p>`
};

// Helpers Handlebars
Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
Handlebars.registerHelper('getAlertType', (status: string) => {
  const statusMap: Record<string, string> = {
    'confirmee': 'success',
    'en_preparation': 'info', 
    'prete': 'success',
    'livree': 'success',
    'annulee': 'error'
  };
  return statusMap[status] || 'info';
});

Handlebars.registerHelper('getStatusMessage', (status: string) => {
  const messages: Record<string, string> = {
    'confirmee': 'Votre commande a été confirmée et sera bientôt en préparation.',
    'en_preparation': 'Nos pâtissiers travaillent actuellement sur votre commande.',
    'prete': 'Votre commande est prête ! Vous pouvez venir la récupérer ou elle sera bientôt livrée.',
    'livree': 'Votre commande a été livrée avec succès. Merci de votre confiance !',
    'annulee': 'Votre commande a été annulée. Contactez-nous pour plus d\'informations.'
  };
  return messages[status] || 'Statut mis à jour.';
});

export class EmailTemplateService {
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    // Compiler tous les templates au démarrage
    Object.entries(templates).forEach(([name, template]) => {
      this.compiledTemplates.set(name, Handlebars.compile(template));
    });
  }

  generateEmail(templateName: keyof typeof templates, data: TemplateData): EmailTemplate {
    const contentTemplate = this.compiledTemplates.get(templateName);
    const baseTemplate = this.compiledTemplates.get('base');
    
    if (!contentTemplate || !baseTemplate) {
      throw new Error(`Template ${templateName} non trouvé`);
    }

    const content = contentTemplate(data);
    const subject = this.getSubject(templateName, data);
    
    const html = baseTemplate({
      subject,
      content,
      ...data
    });

    return {
      subject,
      html,
      text: this.htmlToText(html)
    };
  }

  private getSubject(templateName: string, data: TemplateData): string {
    const subjects: Record<string, string> = {
      orderConfirmation: `Confirmation de commande #${data.order?.id}`,
      orderStatusUpdate: `Mise à jour commande #${data.order?.id}`,
      productionScheduled: `Production programmée - ${data.production?.recipeName}`,
      deliveryScheduled: `Livraison programmée`,
      lowStockAlert: `⚠️ Alerte stock faible`,
      systemNotification: data.notification?.title || 'Notification système'
    };
    
    return subjects[templateName] || 'Notification';
  }

  private htmlToText(html: string): string {
    // Conversion basique HTML vers texte
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }
}