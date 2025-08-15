import { EmailQueue } from './queue';
import { validateEmailConfig } from './config';
import {
  EmailData,
  EmailJobOptions,
  EmailTemplate,
  EmailPriority,
  QueueMetrics,
} from './types';

class EmailService {
  private static instance: EmailService;
  private emailQueue: EmailQueue;
  private isInitialized = false;

  private constructor() {
    this.emailQueue = new EmailQueue();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Validate email configuration
      const isValid = await validateEmailConfig();
      if (!isValid) {
        throw new Error('Invalid email configuration');
      }

      // Initialize the email queue
      await this.emailQueue.initialize();
      
      this.isInitialized = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      throw error;
    }
  }

  // Generic email sending method
  async sendEmail(emailData: EmailData, options?: EmailJobOptions): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.emailQueue.addEmail(emailData, options);
  }

  // Bulk email sending
  async sendBulkEmails(emailsData: EmailData[], options?: EmailJobOptions): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.emailQueue.addBulkEmails(emailsData, options);
  }

  // Scheduled/recurring emails
  async scheduleEmail(emailData: EmailData, cronPattern: string, options?: EmailJobOptions): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.emailQueue.scheduleRecurringEmail(emailData, cronPattern, options);
  }

  // Type-safe template methods
  async sendOTP(
    to: string,
    otp: string,
    name: string,
    options?: EmailJobOptions
  ): Promise<string> {
    return this.emailQueue.sendOTP(to, otp, name, options);
  }

  async sendPasswordReset(
    to: string,
    resetLink: string,
    name: string,
    options?: EmailJobOptions
  ): Promise<string> {
    return this.emailQueue.sendPasswordReset(to, resetLink, name, options);
  }

  async sendMagicLink(
    to: string,
    magicLink: string,
    name: string,
    options?: EmailJobOptions
  ): Promise<string> {
    return this.emailQueue.sendMagicLink(to, magicLink, name, options);
  }

  async sendEmailVerification(
    to: string,
    verificationLink: string,
    name: string,
    options?: EmailJobOptions
  ): Promise<string> {
    return this.emailQueue.sendEmailVerification(to, verificationLink, name, options);
  }

  async sendWelcome(
    to: string,
    name: string,
    loginLink?: string,
    options?: EmailJobOptions
  ): Promise<string> {
    return this.emailQueue.sendWelcome(to, name, loginLink, options);
  }

  async sendPasswordChanged(
    to: string,
    name: string,
    timestamp: string,
    supportEmail: string,
    options?: EmailJobOptions
  ): Promise<string> {
    return this.sendEmail({
      to,
      template: EmailTemplate.PASSWORD_CHANGED,
      subject: 'Password Changed Successfully',
      variables: {
        name,
        timestamp,
        appName: 'Playoo',
        supportEmail,
      },
      priority: EmailPriority.HIGH,
    }, options);
  }

  async sendAccountLocked(
    to: string,
    name: string,
    unlockLink: string,
    supportEmail: string,
    options?: EmailJobOptions
  ): Promise<string> {
    return this.sendEmail({
      to,
      template: EmailTemplate.ACCOUNT_LOCKED,
      subject: 'Account Security Alert',
      variables: {
        name,
        unlockLink,
        appName: 'Playdoo',
        supportEmail,
      },
      priority: EmailPriority.CRITICAL,
    }, options);
  }

  async sendLoginAlert(
    to: string,
    name: string,
    location: string,
    device: string,
    timestamp: string,
    options?: EmailJobOptions
  ): Promise<string> {
    return this.sendEmail({
      to,
      template: EmailTemplate.LOGIN_ALERT,
      subject: 'New Sign-in Alert',
      variables: {
        name,
        location,
        device,
        timestamp,
        appName: 'Playoo',
      },
      priority: EmailPriority.NORMAL,
    }, options);
  }

  async sendNewsletter(
    to: string,
    name: string,
    content: string,
    unsubscribeLink: string,
    options?: EmailJobOptions
  ): Promise<string> {
    return this.sendEmail({
      to,
      template: EmailTemplate.NEWSLETTER,
      subject: 'Newsletter',
      variables: {
        name,
        content,
        unsubscribeLink,
        appName: 'Playdoo',
      },
      priority: EmailPriority.LOW,
    }, options);
  }

  async sendInvoice(
    to: string,
    name: string,
    invoiceNumber: string,
    amount: string,
    dueDate: string,
    downloadLink: string,
    options?: EmailJobOptions
  ): Promise<string> {
    return this.sendEmail({
      to,
      template: EmailTemplate.INVOICE,
      subject: `Invoice ${invoiceNumber}`,
      variables: {
        name,
        invoiceNumber,
        amount,
        dueDate,
        downloadLink,
        appName: 'Playdoo',
      },
      priority: EmailPriority.NORMAL,
    }, options);
  }

  async sendNotification(
    to: string,
    name: string,
    title: string,
    message: string,
    actionLink?: string,
    actionText?: string,
    options?: EmailJobOptions
  ): Promise<string> {
    return this.sendEmail({
      to,
      template: EmailTemplate.NOTIFICATION,
      subject: title,
      variables: {
        name,
        title,
        message,
        actionLink,
        actionText,
        appName: 'Playdoo',
      },
      priority: EmailPriority.NORMAL,
    }, options);
  }

  // Queue management methods
  async getJobStatus(jobId: string): Promise<any> {
    return this.emailQueue.getJobStatus(jobId);
  }

  async getQueueMetrics(): Promise<QueueMetrics> {
    return this.emailQueue.getMetrics();
  }

  async retryJob(jobId: string): Promise<void> {
    return this.emailQueue.retryJob(jobId);
  }

  async removeJob(jobId: string): Promise<void> {
    return this.emailQueue.removeJob(jobId);
  }

  async pauseQueue(): Promise<void> {
    return this.emailQueue.pauseQueue();
  }

  async resumeQueue(): Promise<void> {
    return this.emailQueue.resumeQueue();
  }

  async cleanQueue(
    grace?: number,
    limit?: number,
    type?: 'completed' | 'failed' | 'active' | 'wait'
  ): Promise<string[]> {
    return this.emailQueue.cleanQueue(grace, limit, type);
  }

  async close(): Promise<void> {
    return this.emailQueue.close();
  }

  // Event listeners
  onJobCompleted(callback: (jobId: string, result: any) => void): void {
    this.emailQueue.on('job:completed', callback);
  }

  onJobFailed(callback: (jobId: string, error: Error) => void): void {
    this.emailQueue.on('job:failed', callback);
  }

  onQueueError(callback: (error: Error) => void): void {
    this.emailQueue.on('queue:error', callback);
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

// Export the class for testing purposes
export { EmailService };

// Export types for convenience
export * from './types';
export * from './config';
