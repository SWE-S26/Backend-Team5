# Beatza (Soundcloud Clone)

A modern music streaming and management platform backend built with **Node.js**, **Express**, **TypeScript**, and **MongoDB**. Features real-time communication via Socket.io, secure authentication, payment processing, and comprehensive API documentation.

**Node.js Version:** `20.19.4`

## Tech Stack

### Core

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript

### Database & Caching

- **MongoDB** - Primary database
- **Mongoose** - MongoDB ODM
- **Redis** - Caching layer

### Authentication & Security

- **JWT (jsonwebtoken)** - Token-based authentication
- **Passport.js** - OAuth 2.0 authentication (Google)
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

### Payment & Integration

- **Stripe** - Payment processing
- **Cloudinary** - Image hosting
- **Publitio** - Audio hosting
- **Azure Blob Storage** - File storage

### Real-time Communication

- **Socket.io** - Real-time bidirectional communication

### Media Processing

- **FFmpeg** - Audio/video processing
- **music-metadata** - Extract audio metadata
- **fluent-ffmpeg** - FFmpeg wrapper

### Additional Services

- **Firebase Admin** - Push notifications & authentication
- **Nodemailer** - Email service
- **Pino** - Logging framework

### Documentation & Validation

- **Swagger/OpenAPI** - API documentation
- **Zod** - Schema validation

## Features

- 🎵 **Music Management** - Upload, organize, and manage music tracks
- 👥 **User Profiles** - User authentication and profile management
- 🎧 **Playback** - Track playback history and statistics
- 💬 **Messaging** - Real-time messaging between users
- 🔔 **Notifications** - Push notifications and in-app alerts
- 💳 **Payment Integration** - Stripe payment processing
- 🔗 **Social Features** - Follow users, engagement tracking
- 📻 **Feed** - Personalized user feed
- 📋 **Playlists** - Create and manage playlists
- 🔐 **Authentication** - JWT & OAuth 2.0 (Google) support
- 📊 **Admin Dashboard** - Administrative controls
- ⚡ **Caching** - Redis-based performance optimization
- 📝 **API Documentation** - Swagger/OpenAPI documentation

## Prerequisites

- **Node.js** v20.19.4 or higher
- **npm** or **yarn** package manager
- **MongoDB** instance (local or cloud)
- **Redis** instance (for caching)
- **Git** for version control

### Required API Keys

- **Google OAuth** - Client ID and secret for authentication
- **Stripe** - Public and secret keys for payment processing
- **Cloudinary** - API credentials for image hosting
- **Publitio** - API key and secret for audio hosting
- **Firebase** - Service account JSON for push notifications
- **Azure Storage** - Connection string and container name for file storage
- **Nodemailer** - SMTP host, user, and password for email service

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/SWE-S26/Backend-Team5.git
cd Backend-Team5
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the example environment file and fill in your configuration:

```bash
cp .env.example .env
```

Edit `.env` with your API keys and configuration values:

```env
PORT=4123
MODE="DEV"
JWT_SECRET="your_jwt_secret_key_here"
REFRESH_JWT_SECRET="your_refresh_jwt_secret_key_here"
REDIRECT_PARAM_SECRET="your_redirect_param_secret_here"
REDIRECT_PARAM_SALT="your_redirect_param_salt_here"
MONGO_URI="your_mongodb_connection_string_here"
REDIS_URL="your_redis_connection_string_here"
PUBLITO_KEY="your_publito_key_here"
PUBLITO_SECRET="your_publito_secret_here"
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name_here"
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET="your_cloudinary_api_secret_here"
STRIPE_PUBLIC_KEY="your_stripe_public_key_here"
STRIPE_SECRET_KEY="your_stripe_secret_key_here"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret_here"
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_REDIRECT_URI="your_google_redirect_uri_here"
HOST_URL="https://beatza.me"
NODE_MAILER_HOST="your_mailer_host_here"
NODE_MAILER_USER="your_mailer_user_here"
NODE_MAILER_PASS="your_mailer_pass_here"
USE_REDIS="true"
LOG_LEVEL="info"
SWAGGER_URL="your_swagger_url_here"
AZURE_STORAGE_CONNECTION_STRING="your_azure_storage_connection_string_here"
AZURE_STORAGE_CONTAINER_NAME="your_azure_storage_container_name_here"
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your_firebase_project_id_here"}
```

### 4. Build the Project

```bash
npm run build
```

## Running the Server

### Development Mode (with hot reload)

```bash
npm run dev
```

Server will be available at `http://localhost:4123`

### Production Mode

```bash
npm start
```

## Available Scripts

| Script                     | Description                              |
| -------------------------- | ---------------------------------------- |
| `npm run dev`              | Start development server with hot reload |
| `npm run build`            | Build TypeScript to JavaScript           |
| `npm run build:swagger`    | Generate Swagger/OpenAPI documentation   |
| `npm run test`             | Run test suite with Jest                 |
| `npm run type-check`       | Type check without emitting files        |
| `npm run create:component` | Create new component scaffold            |
| `npm run migrations`       | Run database migrations                  |
| `npm run copy-assets`      | Copy static assets to dist folder        |

