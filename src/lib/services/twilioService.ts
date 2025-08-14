import twilio from 'twilio';

// Twilio client configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromPhoneNumber) {
  console.warn('Twilio environment variables not configured. SMS functionality will be disabled.');
}

// Initialize Twilio client only if credentials are available
const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

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
}

export const twilioService = {
  /**
   * Send an SMS message using Twilio
   */
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    if (!twilioClient) {
      return {
        success: false,
        error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
      };
    }

    try {
      const twilioMessage = await twilioClient.messages.create({
        body: message.body,
        from: message.from || fromPhoneNumber,
        to: message.to
      });

      return {
        success: true,
        messageId: twilioMessage.sid,
        status: twilioMessage.status
      };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
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
   * Check if Twilio is properly configured
   */
  isConfigured(): boolean {
    return !!twilioClient;
  },

  /**
   * Get Twilio configuration status
   */
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
};
