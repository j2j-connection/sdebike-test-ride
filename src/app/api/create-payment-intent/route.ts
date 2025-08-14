import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
	apiVersion: '2024-12-18.acacia',
}) : null

export async function POST(request: NextRequest) {
	try {
		const { amount, customerEmail, testRideId } = await request.json();

		// Basic validation (used by QA tests too)
		if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
			return NextResponse.json(
				{ error: 'Invalid amount' },
				{ status: 500 }
			);
		}
		if (!testRideId || typeof testRideId !== 'string') {
			return NextResponse.json(
				{ error: 'Missing testRideId' },
				{ status: 500 }
			);
		}

		// Mock mode if enabled or missing Stripe key (for local QA without real keys)
		if (process.env.MOCK_STRIPE === 'true' || !stripe) {
			const mockId = `pi_test_${Date.now()}`
			const mockClientSecret = `cs_test_${Math.random().toString(36).slice(2)}`
			return NextResponse.json({
				clientSecret: mockClientSecret,
				paymentIntentId: mockId,
			});
		}

		// Create a PaymentIntent with the order amount and currency
		const paymentIntent = await stripe.paymentIntents.create({
			amount: amount, // Amount in cents
			currency: 'usd',
			automatic_payment_methods: {
				enabled: true,
			},
			metadata: {
				testRideId,
				customerEmail,
				type: 'test_ride_hold',
			},
			// For test rides, we'll capture the payment later if needed
			capture_method: 'manual',
			// Set a description
			description: `Test Ride Hold - ${customerEmail}`,
		});

		return NextResponse.json({
			clientSecret: paymentIntent.client_secret,
			paymentIntentId: paymentIntent.id,
		});
	} catch (error) {
		console.error('Error creating payment intent:', error);
		return NextResponse.json(
			{ error: 'Failed to create payment intent' },
			{ status: 500 }
		);
	}
}
