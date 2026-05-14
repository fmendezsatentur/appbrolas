#!/bin/bash
set -e

cd ~/magic-market

git pull origin master

export APP_VERSION=$(git rev-parse --short HEAD)

docker compose up --build -d --remove-orphans

echo "Deploy completado — versión: $APP_VERSION"
