#!/bin/bash

echo "Authenticating..."
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/ches-git

echo "Pulling changes..."
git pull origin staging

echo "Installing packages..."
pnpm install

echo "Building app..."
pnpm run build

echo "Restarting application..."
pm2 restart staging.mlm-backend

echo "Saving pm2..."
pm2 save

echo "✅ Deployment complete!"