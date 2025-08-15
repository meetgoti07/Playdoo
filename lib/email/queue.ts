import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { EventEmitter } from 'events';
import { createTransporter, emailConfig } from './config';
import { TemplateRenderer } from './template-renderer';
import {
  EmailData,
  EmailJobData,
  EmailJobOptions,
  EmailResult,
  EmailTemplate,
  EmailPriority,
  QueueMetrics,
  EmailQueueEvents,
} from './types';

export class EmailQueue extends EventEmitter {
  private queue: Queue<EmailJobData> | null = null;
  private worker: Worker<EmailJobData, EmailResult> | null = null;
  private queueEvents: QueueEvents | null = null;
  private redis: IORedis | null = null;
  private workerRedis: IORedis | null = null;
  private eventsRedis: IORedis | null = null;
  private templateRenderer: TemplateRenderer;
  private transporter: any;
  private isInitialized = false;

  constructor() {
    super();
    this.templateRenderer = new TemplateRenderer();
    this.transporter = createTransporter();
  }

  private createRedisConnection(): IORedis {
    // Use same Redis configuration as main Redis client
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      return new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    }
    
    return new IORedis({
      host: emailConfig.redis.host,
      port: emailConfig.redis.port,
      password: emailConfig.redis.password,
      db: emailConfig.redis.db,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create Redis connections
      this.redis = this.createRedisConnection();
      this.workerRedis = this.createRedisConnection();
      this.eventsRedis = this.createRedisConnection();

      // Connect all Redis instances
      await Promise.all([
        this.redis!.connect(),
        this.workerRedis!.connect(),
        this.eventsRedis!.connect()
      ]);

      // Initialize queue components
      this.queue = new Queue<EmailJobData>('email-queue', {
        connection: this.redis,
        defaultJobOptions: emailConfig.queue.defaultJobOptions,
      });

      this.worker = new Worker<EmailJobData, EmailResult>(
        'email-queue',
        this.processEmailJob.bind(this),
        {
          connection: this.workerRedis,
          concurrency: 5,
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        }
      );

      this.queueEvents = new QueueEvents('email-queue', {
        connection: this.eventsRedis,
      });

      this.setupEventListeners();
      await this.templateRenderer.precompileTemplates();
      
      console.log('✅ Email queue initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize email queue:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.worker || !this.queueEvents) return;
    
    // Worker events
    this.worker!.on('completed', (job: Job<EmailJobData, EmailResult>, result: EmailResult) => {
      this.emit('job:completed', job.id!, result);
      console.log(`📧 Email sent successfully: ${job.id}`);
    });

    this.worker!.on('failed', (job: Job<EmailJobData> | undefined, err: Error) => {
      this.emit('job:failed', job?.id || 'unknown', err);
      console.error(`❌ Email failed: ${job?.id}`, err.message);
    });

    this.worker!.on('stalled', (jobId: string) => {
      this.emit('job:stalled', jobId);
      console.warn(`⏰ Email job stalled: ${jobId}`);
    });

    this.worker!.on('progress', (job: Job<EmailJobData>, progress: any) => {
      this.emit('job:progress', job.id!, typeof progress === 'number' ? progress : 0);
    });

    this.worker!.on('error', (err: Error) => {
      this.emit('queue:error', err);
      console.error('❌ Email worker error:', err);
    });

    // Queue events
    this.queueEvents!.on('waiting', ({ jobId }) => {
      this.emit('queue:waiting', jobId);
    });

    this.queueEvents!.on('active', ({ jobId }) => {
      this.emit('queue:active', jobId);
    });

    this.queueEvents!.on('drained', () => {
      this.emit('queue:drained');
    });

    this.queueEvents!.on('cleaned', ({ count }, type) => {
      this.emit('queue:cleaned', Array(count).fill('').map((_, i) => i.toString()), type);
    });
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.queue || !this.worker) {
      throw new Error('Email queue not initialized. Call initialize() first.');
    }
  }

  private async processEmailJob(job: Job<EmailJobData>): Promise<EmailResult> {
    const startTime = Date.now();
    const { data } = job;

    try {
      // Update job progress
      await job.updateProgress(10);

      // Render email template
      const { html, text, subject } = await this.templateRenderer.renderTemplate(
        data.template,
        data.variables as any
      );

      await job.updateProgress(50);

      // Prepare email options
      const mailOptions = {
        from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
        to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
        cc: data.cc ? (Array.isArray(data.cc) ? data.cc.join(', ') : data.cc) : undefined,
        bcc: data.bcc ? (Array.isArray(data.bcc) ? data.bcc.join(', ') : data.bcc) : undefined,
        subject: data.subject || subject,
        html,
        text,
        attachments: data.attachments,
        headers: {
          'X-Email-Template': data.template,
          'X-Priority': data.priority?.toString() || EmailPriority.NORMAL.toString(),
          'X-Job-ID': job.id,
        },
      };

      await job.updateProgress(75);

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      await job.updateProgress(100);

      const result: EmailResult = {
        success: true,
        messageId: info.messageId,
        timestamp: new Date(),
        attempts: job.attemptsMade + 1,
      };

      console.log(`📧 Email sent successfully to ${data.to}: ${info.messageId}`);
      return result;

    } catch (error) {
      const result: EmailResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        attempts: job.attemptsMade + 1,
      };

      console.error(`❌ Failed to send email to ${data.to}:`, error);
      throw error;
    }
  }

  async addEmail(emailData: EmailData, options?: EmailJobOptions): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    this.ensureInitialized();

    const jobOptions: EmailJobOptions = {
      priority: this.getPriorityValue(emailData.priority),
      delay: emailData.sendAt ? emailData.sendAt.getTime() - Date.now() : 0,
      ...options,
    };

