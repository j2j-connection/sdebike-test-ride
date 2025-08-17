// SMS Service - Provider-agnostic SMS functionality
// Can easily switch between TextBelt (development) and Twilio (production)

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
  provider?: string;
}

export interface SMSProvider {
  sendSMS(message: SMSMessage): Promise<SMSResponse>;
  isConfigured(): boolean;
  getConfigStatus(): { configured: boolean; missing: string[] };
}

// TextBelt Provider Implementation
class TextBeltProvider implements SMSProvider {
  private apiKey: string;
  private baseUrl = 'https://textbelt.com/text';

  constructor() {
    this.apiKey = process.env.TEXTBELT_API_KEY || '';
  }

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'TextBelt not configured. Please set TEXTBELT_API_KEY environment variable.',
        provider: 'textbelt'
      };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: message.to,
          message: message.body,
          key: this.apiKey,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          messageId: result.textId || `tb_${Date.now()}`,
          status: 'sent',
          provider: 'textbelt'
        };
      } else {
        return {
          success: false,
          error: result.error || 'TextBelt SMS failed',
          status: 'failed',
          provider: 'textbelt'
        };
      }
    } catch (error) {
      console.error('TextBelt SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: 'textbelt'
      };
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getConfigStatus(): { configured: boolean; missing: string[] } {
    const missing: string[] = [];
    
    if (!process.env.TEXTBELT_API_KEY) missing.push('TEXTBELT_API_KEY');
    
    return {
      configured: missing.length === 0,
      missing
    };
  }
}

// Twilio Provider Implementation
class TwilioProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromPhoneNumber: string;
  private twilioClient: any;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    
    // Dynamically import Twilio only when needed
    if (this.isConfigured()) {
      this.initializeTwilio();
    }
  }

  private async initializeTwilio() {
    try {
      const twilio = await import('twilio');
      this.twilioClient = twilio.default(this.accountSid, this.authToken);
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error);
    }
  }

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.',
        provider: 'twilio'
      };
    }

    if (!this.twilioClient) {
      await this.initializeTwilio();
    }

    try {
      const twilioMessage = await this.twilioClient.messages.create({
        body: message.body,
        from: message.from || this.fromPhoneNumber,
        to: message.to
      });

      return {
        success: true,
        messageId: twilioMessage.sid,
        status: twilioMessage.status,
        provider: 'twilio'
      };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: 'twilio'
      };
    }
  }

  isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.fromPhoneNumber);
  }

  getConfigStatus(): { configured: boolean; missing: string[] } {
    const missing: string[] = [];
    
    if (!process.env.TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID');
    if (!process.env.TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN');
    if (!process.env.TWILIO_PHONE_NUMBER) missing.push('TWILIO_PHONE_NUMBER');
    
    return {
      configured: missing.length === 0,
      missing
    };
  }
}

// SMS Service Configuration
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'textbelt'; // 'textbelt' | 'twilio'

// Initialize the appropriate provider
let smsProvider: SMSProvider;

if (SMS_PROVIDER === 'twilio') {
  smsProvider = new TwilioProvider();
} else {
  smsProvider = new TextBeltProvider();
}

// Main SMS Service
export const smsService = {
  /**
   * Send an SMS message using the configured provider
   */
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    return smsProvider.sendSMS(message);
  },

  /**
   * Send a test ride confirmation SMS
   */
  async sendTestRideConfirmation(phone: string, returnTime: string, location: string = '1234 Electric Ave, San Diego, CA'): Promise<SMSResponse> {
    const message = `🚴 Your SDEBIKE test ride has started! Please return by ${returnTime}. Location: ${location}. Questions? Reply to this message.`;
    
    return this.sendSMS({
      to: phone,
      body: message
    });
  },

  /**
   * Send a test ride reminder SMS
   */
  async sendTestRideReminder(phone: string, returnTime: string): Promise<SMSResponse> {
    const message = `⏰ Reminder: Your SDEBIKE test ride ends at ${returnTime}. Please return the bike on time.`;
    
    return this.sendSMS({
      to: phone,
      body: message
    });
  },

  /**
   * Send a test ride completion SMS
   */
  async sendTestRideCompletion(phone: string): Promise<SMSResponse> {
    const message = `✅ Thank you for your SDEBIKE test ride! We hope you enjoyed it. Come back soon for another ride!`;
    
    return this.sendSMS({
      to: phone,
      body: message
    });
  },

  /**
   * Check if the current SMS provider is properly configured
   */
  isConfigured(): boolean {
    return smsProvider.isConfigured();
  },

  /**
   * Get the current SMS provider configuration status
   */
  getConfigStatus(): { configured: boolean; missing: string[]; provider: string } {
    const status = smsProvider.getConfigStatus();
    return {
      ...status,
      provider: SMS_PROVIDER
    };
  },

  /**
   * Get the current SMS provider name
   */
  getCurrentProvider(): string {
    return SMS_PROVIDER;
  },

  /**
   * Switch SMS provider (useful for testing)
   */
  setProvider(provider: 'textbelt' | 'twilio'): void {
    if (provider === 'twilio') {
      smsProvider = new TwilioProvider();
    } else {
      smsProvider = new TextBeltProvider();
    }
  }
};

// Export provider classes for testing
export { TextBeltProvider, TwilioProvider };
