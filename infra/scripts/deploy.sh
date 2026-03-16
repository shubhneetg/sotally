#!/bin/bash
set -e

echo "Deploying Sotally..."

git pull origin main

docker compose build
docker compose up -d

echo "Waiting for services..."
sleep 5

# Run migrations
docker compose exec api npx tsx packages/api/src/db/seed.ts

echo "Deployment complete!"
docker compose ps
