# Playdoo - Sports Facility Booking Platform

> **Watch the Demo:**  
> [![YouTube Video](https://img.shields.io/badge/Watch%20on-YouTube-red?logo=youtube)](https://youtu.be/2OSK_EYY56Q)

[https://youtu.be/2OSK_EYY56Q](https://youtu.be/2OSK_EYY56Q)

Playdoo is a comprehensive sports facility booking platform that connects facility owners with users looking to book sports venues. The platform provides robust analytics, user management, and booking capabilities with AI-powered fraud detection.

## 🚀 Features

### For Users

- **Facility Discovery**: Browse and search sports facilities
- **Real-time Booking**: Book facilities with instant confirmation
- **User Analytics**: Track booking history and preferences
- **Profile Management**: Comprehensive user profiles with location data

### For Facility Owners

- **Analytics Dashboard**: Comprehensive revenue, booking, and occupancy analytics
- **Facility Management**: Manage facilities, amenities, and availability
- **Revenue Tracking**: Monitor total revenue and booking growth
- **Occupancy Insights**: Track facility utilization rates

### For Administrators

- **User Management**: Complete user analytics and management system
- **Activity Logs**: Comprehensive logging and monitoring
- **Report Management**: Handle user and facility reports
- **System Analytics**: Platform-wide insights and metrics

### Security & Monitoring

- **AI-Powered Fraud Detection**: Advanced fraud prevention system
- **Activity Logging**: Detailed audit trails
- **Report System**: User and facility reporting capabilities
- **CCTV Integration**: Security monitoring features

## 🛠️ Technology Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI component library
- **Lucide React** - Icon library

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database toolkit and ORM
- **Authentication** - Custom auth implementation
- **OpenTelemetry** - Observability and monitoring

### Database

- **PostgreSQL** - Primary database (via Prisma)

### DevOps & Deployment

- **Docker** - Containerization with multi-stage builds
- **Docker Compose** - Local development environment
- **Google Cloud Platform** - Cloud deployment
- **Nginx** - Reverse proxy and load balancing
- **Grafana** - Monitoring and analytics

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **pnpm** - Package manager
- **Swagger** - API documentation

## 📁 Project Structure

```
playdoo/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   ├── admin/                   # Admin dashboard pages
│   ├── owner/                   # Owner dashboard pages
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── admin/                   # Admin-specific components
│   ├── owner/                   # Owner-specific components
│   └── ui/                      # Shared UI components
├── config/                      # Configuration files
├── hooks/                       # Custom React hooks
│   └── swr/                     # SWR data fetching hooks
├── lib/                         # Utility libraries
│   └── docs/                    # API documentation
├── prisma/                      # Database schema and migrations
├── types/                       # TypeScript type definitions
├── scripts/                     # Database seeding scripts
├── grafana/                     # Monitoring configuration
├── nginx/                       # Nginx configuration
└── public/                      # Static assets
```

## 🔧 Setup & Installation

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL
- Docker (optional)

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd playdoo
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   ```

   Configure your environment variables in `.env`

4. **Database setup**

   ```bash
   # Run Prisma migrations
   pnpm prisma migrate dev

   # Seed the database
   pnpm tsx scripts/seed-amenities.ts
   ```

5. **Start development server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

### Docker Development

1. **Start with Docker Compose**

   ```bash
   docker-compose up -d
   ```

2. **For production build**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🌐 Deployment

### Google Cloud Platform

Use the provided deployment script:

```bash
./deploy-to-gcp.sh
```

### Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

## 📊 Key Features Breakdown

### Analytics System

- Revenue tracking and growth metrics
- Booking analytics with growth indicators
- Occupancy rate calculations
- User behavior analytics
- Real-time dashboard updates

### User Management

- Comprehensive user profiles
- Location-based services
- Phone and email verification
- Activity tracking and logging
- Role-based access control

### Booking System

- Real-time availability checking
- Instant booking confirmation
- Facility amenity management
- Pricing and discount systems
- Booking history tracking

### Reporting & Moderation

- User report system
- Facility quality reports
- Admin moderation tools
- Automated fraud detection
- Appeal and resolution workflows

## 🔐 Security Features

- **Fraud Detection**: AI-powered anomaly detection
- **Activity Logging**: Comprehensive audit trails
- **Authentication**: Secure user authentication system
- **Data Validation**: Input validation and sanitization
- **Rate Limiting**: API rate limiting and abuse prevention

## 📈 Monitoring & Analytics

- **Grafana Dashboards**: Custom monitoring dashboards
- **OpenTelemetry**: Distributed tracing and metrics
- **Activity Logs**: Detailed user and system activity tracking
- **Performance Monitoring**: Real-time performance insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 API Documentation

API documentation is available via Swagger at `/api/docs` when running the development server.

## 🔍 Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Prisma Documentation](https://www.prisma.io/docs) - Database toolkit and ORM
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Re-usable component library

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.
