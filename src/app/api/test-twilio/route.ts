import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/services/smsService';

export async function GET(request: NextRequest) {
  try {
    // Get SMS service configuration status
    const configStatus = smsService.getConfigStatus();
    
    return NextResponse.json({
      success: true,
      message: 'SMS Service Status',
      config: configStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting SMS service status:', error);
    return NextResponse.json(
      { error: 'Failed to get SMS service status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, message, type } = await request.json();
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    let smsResponse;
    
    // Send different types of SMS based on the type parameter
    switch (type) {
      case 'confirmation':
        smsResponse = await smsService.sendTestRideConfirmation(
          phone,
          '2:00 PM',
          '1234 Electric Ave, San Diego, CA'
        );
        break;
      case 'reminder':
        smsResponse = await smsService.sendTestRideReminder(phone, '2:00 PM');
        break;
      case 'completion':
        smsResponse = await smsService.sendTestRideCompletion(phone);
        break;
      default:
        // Send custom message
        smsResponse = await smsService.sendSMS({
          to: phone,
          body: message || 'Test message from SDEBIKE Test Ride App'
        });
    }

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully',
      smsResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}

// Test endpoint for checking SMS service configuration
export async function PUT(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'test-config') {
      const configStatus = smsService.getConfigStatus();
      
      return NextResponse.json({
        success: true,
        message: 'SMS Service Configuration Test',
        config: configStatus,
        provider: smsService.getCurrentProvider(),
        configured: smsService.isConfigured(),
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error testing SMS configuration:', error);
    return NextResponse.json(
      { error: 'Failed to test SMS configuration' },
      { status: 500 }
    );
  }
}
