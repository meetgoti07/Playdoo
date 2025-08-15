import { JobsOptions } from 'bullmq';

export enum EmailTemplate {
  OTP = 'otp',
  PASSWORD_RESET = 'password-reset',
  MAGIC_LINK = 'magic-link',
  EMAIL_VERIFICATION = 'email-verification',
  WELCOME = 'welcome',
  PASSWORD_CHANGED = 'password-changed',
  ACCOUNT_LOCKED = 'account-locked',
  LOGIN_ALERT = 'login-alert',
  NEWSLETTER = 'newsletter',
  INVOICE = 'invoice',
  NOTIFICATION = 'notification',
}

export enum EmailPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4,
}

export interface EmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  template: EmailTemplate;
  variables: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
  priority?: EmailPriority;
  sendAt?: Date;
  metadata?: Record<string, any>;
}

export interface EmailJobData extends EmailData {
  id?: string;
  attempts?: number;
  maxRetries?: number;
}

export interface EmailJobOptions extends JobsOptions {
  priority?: number;
  delay?: number;
  repeat?: {
    pattern?: string;
    every?: number;
    limit?: number;
  };
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
  attempts: number;
}

export interface TemplateVariables {
  [EmailTemplate.OTP]: {
    name: string;
    otp: string;
    expiresIn: string;
    appName: string;
  };
  [EmailTemplate.PASSWORD_RESET]: {
    name: string;
    resetLink: string;
    expiresIn: string;
    appName: string;
  };
  [EmailTemplate.MAGIC_LINK]: {
    name: string;
    magicLink: string;
    expiresIn: string;
    appName: string;
  };
  [EmailTemplate.EMAIL_VERIFICATION]: {
    name: string;
    verificationLink: string;
    expiresIn: string;
    appName: string;
  };
  [EmailTemplate.WELCOME]: {
    name: string;
    appName: string;
    loginLink?: string;
  };
  [EmailTemplate.PASSWORD_CHANGED]: {
    name: string;
    timestamp: string;
    appName: string;
    supportEmail: string;
  };
  [EmailTemplate.ACCOUNT_LOCKED]: {
    name: string;
    unlockLink: string;
    appName: string;
    supportEmail: string;
  };
  [EmailTemplate.LOGIN_ALERT]: {
    name: string;
    location: string;
    device: string;
    timestamp: string;
    appName: string;
  };
  [EmailTemplate.NEWSLETTER]: {
    name: string;
    unsubscribeLink: string;
    content: string;
    appName: string;
  };
  [EmailTemplate.INVOICE]: {
    name: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    downloadLink: string;
    appName: string;
  };
  [EmailTemplate.NOTIFICATION]: {
    name: string;
    title: string;
    message: string;
    actionLink?: string;
    actionText?: string;
    appName: string;
  };
}

export type EmailTemplateData<T extends EmailTemplate> = {
  template: T;
  variables: TemplateVariables[T];
} & Omit<EmailData, 'template' | 'variables'>;

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface EmailQueueEvents {
  'job:completed': (jobId: string, result: EmailResult) => void;
  'job:failed': (jobId: string, error: Error) => void;
  'job:stalled': (jobId: string) => void;
  'job:progress': (jobId: string, progress: number) => void;
  'queue:error': (error: Error) => void;
  'queue:waiting': (jobId: string) => void;
  'queue:active': (jobId: string) => void;
  'queue:drained': () => void;
  'queue:cleaned': (jobs: string[], type: string) => void;
}
