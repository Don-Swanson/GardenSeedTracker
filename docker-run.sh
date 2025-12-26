#!/bin/bash

# GardenSeedTracker Docker Helper Script
# Usage: ./docker-run.sh [command]

set -e

COMPOSE_PROJECT_NAME="garden-seed-tracker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_help() {
    echo "GardenSeedTracker Docker Helper"
    echo ""
    echo "Usage: ./docker-run.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev         Start development environment with hot reloading"
    echo "  prod        Build and start production environment"
    echo "  build       Build production Docker image"
    echo "  stop        Stop all containers"
    echo "  logs        Show container logs"
    echo "  shell       Open shell in running container"
    echo "  db-push     Run Prisma db push in container"
    echo "  db-seed     Run database seed in container"
    echo "  clean       Remove containers, volumes, and images"
    echo "  help        Show this help message"
}

check_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}Warning: .env file not found${NC}"
        echo "Copy .env.docker.example to .env and configure it:"
        echo "  cp .env.docker.example .env"
        echo ""
    fi
}

case "$1" in
    dev)
        echo -e "${GREEN}Starting development environment...${NC}"
        check_env
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
        ;;
    
    prod)
        echo -e "${GREEN}Building and starting production environment...${NC}"
        check_env
        docker-compose up --build -d
        echo -e "${GREEN}Application is running at http://localhost:3000${NC}"
        ;;
    
    build)
        echo -e "${GREEN}Building production Docker image...${NC}"
        docker build -t garden-seed-tracker:latest .
        echo -e "${GREEN}Build complete!${NC}"
        ;;
    
    stop)
        echo -e "${YELLOW}Stopping all containers...${NC}"
        docker-compose down
        echo -e "${GREEN}Containers stopped${NC}"
        ;;
    
    logs)
        docker-compose logs -f
        ;;
    
    shell)
        echo -e "${GREEN}Opening shell in container...${NC}"
        docker-compose exec app sh
        ;;
    
    db-push)
        echo -e "${GREEN}Running Prisma db push...${NC}"
        docker-compose exec app npx prisma db push
        ;;
    
    db-seed)
        echo -e "${GREEN}Running database seed...${NC}"
        docker-compose exec app npx prisma db seed
        ;;
    
    clean)
        echo -e "${RED}This will remove all containers, volumes, and images for this project${NC}"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v --rmi local
            echo -e "${GREEN}Cleanup complete${NC}"
        else
            echo "Cancelled"
        fi
        ;;
    
    help|--help|-h|"")
        print_help
        ;;
    
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        print_help
        exit 1
        ;;
esac
