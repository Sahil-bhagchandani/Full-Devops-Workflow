#!/bin/bash

set -e

echo "========================================="
echo " Killercoda Environment Setup"
echo "========================================="

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"

echo ""
echo ">>> Checking Git..."
if command -v git >/dev/null 2>&1; then
    echo "Git: OK"
else
    echo "Git not found. Installing..."
    apt-get update
    apt-get install -y git
fi

echo ""
echo ">>> Checking Node.js and npm..."

if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    echo "Node.js: $(node -v)"
    echo "npm: $(npm -v)"
else
    echo "Node.js/npm not found."
    echo "Updating apt package lists..."

    apt-get update --fix-missing

    echo "Installing Node.js and npm..."
    apt-get install -y nodejs npm
fi

echo ""
echo ">>> Checking Docker..."

if command -v docker >/dev/null 2>&1; then
    echo "Docker: OK"
else
    echo "ERROR: Docker is not available in this Killercoda environment."
    exit 1
fi

echo ""
echo ">>> Checking docker-compose..."

if command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose: OK"
else
    echo "docker-compose not found. Installing..."
    apt-get update --fix-missing
    apt-get install -y docker-compose
fi

echo ""
echo ">>> Installing API dependencies..."

cd "$PROJECT_ROOT/api"
npm install

echo ""
echo ">>> Installing Worker dependencies..."

cd "$PROJECT_ROOT/worker"
npm install

echo ""
echo ">>> Starting PostgreSQL and RabbitMQ..."

cd "$PROJECT_ROOT"
docker-compose up -d

echo ""
echo ">>> Docker containers:"
docker ps

echo ""
echo "========================================="
echo " Setup Complete"
echo "========================================="

echo ""
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"
echo ""

echo "Next:"
echo "1. Start API:"
echo "   cd api && npm start"
echo ""

echo "2. Start Worker in another terminal:"
echo "   cd worker && npm start"
echo ""

echo "3. Then perform the application tests."