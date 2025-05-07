# Bruno AI - Setting Up and Running the Project

This document provides detailed instructions for setting up and running the Bruno AI Financial Intelligence Platform. Follow these steps to get the system up and running.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL (v14 or higher)
- Docker and Docker Compose (for containerized deployment)
- Git

## Development Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/bruno-ai.git
cd bruno-ai
```

### 2. Environment Configuration

Copy the example environment file and update it with your specific settings:

```bash
cp .env.example .env
```

Edit the `.env` file and update the following variables:
- `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL database credentials
- `JWT_SECRET` - A secure random string for JWT token signing
- `REACT_APP_OPENAI_API_KEY` - Your OpenAI API key

### 3. Install Dependencies

Install the required npm packages:

```bash
npm install
```

### 4. Set Up the Database

Ensure PostgreSQL is running and create a new database:

```bash
createdb bruno_ai_dev
```

The application will automatically create the required tables when it first runs.

### 5. Set Up Weaviate

For local development, you can run Weaviate using Docker:

```bash
docker run -d -p 8080:8080 --name weaviate-bruno-ai \
    -e QUERY_DEFAULTS_LIMIT=25 \
    -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
    -e DEFAULT_VECTORIZER_MODULE=none \
    -e ENABLE_MODULES=text2vec-openai \
    -e OPENAI_APIKEY=your-openai-api-key \
    semitechnologies/weaviate:1.19.6
```

### 6. Run the Application

Start the development server with both frontend and backend:

```bash
npm run dev
```

This will start:
- React frontend on http://localhost:3000
- Express backend API on http://localhost:5000

## Production Deployment

### 1. Using Docker Compose

First, make sure your `.env` file is properly configured for production.

Build and start the containers:

```bash
docker-compose up -d
```

This will start the following services:
- React+Express app
- PostgreSQL database
- Weaviate vector database
- Nginx for HTTPS and reverse proxy

### 2. SSL Certificate Setup

Before deploying to production, you need to set up SSL certificates:

```bash
mkdir -p nginx/ssl
```

Place your SSL certificate and key files in the `nginx/ssl` directory:
- `bruno-ai.crt` - SSL certificate
- `bruno-ai.key` - SSL private key

For a production environment, you should use certificates from a trusted certificate authority like Let's Encrypt.

### 3. Monitoring and Logs

To view logs from the containers:

```bash
# View logs from all services
docker-compose logs

# View logs from a specific service
docker-compose logs app
docker-compose logs postgres
docker-compose logs weaviate
```

## Database Management

### Backup

To create a backup of the PostgreSQL database:

```bash
docker-compose exec postgres pg_dump -U postgres bruno_ai > backup-$(date +%Y%m%d).sql
```

### Restore

To restore a backup:

```bash
cat backup-file.sql | docker-compose exec -T postgres psql -U postgres -d bruno_ai
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Ensure the database exists and credentials are correct:
   ```bash
   docker-compose exec postgres psql -U postgres -c "SELECT 1"
   ```

### Vector Database Issues

If you encounter issues with Weaviate:

1. Verify Weaviate is running:
   ```bash
   docker-compose ps weaviate
   ```

2. Check Weaviate logs:
   ```bash
   docker-compose logs weaviate
   ```

3. Test Weaviate REST API:
   ```bash
   curl http://localhost:8080/v1/.well-known/ready
   ```

## Security Considerations

- Regularly update all dependencies: `npm audit fix`
- Rotate API keys and JWT secrets periodically
- Implement IP whitelisting for production environments
- Set up regular database backups
- Enable database encryption
- Configure proper firewall rules

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Weaviate Documentation](https://weaviate.io/developers/weaviate)
- [Sequelize ORM Documentation](https://sequelize.org/master/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)

For any additional help, please contact support@bruno-ai.com or join our [Discord community](https://discord.gg/bruno-ai).
