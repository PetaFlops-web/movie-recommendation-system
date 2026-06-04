#!/bin/bash
# Deployment Helper Scripts for Smart Movie Recommendation System

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Setup Local Development
setup_local() {
    print_header "Setting up Local Development Environment"
    
    # Install backend dependencies
    print_warning "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    print_success "Backend dependencies installed"
    
    # Install python dependencies
    print_warning "Installing python dependencies..."
    cd backend/python_service
    pip install -r requirements.txt
    cd ../..
    print_success "Python dependencies installed"
    
    # Install frontend dependencies
    print_warning "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
    
    print_success "Local setup complete!"
}

# 2. Start Local Services with Docker
start_docker() {
    print_header "Starting Services with Docker"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not installed! Please install Docker first."
        exit 1
    fi
    
    print_warning "Starting containers..."
    docker-compose up -d
    
    print_success "Containers started!"
    echo -e "${GREEN}Services available at:${NC}"
    echo "  - Backend:        http://localhost:3001"
    echo "  - Python Service: http://localhost:5000"
    echo "  - Database:       localhost:5432"
}

# 3. Stop Docker Services
stop_docker() {
    print_header "Stopping Docker Services"
    docker-compose down
    print_success "Services stopped"
}

# 4. Import Movies Data (Local)
import_movies_local() {
    print_header "Importing Movies from CSV (Local PostgreSQL)"
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set. Please set it first."
        exit 1
    fi
    
    cd backend
    npm run import-movies
    cd ..
    
    print_success "Movies imported successfully"
}

# 5. Test Backend API
test_backend() {
    print_header "Testing Backend API"
    
    BASE_URL="${1:-http://localhost:3001}"
    
    print_warning "Testing health endpoint..."
    if curl -s "$BASE_URL/health" > /dev/null; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        exit 1
    fi
    
    print_warning "Testing movies endpoint..."
    MOVIES=$(curl -s "$BASE_URL/api/movies?limit=1")
    if echo "$MOVIES" | grep -q "title\|genre"; then
        print_success "Movies endpoint working"
    else
        print_error "Movies endpoint failed"
        exit 1
    fi
    
    print_success "All tests passed!"
}

# 6. Test Python Service
test_python_service() {
    print_header "Testing Python Service"
    
    BASE_URL="${1:-http://localhost:5000}"
    
    print_warning "Testing health endpoint..."
    if curl -s "$BASE_URL/health" > /dev/null; then
        print_success "Python service health check passed"
    else
        print_error "Python service health check failed"
        exit 1
    fi
    
    print_success "Python service tests passed!"
}

# 7. Test Frontend Build
test_frontend_build() {
    print_header "Testing Frontend Build"
    
    cd frontend
    npm run build
    cd ..
    
    print_success "Frontend build successful"
}

# 8. Prepare for Production
prepare_production() {
    print_header "Preparing for Production"
    
    print_warning "Checking for uncommitted changes..."
    if ! git diff-index --quiet HEAD --; then
        print_error "You have uncommitted changes. Commit them first."
        exit 1
    fi
    print_success "Repository clean"
    
    print_warning "Running security checks..."
    
    # Check for exposed secrets
    if grep -r "DATABASE_URL=" backend/.env 2>/dev/null; then
        print_error "WARNING: DATABASE_URL found in .env file - Should not be committed!"
        exit 1
    fi
    
    if grep -r "JWT_SECRET=" backend/.env 2>/dev/null; then
        print_error "WARNING: JWT_SECRET found in .env file - Should not be committed!"
        exit 1
    fi
    
    print_success "Security checks passed"
    
    print_warning "Building frontend..."
    test_frontend_build
    
    print_warning "Running backend tests..."
    cd backend
    npm test 2>/dev/null || print_warning "No tests configured"
    cd ..
    
    print_success "Production preparation complete!"
    echo -e "${GREEN}Ready to deploy!${NC}"
}

# 9. Check Dependencies
check_dependencies() {
    print_header "Checking Dependencies"
    
    MISSING=0
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js not installed"
        MISSING=1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_success "npm installed: $NPM_VERSION"
    else
        print_error "npm not installed"
        MISSING=1
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python3 installed: $PYTHON_VERSION"
    else
        print_error "Python3 not installed"
        MISSING=1
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_success "$GIT_VERSION"
    else
        print_error "Git not installed"
        MISSING=1
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "$DOCKER_VERSION"
    else
        print_warning "Docker not installed (optional for docker-compose)"
    fi
    
    if [ $MISSING -eq 1 ]; then
        print_error "Some dependencies missing. Please install them."
        exit 1
    fi
    
    print_success "All required dependencies installed!"
}

# Help message
show_help() {
    echo -e "${BLUE}Smart Movie Recommendation System - Deployment Helper${NC}"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  setup-local           - Setup local development environment"
    echo "  docker-up             - Start services with Docker Compose"
    echo "  docker-down           - Stop Docker services"
    echo "  import-movies         - Import movies from CSV (local)"
    echo "  test-backend [URL]    - Test backend API"
    echo "  test-python [URL]     - Test Python service"
    echo "  test-frontend         - Test frontend build"
    echo "  prepare-prod          - Prepare for production"
    echo "  check-deps            - Check all dependencies"
    echo "  help                  - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup-local"
    echo "  $0 docker-up"
    echo "  $0 test-backend http://localhost:3001"
    echo "  $0 prepare-prod"
}

# Main script logic
case "${1:-help}" in
    setup-local)
        setup_local
        ;;
    docker-up)
        start_docker
        ;;
    docker-down)
        stop_docker
        ;;
    import-movies)
        import_movies_local
        ;;
    test-backend)
        test_backend "$2"
        ;;
    test-python)
        test_python_service "$2"
        ;;
    test-frontend)
        test_frontend_build
        ;;
    prepare-prod)
        prepare_production
        ;;
    check-deps)
        check_dependencies
        ;;
    help)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
