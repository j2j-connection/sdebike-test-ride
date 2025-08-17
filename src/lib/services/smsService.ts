// SMS Service - Browser-safe TextBelt integration
// Twilio integration can be added later when needed

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

// TextBelt Provider Implementation
class TextBeltProvider {
  private apiKey: string;
  private baseUrl = 'https://textbelt.com/text';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_TEXTBELT_API_KEY || '';
  }

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'TextBelt not configured. Please set NEXT_PUBLIC_TEXTBELT_API_KEY environment variable.',
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
    
    if (!process.env.NEXT_PUBLIC_TEXTBELT_API_KEY) missing.push('NEXT_PUBLIC_TEXTBELT_API_KEY');
    
    return {
      configured: missing.length === 0,
      missing
    };
  }
}

// Initialize the TextBelt provider
const smsProvider = new TextBeltProvider();

// Main SMS Service
export const smsService = {
  /**
   * Send an SMS message using TextBelt
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
   * Check if the SMS service is properly configured
   */
  isConfigured(): boolean {
    return smsProvider.isConfigured();
  },

  /**
   * Get the SMS service configuration status
   */
  getConfigStatus(): { configured: boolean; missing: string[]; provider: string } {
    const status = smsProvider.getConfigStatus();
    return {
      ...status,
      provider: 'textbelt'
    };
  },

  /**
   * Get the current SMS provider name
   */
  getCurrentProvider(): string {
    return 'textbelt';
  },

  /**
   * Note: Twilio integration will be added later
   * For now, this service uses TextBelt for development and testing
   */
  getProviderInfo(): { current: string; note: string } {
    return {
      current: 'textbelt',
      note: 'Twilio integration will be added when needed for production'
    };
  }
};

// Export provider class for testing
export { TextBeltProvider };
