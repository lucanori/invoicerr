#!/bin/sh

cd /usr/share/nginx/backend
echo "Setting up database..."

npx prisma db push --skip-generate --accept-data-loss

echo "Starting backend..."
node main.js &

echo "Waiting for backend to start..."
timeout=60
while ! nc -z localhost 3000 && [ $timeout -gt 0 ]; do
    sleep 1
    timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
    echo "Backend failed to start within 60 seconds"
    exit 1
fi

echo "Backend is up, starting Nginx..."

exec nginx -g "daemon off;"