#!/bin/bash
set -e

echo "Pushing schema to database..."
npm run db:push -w @sotally/api

echo ""
echo "Seeding database..."
npm run db:seed -w @sotally/api

echo ""
echo "Done!"
