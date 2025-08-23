import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    let { phone, message } = requestData;
    
    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone and message are required' },
        { status: 400 }
      );
    }
    
    // Fix phone number formatting for US numbers
    const originalPhone = phone;
    if (typeof phone === 'string') {
      // Remove all non-digits
      const digitsOnly = phone.replace(/\D/g, '');
      
      // If it's a 10-digit number, assume US and add +1
      if (digitsOnly.length === 10) {
        phone = `+1${digitsOnly}`;
      }
      // If it's 11 digits starting with 1, add +
      else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        phone = `+${digitsOnly}`;
      }
      // If it already has + and looks valid, keep as is
      else if (phone.startsWith('+') && digitsOnly.length >= 10) {
        phone = phone;
      }
      // For other cases, try to format as US number if reasonable
      else if (digitsOnly.length >= 10) {
        // Take the last 10 digits and add +1
        const last10 = digitsOnly.slice(-10);
        phone = `+1${last10}`;
      }
    }
    
    const apiKey = process.env.NEXT_PUBLIC_TEXTBELT_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SMS service not configured' },
        { status: 500 }
      );
    }
    
    console.log('📱 Sending SMS via server-side API...');
    console.log(`📞 Phone: ${originalPhone} -> Formatted: ${phone}`);
    console.log(`💬 Message: ${message.substring(0, 50)}...`);
    
    // Call TextBelt API from server-side
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        message: message,
        key: apiKey,
      }),
    });
    
    const result = await response.json();
    
    console.log('📋 TextBelt response:', result);
    
    if (result.success) {
      console.log('✅ SMS sent successfully via server API');
      return NextResponse.json({
        success: true,
        messageId: result.textId,
        quotaRemaining: result.quotaRemaining
      });
    } else {
      console.log('❌ SMS failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'SMS delivery failed' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('💥 SMS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}