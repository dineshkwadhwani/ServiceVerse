# ServiceVerse Frontend

Modern React + TypeScript SaaS application for multi-utility service platform.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Add your Firebase credentials to .env.local
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
# Check for linting errors
npm run lint

# Type check
npm run type-check
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Layout/         # Layout components
│   ├── Shared/         # Shared components
│   ├── SuperAdmin/     # SuperAdmin specific components
│   ├── AccountManager/ # AccountManager specific components
│   ├── ServiceProvider/ # ServiceProvider specific components
│   └── Customer/       # Customer specific components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API service functions
├── store/              # Zustand stores (state management)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # Global styles
└── main.tsx           # Entry point
```

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Phone & Email)
3. Enable Firestore Database
4. Enable Cloud Storage
5. Enable Cloud Messaging
6. Copy credentials to `.env.local`

### Tailwind CSS

Tailwind is configured with custom colors matching the design system. Customize in `tailwind.config.js`.

### State Management

Uses Zustand for lightweight state management:
- `authStore` - Authentication state
- `orderStore` - Order management
- `notificationStore` - Toast notifications

## 📦 Dependencies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Firebase** - Backend services
- **Zustand** - State management
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 🎨 Styling

- Tailwind CSS for utility-first styling
- Global styles in `src/styles/globals.css`
- Component-level CSS modules where needed
- Custom design tokens in `tailwind.config.js`

## 🔐 Authentication

Firebase Authentication with:
- Email + Password login
- Phone OTP (future)
- Custom claims for role-based access

## 📱 Mobile Support

Built with Capacitor for iOS/Android support:
```bash
# Build mobile app
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t serviceverse-frontend .

# Run container
docker run -p 3000:3000 serviceverse-frontend
```

## 📚 Documentation

- [Architecture](../SERVICEVERSE_ARCHITECTURE.md)
- [API Reference](../docs/API_REFERENCE.md)
- [Contributing Guidelines](../docs/CONTRIBUTING.md)

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

This project is private and confidential.

## 📞 Support

For issues and questions, contact the development team.
