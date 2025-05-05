#!/bin/bash

# Function to cleanup containers on script exit
cleanup() {
    echo "Cleaning up..."
    docker-compose down
}

# Function to check if a container is healthy
check_health() {
    local container=$1
    local max_attempts=$2
    local attempt=1

    echo "Waiting for $container to be healthy..."
    while [ $attempt -le $max_attempts ]; do
        if [ "$(docker inspect --format='{{.State.Health.Status}}' "uniisphere-$container")" == "healthy" ]; then
            echo "$container is healthy!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: $container is not healthy yet..."
        attempt=$((attempt + 1))
        sleep 5
    done
    echo "$container failed to become healthy after $max_attempts attempts"
    return 1
}

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "Error: .env.production file not found!"
    echo "Please create .env.production file from production.env.example"
    exit 1
fi

# Export all variables from .env.production
set -a
source .env.production
set +a

# Setup cleanup trap
trap cleanup EXIT

# Pull latest images
echo "Pulling latest images..."
docker-compose pull

# Start the services
echo "Starting services..."
docker-compose up -d

# Check health of services
check_health "db" 12 || exit 1      # Wait up to 1 minute
check_health "redis" 12 || exit 1   # Wait up to 1 minute
check_health "app" 12 || exit 1     # Wait up to 1 minute

echo "All services are up and healthy!"

# Watch the logs (without exiting)
echo "Showing logs (Ctrl+C to exit)..."
docker-compose logs -f app

# Keep the script running
wait 