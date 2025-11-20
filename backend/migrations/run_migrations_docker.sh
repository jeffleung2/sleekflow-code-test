#!/bin/bash
# Script to run database migrations using Docker
# Usage: ./run_migrations_docker.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if docker-compose is running
print_info "Checking if Docker containers are running..."
cd "$SCRIPT_DIR/../.."

if ! docker-compose ps | grep -q "sleekflow2-db"; then
    print_error "Docker containers are not running. Please run 'docker-compose up -d' first."
    exit 1
fi

# Wait for database to be healthy
print_info "Waiting for database to be ready..."
for i in {1..30}; do
    if docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        print_info "Database is ready!"
        break
    fi
    echo -n "."
    sleep 1
    if [ $i -eq 30 ]; then
        print_error "Database is not ready after 30 seconds"
        exit 1
    fi
done

# Run migrations
print_info "Running database migrations..."

# Migration files to run (in order)
MIGRATIONS=(
    "20251120000001_create_user.sql"
    "20251120000002_create_todo_list.sql"
    "20251120000003_create_todos.sql"
    "20251120000004_create_activity_logs.sql"
    "20251120000005_create_list_permissions.sql"
    "20251120000006_create_todo_tags.sql"
    "20251120000007_create_todo_tags.sql"
)

FAILED=0
for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$SCRIPT_DIR/$migration" ]; then
        print_info "Applying migration: $migration"
        
        if docker-compose exec -T db psql -U postgres -d todo_db2 < "$SCRIPT_DIR/$migration"; then
            print_info "✓ Successfully applied: $migration"
        else
            print_error "✗ Failed to apply: $migration"
            FAILED=1
            break
        fi
    else
        print_warning "Migration file not found: $migration"
    fi
done

if [ $FAILED -eq 0 ]; then
    print_info "All migrations completed successfully!"
else
    print_error "Migration failed!"
    exit 1
fi
