#!/bin/bash

# Migration script for Supabase
echo "🔄 Starting Supabase migration..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Create initial migration
echo "🗃️ Creating initial migration..."
npx prisma migrate dev --name init

# Deploy migration
echo "🚀 Deploying migration..."
npx prisma migrate deploy

echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start your development server"
echo "2. Your app should now be connected to Supabase!"
