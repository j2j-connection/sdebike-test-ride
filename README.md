# 🚴‍♂️ SD Electric Bike Test Ride Application

A modern, digital solution for managing electric bike test rides at SD Electric Bike. This application replaces the traditional paper-based process with a streamlined digital experience that includes photo ID capture, digital waivers, and secure payment authorization.

## ✨ Features

- **📱 Digital ID Capture**: Take photos of customer IDs instead of holding them physically
- **✍️ Digital Waivers**: Electronic signature capture with legal compliance
- **💳 Secure Payments**: $1 authorization hold via Stripe (no charges made)
- **🍎 Digital Wallets**: Apple Pay and Google Pay support
- **📊 Admin Dashboard**: Complete test ride history and customer management
- **📱 Mobile-First Design**: Optimized for tablets and mobile devices
- **🔒 Secure Storage**: Supabase with Row Level Security (RLS)

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Storage)
- **Payments**: Stripe Payment Intents + Elements
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase account
- Stripe account

### Installation
```bash
# Clone the repository
git clone https://github.com/j2j-connection/sdebike-test-ride.git
cd sdebike-test-ride

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🌐 Production

**Live Application**: [https://sdebike-test-ride-r6p9s5bdb-j2-j.vercel.app](https://sdebike-test-ride-r6p9s5bdb-j2-j.vercel.app)

**Status**: ✅ Fully deployed and functional

## 💳 Payment Integration

The application uses Stripe for secure payment authorization:

- **Amount**: $1 authorization hold (no charges)
- **Methods**: Credit cards, Apple Pay, Google Pay
- **Security**: PCI compliant, no card data stored
- **Flow**: Authorization → Test Ride → Automatic release

## 📱 Customer Flow

1. **Contact Information**: Name, phone, email
2. **Bike Selection**: Choose model and duration
3. **ID Verification**: Photo capture of government ID
4. **Digital Waiver**: Electronic signature
5. **Payment Authorization**: $1 hold via Stripe
6. **Confirmation**: Test ride details and instructions

## 👨‍💼 Admin Features

- **Dashboard**: View all test rides and customer data
- **Search & Filter**: Find specific customers or dates
- **Document Access**: View ID photos and signed waivers
- **Payment Status**: Track authorization status
- **Export**: Download customer data for follow-up

## 🔧 Configuration

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Database Setup
```bash
# Run the database schema
node setup-database.js

# Set up storage buckets
node setup-storage.js
```

## 🧪 Testing

```bash
# Run automated tests
npm run test:qa

# Test payment flow
node qa/payment-flow-test.js

# Test Stripe integration
node qa/stripe-payment-test.js
```

## 📚 Documentation

- **[AI Context](AI_CONTEXT.md)**: Comprehensive technical documentation
- **[Stripe Integration Guide](STRIPE_INTEGRATION_GUIDE.md)**: Payment system details
- **[Development Log](DEVELOPMENT_LOG.md)**: Issue tracking and resolutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is proprietary software for SD Electric Bike.

## 🆘 Support

For technical support or questions about the application, please refer to the documentation or contact the development team.

---

**Built with ❤️ for SD Electric Bike**
