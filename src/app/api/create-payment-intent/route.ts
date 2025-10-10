import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // First check if Stripe key is properly loaded
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    const { amount, customerEmail, testRideId, isRental, rentalDetails } = await request.json();

    // Determine payment type and settings
    const isRentalPayment = isRental === true;
    const paymentType = isRentalPayment ? 'rental_charge' : 'test_ride_hold';
    const captureMethod = isRentalPayment ? 'automatic' : 'manual';

    // Build description
    let description = '';
    if (isRentalPayment && rentalDetails) {
      if (rentalDetails.cartItems && rentalDetails.itemCount) {
        // Cart-based rental
        description = `Bike Rental (${rentalDetails.itemCount} bikes) - ${customerEmail}`;
      } else {
        // Single-item rental (legacy)
        description = `Bike Rental - ${rentalDetails.duration || 1}hr - ${customerEmail}`;
      }
    } else {
      description = `Test Ride Hold - ${customerEmail}`;
    }

    // Build metadata
    const metadata: Record<string, string> = {
      testRideId: testRideId,
      customerEmail: customerEmail,
      type: paymentType,
    };

    // Add rental-specific metadata
    if (isRentalPayment && rentalDetails) {
      if (rentalDetails.cartItems && rentalDetails.itemCount) {
        // Cart-based rental metadata
        metadata.itemCount = rentalDetails.itemCount.toString();
        metadata.totalPrice = rentalDetails.totalPrice.toString();
        metadata.cartItems = JSON.stringify(rentalDetails.cartItems);
      } else {
        // Single-item rental metadata (legacy)
        metadata.bikeCategory = rentalDetails.bikeCategory;
        metadata.duration = rentalDetails.duration.toString();
        metadata.price = rentalDetails.price.toString();
      }
    }

    // Build URLSearchParams
    const params = new URLSearchParams({
      amount: amount.toString(),
      currency: 'usd',
      'automatic_payment_methods[enabled]': 'true',
      capture_method: captureMethod,
      description: description,
    });

    // Add metadata to params
    Object.entries(metadata).forEach(([key, value]) => {
      params.append(`metadata[${key}]`, value);
    });

    // Create PaymentIntent using direct fetch instead of Stripe SDK
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe API error: ${response.status} - ${errorText}`);
    }

    const paymentIntent = await response.json();

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
