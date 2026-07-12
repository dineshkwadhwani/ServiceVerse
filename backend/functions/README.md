# ServiceVerse Cloud Functions Backend

Production-grade Firebase Cloud Functions for the ServiceVerse platform.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Firebase CLI
- Google Cloud Project with Firebase enabled

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your credentials to .env
```

### Development

```bash
# Build TypeScript
npm run build
```

This project connects directly to Cloud Firebase — there is no local emulator. Deploy to test changes:

### Deployment

```bash
# Deploy to Firebase
firebase deploy --only functions

# View logs
firebase functions:log
```

## 📁 Project Structure

```
src/
├── handlers/              # HTTP request handlers
│   ├── auth/             # Authentication handlers
│   ├── services/         # Service management
│   ├── serviceProviders/ # SP management
│   ├── orders/          # Order management
│   ├── payments/        # Payment handling
│   ├── webhooks/        # External webhooks
│   └── analytics/       # Analytics endpoints
├── services/            # Business logic
├── middleware/          # Express middleware
│   ├── auth.ts         # Authentication
│   └── errorHandler.ts # Error handling
├── utils/              # Utility functions
│   ├── firebase.ts    # Firebase setup
│   ├── logger.ts      # Logging
│   ├── validators.ts  # Validation
│   └── formatters.ts  # Data formatting
├── types/             # TypeScript types
└── index.ts          # Entry point
```

## 🔐 Security

- Firebase Security Rules for Firestore
- Custom claims for role-based access
- Request validation and sanitization
- Rate limiting on sensitive endpoints
- CORS protection

## 💳 Payment Integration

### Razorpay Setup

1. Create Razorpay account at [razorpay.com](https://razorpay.com)
2. Get API keys (Key ID and Secret)
3. Add to `.env`:
   ```
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_secret
   ```

### Payment Flow

```
Client initiates payment
    ↓
Create Razorpay order (backend)
    ↓
Client opens Razorpay checkout
    ↓
Payment successful
    ↓
Razorpay webhook to backend
    ↓
Verify signature & settle funds
    ↓
Update order status to PAID
```

## 📧 Email Integration

### Resend Setup

1. Create account at [resend.com](https://resend.com)
2. Get API key
3. Add to `.env`:
   ```
   RESEND_API_KEY=your_api_key
   ```

### Email Events

- Order created
- Order completed
- Payment received
- Custom notifications

## 🔔 Notifications

### Firebase Cloud Messaging

- Push notifications to mobile apps
- Topic-based subscriptions
- Broadcast messaging
- Delivery tracking

## 📊 Database

### Firestore Structure

```
firestore/
├── services/
├── serviceProviders/
├── customers/
├── orders/
├── payments/
├── notifications/
└── ...
```

### Indexes

Required composite indexes:
- orders: (serviceProviderId, status, createdAt)
- payments: (customerId, status, createdAt)
- customerServiceProviderLinks: (customerId, status)

Create indexes:
```bash
firebase firestore:indexes
```

## 🧪 Testing

```bash
# Run tests
npm test

# With coverage
npm test -- --coverage
```

## 📝 Logging

Logger utility available in `src/utils/logger.ts`:

```typescript
import { Logger } from '@/utils/logger';

const logger = new Logger('ModuleName');
logger.info('Message', { context });
logger.error('Error', error, { context });
```

## 🚢 Monitoring

### Firebase Console
- [functions.firebase.com](https://console.firebase.google.com/functions)

### Logs
```bash
firebase functions:log --only api
```

### Metrics
- Execution time
- Memory usage
- Error rates
- Invocation count

## 🔄 Continuous Integration

### GitHub Actions

Deploy on push to main:

```yaml
name: Deploy Functions
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

## 📚 API Documentation

See [API_REFERENCE.md](../../docs/API_REFERENCE.md) for complete endpoint documentation.

## 🤝 Contributing

1. Create feature branch
2. Implement functionality
3. Add tests
4. Update documentation
5. Submit pull request

## 📄 License

Private & Confidential

## 📞 Support

Contact the development team for issues or questions.
