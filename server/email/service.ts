import { createTransporter, getEmailConfig } from './config';
import { EmailTemplateService, TemplateData } from './templates';
import type { User } from '@shared/schema';

export interface EmailOptions {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  template?: {
    name: string;
    data: TemplateData;
  };
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export interface EmailQueueItem {
  id: string;
  options: EmailOptions;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt?: Date;
  lastError?: string;
}

export class EmailService {
  private transporter;
  private templateService: EmailTemplateService;
  private emailQueue: EmailQueueItem[] = [];
  private isProcessing = false;
  private config;

  constructor() {
    this.config = getEmailConfig();
    this.transporter = createTransporter();
    this.templateService = new EmailTemplateService();
    
    // Démarrer le processeur de queue
    this.startQueueProcessor();
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const emailData = await this.prepareEmail(options);
      
      const result = await this.transporter.sendMail({
        from: `${this.config.from.name} <${this.config.from.email}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: options.attachments
      });

      console.log('Email envoyé avec succès:', result.messageId);
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return false;
    }
  }

  async queueEmail(options: EmailOptions, scheduledAt?: Date): Promise<string> {
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queueItem: EmailQueueItem = {
      id: emailId,
      options,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      scheduledAt
    };

    this.emailQueue.push(queueItem);
    console.log(`Email mis en queue: ${emailId}`);
    
    return emailId;
  }

  // Méthodes de convenance pour différents types d'emails
  async sendOrderConfirmation(order: any, customer: User): Promise<boolean> {
    return this.sendEmail({
      to: customer.email,
      template: {
        name: 'orderConfirmation',
        data: {
          user: { name: customer.username, email: customer.email },
          order
        }
      }
    });
  }

  async sendOrderStatusUpdate(order: any, customer: User): Promise<boolean> {
    return this.sendEmail({
      to: customer.email,
      template: {
        name: 'orderStatusUpdate',
        data: {
          user: { name: customer.username, email: customer.email },
          order
        }
      }
    });
  }

  async sendProductionNotification(production: any, staff: User[]): Promise<boolean> {
    const emails = staff.map(user => user.email);
    
    return this.sendEmail({
      to: emails,
      template: {
        name: 'productionScheduled',
        data: { production }
      }
    });
  }

  async sendDeliveryNotification(delivery: any, customer: User): Promise<boolean> {
    return this.sendEmail({
      to: customer.email,
      template: {
        name: 'deliveryScheduled',
        data: {
          user: { name: customer.username, email: customer.email },
          delivery
        }
      }
    });
  }

  async sendLowStockAlert(ingredients: any[], managers: User[]): Promise<boolean> {
    const emails = managers.map(user => user.email);
    
    return this.sendEmail({
      to: emails,
      template: {
        name: 'lowStockAlert',
        data: { ingredients }
      }
    });
  }

  async sendSystemNotification(notification: { title: string; message: string; type: 'info' | 'warning' | 'error' | 'success' }, recipients: User[]): Promise<boolean> {
    const emails = recipients.map(user => user.email);
    
    return this.sendEmail({
      to: emails,
      template: {
        name: 'systemNotification',
        data: { notification }
      }
    });
  }

  // Test de configuration email
  async testEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify();
      
      // Test d'envoi
      const testResult = await this.sendEmail({
        to: this.config.from.email,
        subject: 'Test de configuration email',
        html: '<h3>Test réussi !</h3><p>La configuration email fonctionne correctement.</p>',
        text: 'Test réussi ! La configuration email fonctionne correctement.'
      });

      return { success: testResult };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Gestion de la queue
  private async startQueueProcessor(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    setInterval(async () => {
      await this.processQueue();
    }, 10000); // Traiter la queue toutes les 10 secondes
  }

  private async processQueue(): Promise<void> {
    const now = new Date();
    const itemsToProcess = this.emailQueue.filter(item => 
      item.attempts < item.maxAttempts && 
      (!item.scheduledAt || item.scheduledAt <= now)
    );

    for (const item of itemsToProcess) {
      try {
        const success = await this.sendEmail(item.options);
        
        if (success) {
          // Retirer de la queue
          this.emailQueue = this.emailQueue.filter(q => q.id !== item.id);
          console.log(`Email ${item.id} envoyé avec succès`);
        } else {
          throw new Error('Échec d\'envoi');
        }
      } catch (error) {
        item.attempts++;
        item.lastError = error instanceof Error ? error.message : 'Erreur inconnue';
        
        if (item.attempts >= item.maxAttempts) {
          console.error(`Email ${item.id} échec définitif après ${item.maxAttempts} tentatives`);
          // Optionnel: sauvegarder dans la base de données pour audit
        } else {
          console.warn(`Email ${item.id} tentative ${item.attempts}/${item.maxAttempts} échouée`);
        }
      }
    }
  }

  getQueueStatus(): { total: number; pending: number; failed: number } {
    const pending = this.emailQueue.filter(item => item.attempts < item.maxAttempts).length;
    const failed = this.emailQueue.filter(item => item.attempts >= item.maxAttempts).length;
    
    return {
      total: this.emailQueue.length,
      pending,
      failed
    };
  }

  private async prepareEmail(options: EmailOptions): Promise<{ subject: string; html: string; text?: string }> {
    if (options.template) {
      const template = this.templateService.generateEmail(
        options.template.name as any,
        options.template.data
      );
      
      return {
        subject: options.subject || template.subject,
        html: template.html,
        text: options.text || template.text
      };
    }

    return {
      subject: options.subject || 'Notification',
      html: options.html || '<p>Pas de contenu</p>',
      text: options.text
    };
  }
}

// Instance singleton
export const emailService = new EmailService();