/**
 * Example EmailService that will be automatically instrumented
 */

export class EmailService {
  
  /**
   * Send welcome email - will be automatically instrumented
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    console.log(`Sending welcome email to ${name} (${email})`);
    
    const emailContent = await this._generateWelcomeContent(name);
    await this._sendEmail(email, 'Welcome!', emailContent);
    
    console.log('Welcome email sent successfully');
  }

  /**
   * Send farewell email - will be automatically instrumented
   */
  async sendFarewellEmail(email: string, name: string): Promise<void> {
    console.log(`Sending farewell email to ${name} (${email})`);
    
    const emailContent = await this._generateFarewellContent(name);
    await this._sendEmail(email, 'Goodbye!', emailContent);
    
    console.log('Farewell email sent successfully');
  }

  /**
   * Private method - will be automatically instrumented
   */
  private async _generateWelcomeContent(name: string): Promise<string> {
    // Simulate some processing time
    await this._delay(100);
    
    return `Hello ${name}!\n\nWelcome to our service! We're excited to have you on board.\n\nBest regards,\nThe Team`;
  }

  /**
   * Private method - will be automatically instrumented
   */
  private async _generateFarewellContent(name: string): Promise<string> {
    // Simulate some processing time
    await this._delay(50);
    
    return `Dear ${name},\n\nWe're sorry to see you go. Thank you for being part of our community.\n\nBest wishes,\nThe Team`;
  }

  /**
   * Private method - will be automatically instrumented
   */
  private async _sendEmail(to: string, subject: string, content: string): Promise<void> {
    // Simulate email sending
    await this._delay(200);
    
    // In a real application, this would integrate with an email service
    console.log(`📧 Email sent to ${to}: ${subject}`);
  }

  /**
   * Utility method - will be automatically instrumented
   */
  private async _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
