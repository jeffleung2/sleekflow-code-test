# Sleekflow TODO Application

A full-stack TODO application with FastAPI backend, React frontend, and PostgreSQL database.

## Architecture

- **Backend**: FastAPI REST API (Python)
- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL 15

## Quick Start with Docker Compose

### Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

### Running the Application

1. Start all services:
```bash
docker-compose up -d
```

2. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/docs
   - Database: localhost:5432

3. View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f webapp
docker-compose logs -f db
```

4. Stop all services:
```bash
docker-compose down
```

5. Stop and remove volumes (clears database):
```bash
docker-compose down -v
```

### Setup Database
```bash
cd backend/migrations && ./run_migrations_docker.sh
```

### Development Mode

The docker-compose.yml is configured for development with:
- Hot reload enabled for both backend and frontend
- Source code mounted as volumes
- Node modules preserved in anonymous volume

### Environment Variables

You can customize the following in `docker-compose.yml`:

**Database:**
- `POSTGRES_USER`: Database username (default: postgres)
- `POSTGRES_PASSWORD`: Database password (default: postgres)
- `POSTGRES_DB`: Database name (default: todo_db)

**Backend:**
- `DATABASE_URL`: PostgreSQL connection string

**Frontend:**
- `VITE_API_URL`: Backend API URL

### Rebuilding Services

If you make changes to Dockerfile or dependencies:

```bash
# Rebuild all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

### Useful Commands

```bash
# Check service status
docker-compose ps

# Execute command in container
docker-compose exec backend bash
docker-compose exec webapp sh
docker-compose exec db psql -U postgres -d todo_db

# Remove all stopped containers
docker-compose rm

# View resource usage
docker stats
```

## Troubleshooting

**Database connection issues:**
- Ensure PostgreSQL container is healthy: `docker-compose ps`
- Check logs: `docker-compose logs db`

**Port conflicts:**
- Ensure ports 5432, 8080, and 5173 are not in use
- Modify port mappings in docker-compose.yml if needed

**Build failures:**
- Clear Docker cache: `docker-compose build --no-cache`
- Remove volumes: `docker-compose down -v`
