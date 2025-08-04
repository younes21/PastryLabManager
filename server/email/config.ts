import nodemailer from 'nodemailer';

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export const getEmailConfig = (): EmailConfig => {
  const provider = (process.env.EMAIL_PROVIDER || 'smtp') as EmailConfig['provider'];
  
  const config: EmailConfig = {
    provider,
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Système Pâtisserie',
      email: process.env.EMAIL_FROM_ADDRESS || 'noreply@patisserie.local',
    },
  };

  switch (provider) {
    case 'smtp':
      config.smtp = {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      };
      break;
    
    case 'sendgrid':
      config.sendgrid = {
        apiKey: process.env.SENDGRID_API_KEY || '',
      };
      break;
    
    case 'mailgun':
      config.mailgun = {
        apiKey: process.env.MAILGUN_API_KEY || '',
        domain: process.env.MAILGUN_DOMAIN || '',
      };
      break;
    
    case 'ses':
      config.ses = {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      };
      break;
  }

  return config;
};

export const createTransporter = () => {
  const config = getEmailConfig();
  
  switch (config.provider) {
    case 'smtp':
      return nodemailer.createTransporter({
        host: config.smtp!.host,
        port: config.smtp!.port,
        secure: config.smtp!.secure,
        auth: config.smtp!.auth,
      });
    
    case 'sendgrid':
      return nodemailer.createTransporter({
        service: 'sendgrid',
        auth: {
          user: 'apikey',
          pass: config.sendgrid!.apiKey,
        },
      });
    
    case 'mailgun':
      return nodemailer.createTransporter({
        service: 'mailgun',
        auth: {
          user: config.mailgun!.apiKey,
          pass: config.mailgun!.domain,
        },
      });
    
    default:
      throw new Error(`Provider ${config.provider} non supporté`);
  }
};