## Project Structure

```
src/
├── app.ts                          # Express app configuration
├── server.ts                       # Server initialization
├── config/                         # Configuration files
│   ├── connect.ts                 # Database connection
│   ├── redis.ts                   # Redis configuration
│   ├── cloudinary.ts              # Cloudinary setup
│   ├── constants.ts               # Application constants
│   └── shutDown.ts                # Graceful shutdown
├── modules/                       # Feature modules
│   ├── auth/                      # Authentication
│   ├── profile/                   # User profiles
│   ├── tracks/                    # Music tracks
│   ├── playlists/                 # Playlist management
│   ├── playback/                  # Playback history
│   ├── messaging/                 # Real-time messaging
│   ├── notifications/             # Notifications
│   ├── engagement/                # User engagement
│   ├── following/                 # Follow functionality
│   ├── feed/                      # User feed
│   ├── admin/                     # Admin controls
│   ├── payment/                   # Payment processing
│   └── integration/               # API integration
├── shared/                         # Shared utilities
│   ├── abstractions/              # Abstract services
│   ├── models/                    # MongoDB models
│   ├── middleware/                # Express middleware
│   ├── errors/                    # Error handling
│   ├── logger/                    # Logging
│   └── dtos/                      # Data transfer objects
└── sockets/                        # Socket.io handlers
    ├── socket.config.ts           # Socket configuration
    ├── socket.service.ts          # Socket service
    └── handlers/                  # Event handlers
```

## Module Architecture

Each feature module follows this structure:

```
module/
├── module.routes.ts               # API routes
├── module.controller.ts           # Request handling
├── module.repository.ts           # Data access layer
├── module.service.ts              # Business logic
├── module.registry.ts             # Module registration
└── dtos/                          # Request/Response DTOs
    ├── module.request.ts
    ├── module.response.ts
    └── module.request.*.ts
```

## API Documentation

API documentation is automatically generated and available via Swagger UI:

- **Development:** `http://localhost:4123/api/docs`
- **Production:** Check your `SWAGGER_URL` environment variable

To regenerate Swagger documentation:

```bash
npm run build:swagger
```

## Development Guidelines

### Naming Conventions

- **Variables:** camelCase
- **Classes:** PascalCase
- **Database Collections:** camelCase

### Code Standards

- All APIs must have Swagger/OpenAPI documentation
- Tests must pass before PR merge
- Maintain consistent file structure
- Resolve merge conflicts before creating PRs

### Important Rules

⚠️ **DO NOT:**

- Modify the integration files without explicit approval
- Add environment variables without team discussion
- Skip tests or type checking

✅ **DO:**

- Have services throw errors (caught by error handler middleware)
- Document all API endpoints
- Run tests before submitting PR
- Keep the project structure consistent

## Authentication

### JWT Authentication

The API uses JWT tokens for protected endpoints:

```
Authorization: Bearer <jwt_token>
```

### OAuth 2.0 (Google)

Google OAuth integration is available for user registration/login.

## Database Migrations

Run migrations to update database schema:

```bash
npm run migrations
```

## Testing

Run the test suite:

```bash
npm test
```

## Logging

The project uses Pino for structured logging. Adjust log level via `LOG_LEVEL` environment variable:

```env
LOG_LEVEL="info"  # Options: trace, debug, info, warn, error, fatal
```

## Error Handling

All errors are caught by the centralized error handler middleware and returned in a consistent format:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## Recommended VS Code Extensions

1. **Better Comments** - Enhanced comment highlighting
2. **DotENV** - .env file syntax highlighting
3. **GitLens** - Git integration and blame
4. **Mongo Snippets for Node.js** - MongoDB snippets
5. **Node Extension Pack** - Node.js development tools
6. **Swagger Snippets** - OpenAPI/Swagger support

## Contributing

1. Create a feature branch from `main`
2. Implement your changes following code standards
3. Write/update tests for new functionality
4. Ensure type checking passes: `npm run type-check`
5. Build and test: `npm run build && npm test`
6. Document new APIs with Swagger comments
7. Create a Pull Request with detailed description

## Troubleshooting

### Port Already in Use

```bash
# Change port in .env or specify on command line
PORT=5000 npm run dev
```

### MongoDB Connection Issues

- Verify `MONGO_URI` is correct
- Check MongoDB service is running
- Ensure whitelist your IP in MongoDB Atlas (if using cloud)

### Redis Connection Issues

- Verify `REDIS_URL` is correct
- Check Redis service is running
- Set `USE_REDIS=false` to disable caching temporarily

### Missing Environment Variables

- Copy `.env.example` to `.env`
- Fill in all required API keys
- Restart the server

## Support

For issues, questions, or contributions, please create an issue or pull request on the GitHub repository.

---

**Last Updated:** May 2026  
**Team:** Backend Team 5  
**License:** ISC