    // Remove sendAt from job data as it's handled by delay
    const { sendAt, ...jobData } = emailData;

    const job = await this.queue!.add('send-email', jobData, jobOptions);
    
    console.log(`📨 Email queued: ${job.id} (${emailData.template} to ${emailData.to})`);
    return job.id!;
  }

  async addBulkEmails(emailsData: EmailData[], options?: EmailJobOptions): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const jobs = emailsData.map(emailData => ({
      name: 'send-email',
      data: emailData,
      opts: {
        priority: this.getPriorityValue(emailData.priority),
        delay: emailData.sendAt ? emailData.sendAt.getTime() - Date.now() : 0,
        ...options,
      },
    }));

    const addedJobs = await this.queue!.addBulk(jobs);
    const jobIds = addedJobs.map(job => job.id!);
    
    console.log(`📨 ${jobIds.length} emails queued in bulk`);
    return jobIds;
  }

  async scheduleRecurringEmail(
    emailData: EmailData,
    cronPattern: string,
    options?: EmailJobOptions
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const job = await this.queue!.add('send-email', emailData, {
      repeat: { pattern: cronPattern },
      ...options,
    });

    console.log(`📅 Recurring email scheduled: ${job.id} (${cronPattern})`);
    return job.id!;
  }

  private getPriorityValue(priority?: EmailPriority): number {
    if (!priority) return EmailPriority.NORMAL;
    
    // BullMQ uses higher numbers for higher priority
    switch (priority) {
      case EmailPriority.CRITICAL: return 4;
      case EmailPriority.HIGH: return 3;
      case EmailPriority.NORMAL: return 2;
      case EmailPriority.LOW: return 1;
      default: return 2;
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.queue!.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      status: await job.getState(),
      progress: job.progress,
      attempts: job.attemptsMade,
      data: job.data,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    };
  }

  async getMetrics(): Promise<QueueMetrics> {
    const waiting = await this.queue!.getWaiting();
    const active = await this.queue!.getActive();
    const completed = await this.queue!.getCompleted();
    const failed = await this.queue!.getFailed();
    const delayed = await this.queue!.getDelayed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: await this.queue!.isPaused() ? 1 : 0,
    };
  }

  async retryJob(jobId: string): Promise<void> {
    const job = await this.queue!.getJob(jobId);
    if (job) {
      await job.retry();
      console.log(`🔄 Retrying email job: ${jobId}`);
    }
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await this.queue!.getJob(jobId);
    if (job) {
      await job.remove();
      console.log(`🗑️ Removed email job: ${jobId}`);
    }
  }

  async pauseQueue(): Promise<void> {
    await this.queue!.pause();
    console.log('⏸️ Email queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.queue!.resume();
    console.log('▶️ Email queue resumed');
  }

  async cleanQueue(
    grace: number = 24 * 60 * 60 * 1000, // 24 hours
    limit: number = 100,
    type: 'completed' | 'failed' | 'active' | 'wait' = 'completed'
  ): Promise<string[]> {
    const jobs = await this.queue!.clean(grace, limit, type);
    console.log(`🧹 Cleaned ${jobs.length} ${type} jobs from queue`);
    return jobs;
  }

  async close(): Promise<void> {
    await this.worker!.close();
    await this.queue!.close();
    await this.queueEvents!.close();
    await Promise.all([
      this.redis!.quit(),
      this.workerRedis!.quit(),
      this.eventsRedis!.quit()
    ]);
    console.log('🔌 Email queue closed');
  }

  // Type-safe template methods
  async sendOTP(to: string, otp: string, name: string, options?: EmailJobOptions): Promise<string> {
    return this.addEmail({
      to,
      template: EmailTemplate.OTP,
      subject: `Your OTP Code`,
      variables: {
        name,
        otp,
        expiresIn: '10 minutes',
        appName: emailConfig.from.name,
      },
      priority: EmailPriority.HIGH,
    }, options);
  }

  async sendPasswordReset(to: string, resetLink: string, name: string, options?: EmailJobOptions): Promise<string> {
    return this.addEmail({
      to,
      template: EmailTemplate.PASSWORD_RESET,
      subject: `Reset Your Password`,
      variables: {
        name,
        resetLink,
        expiresIn: '1 hour',
        appName: emailConfig.from.name,
      },
      priority: EmailPriority.HIGH,
    }, options);
  }

  async sendMagicLink(to: string, magicLink: string, name: string, options?: EmailJobOptions): Promise<string> {
    return this.addEmail({
      to,
      template: EmailTemplate.MAGIC_LINK,
      subject: `Sign in to ${emailConfig.from.name}`,
      variables: {
        name,
        magicLink,
        expiresIn: '15 minutes',
        appName: emailConfig.from.name,
      },
      priority: EmailPriority.HIGH,
    }, options);
  }

  async sendEmailVerification(to: string, verificationLink: string, name: string, options?: EmailJobOptions): Promise<string> {
    return this.addEmail({
      to,
      template: EmailTemplate.EMAIL_VERIFICATION,
      subject: `Verify Your Email`,
      variables: {
        name,
        verificationLink,
        expiresIn: '24 hours',
        appName: emailConfig.from.name,
      },
      priority: EmailPriority.HIGH,
    }, options);
  }

  async sendWelcome(to: string, name: string, loginLink?: string, options?: EmailJobOptions): Promise<string> {
    return this.addEmail({
      to,
      template: EmailTemplate.WELCOME,
      subject: `Welcome to ${emailConfig.from.name}!`,
      variables: {
        name,
        appName: emailConfig.from.name,
        loginLink,
      },
      priority: EmailPriority.NORMAL,
    }, options);
  }
}
