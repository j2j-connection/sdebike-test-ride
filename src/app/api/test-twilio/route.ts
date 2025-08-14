import { NextRequest, NextResponse } from 'next/server';
import { twilioService } from '@/lib/services/twilioService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message, testType } = body;

    // Validate input
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check Twilio configuration
    const configStatus = twilioService.getConfigStatus();
    if (!configStatus.configured) {
      return NextResponse.json(
        { 
          error: 'Twilio not configured',
          missing: configStatus.missing,
          message: 'Please set the required environment variables'
        },
        { status: 500 }
      );
    }

    let smsResponse: any;

    // Handle different test types
    switch (testType) {
      case 'confirmation':
        smsResponse = await twilioService.sendTestRideConfirmation(
          phone, 
          new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        break;
      
      case 'reminder':
        smsResponse = await twilioService.sendTestRideReminder(
          phone, 
          new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        break;
      
      case 'completion':
        smsResponse = await twilioService.sendTestRideCompletion(phone);
        break;
      
      case 'custom':
        if (!message) {
          return NextResponse.json(
            { error: 'Message is required for custom test type' },
            { status: 400 }
          );
        }
        smsResponse = await twilioService.sendSMS({
          to: phone,
          body: message
        });
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid test type. Use: confirmation, reminder, completion, or custom' },
          { status: 400 }
        );
    }

    if (smsResponse.success) {
      return NextResponse.json({
        success: true,
        messageId: smsResponse.messageId,
        status: smsResponse.status,
        message: 'SMS sent successfully'
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: smsResponse.error 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Test Twilio API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return Twilio configuration status
  const configStatus = twilioService.getConfigStatus();
  
  return NextResponse.json({
    configured: configStatus.configured,
    missing: configStatus.missing,
    message: configStatus.configured 
      ? 'Twilio is properly configured' 
      : 'Twilio is not configured. Please set the required environment variables.'
  });
}
