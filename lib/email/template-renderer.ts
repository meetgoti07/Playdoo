import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs/promises';
import { EmailTemplate, TemplateVariables } from './types';

export class TemplateRenderer {
  private compiledTemplates: Map<EmailTemplate, HandlebarsTemplateDelegate> = new Map();
  private templateCache: Map<string, string> = new Map();

  constructor(private templatesPath: string = path.join(process.cwd(), 'lib/email/templates')) {
    this.registerHelpers();
  }

  private registerHelpers() {
    // Register common Handlebars helpers
    Handlebars.registerHelper('formatDate', (date: Date | string, format?: string) => {
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString();
      }
      return d.toLocaleString();
    });

    Handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase());
    Handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());
    Handlebars.registerHelper('capitalize', (str: string) => 
      str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase()
    );

    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('neq', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('and', (a: any, b: any) => a && b);
    Handlebars.registerHelper('or', (a: any, b: any) => a || b);
  }

  async loadTemplate(template: EmailTemplate): Promise<string> {
    const cacheKey = `${template}.html`;
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    try {
      const templatePath = path.join(this.templatesPath, `${template}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      this.templateCache.set(cacheKey, templateContent);
      return templateContent;
    } catch (error) {
      throw new Error(`Template ${template} not found: ${error}`);
    }
  }

  async compileTemplate(template: EmailTemplate): Promise<HandlebarsTemplateDelegate> {
    if (this.compiledTemplates.has(template)) {
      return this.compiledTemplates.get(template)!;
    }

    const templateContent = await this.loadTemplate(template);
    const compiledTemplate = Handlebars.compile(templateContent);
    this.compiledTemplates.set(template, compiledTemplate);
    
    return compiledTemplate;
  }

  async renderTemplate<T extends EmailTemplate>(
    template: T,
    variables: TemplateVariables[T]
  ): Promise<{ html: string; text: string; subject: string }> {
    try {
      const compiledTemplate = await this.compileTemplate(template);
      const htmlContent = compiledTemplate(variables);
      
      // Convert simple template to proper HTML email format
      const html = this.wrapInEmailLayout(htmlContent);

      // Extract text version from HTML (basic implementation)
      const text = this.extractTextFromHtml(html);
      
      // Extract subject from template variables or use default
      const subject = this.extractSubject(template, variables);

      return { html, text, subject };
    } catch (error) {
      throw new Error(`Failed to render template ${template}: ${error}`);
    }
  }

  private wrapInEmailLayout(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 20px;
    }
    .content {
      margin-bottom: 30px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #f0f0f0;
      padding-top: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 10px 0;
    }
    .otp-code {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 4px;
      letter-spacing: 2px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent automatically. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private extractTextFromHtml(html: string): string {
    // Basic HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractSubject(template: EmailTemplate, variables: any): string {
    const subjects: Record<EmailTemplate, string> = {
      [EmailTemplate.OTP]: `Your OTP Code for {{appName}}`,
      [EmailTemplate.PASSWORD_RESET]: `Reset Your Password - {{appName}}`,
      [EmailTemplate.MAGIC_LINK]: `Sign in to {{appName}}`,
      [EmailTemplate.EMAIL_VERIFICATION]: `Verify Your Email - {{appName}}`,
      [EmailTemplate.WELCOME]: `Welcome to {{appName}}!`,
      [EmailTemplate.PASSWORD_CHANGED]: `Password Changed - {{appName}}`,
      [EmailTemplate.ACCOUNT_LOCKED]: `Account Security Alert - {{appName}}`,
      [EmailTemplate.LOGIN_ALERT]: `New Sign-in Alert - {{appName}}`,
      [EmailTemplate.NEWSLETTER]: `Newsletter - {{appName}}`,
      [EmailTemplate.INVOICE]: `Invoice {{invoiceNumber}} - {{appName}}`,
      [EmailTemplate.NOTIFICATION]: `{{title}} - {{appName}}`,
    };

    const subjectTemplate = subjects[template] || 'Notification from {{appName}}';
    return Handlebars.compile(subjectTemplate)(variables);
  }

  clearCache() {
    this.templateCache.clear();
    this.compiledTemplates.clear();
  }

  async precompileTemplates() {
    const templates = Object.values(EmailTemplate);
    await Promise.all(templates.map(template => this.compileTemplate(template)));
    console.log(`✅ Precompiled ${templates.length} email templates`);
  }
}
