#!/bin/bash

# CSOAI Database Setup Script

echo "🚀 Setting up CSOAI database..."

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL not found. Installing via Homebrew..."
    brew install mysql
    brew services start mysql
fi

# Create database
echo "📦 Creating CSOAI database..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS csoai;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'csoai'@'localhost' IDENTIFIED BY 'csoai123';"
mysql -u root -e "GRANT ALL PRIVILEGES ON csoai.* TO 'csoai'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

echo "✅ Database setup complete!"
echo "📋 Database URL: mysql://csoai:csoai123@localhost:3306/csoai"

# Update .env file
sed -i '' 's|DATABASE_URL=.*|DATABASE_URL=mysql://csoai:csoai123@localhost:3306/csoai|' .env

echo "🔧 Updated .env file with database URL"

# Initialize database schema
echo "📋 Initializing database schema..."
npm run db:push

echo "🎉 Database setup complete! You can now run 'npm run dev'"