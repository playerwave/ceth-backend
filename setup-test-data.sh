#!/bin/bash

# Setup test data for check-in system

echo "🚀 Setting up test data for check-in system..."

# Check if database connection is available
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please set your database connection string."
    echo "Example: export DATABASE_URL='postgresql://username:password@localhost:5432/database_name'"
    exit 1
fi

echo "📊 Running quick-test-data.sql..."
psql "$DATABASE_URL" -f quick-test-data.sql

echo "📊 Running quick-test-activity.sql..."
psql "$DATABASE_URL" -f quick-test-activity.sql

echo "✅ Test data setup completed!"
echo ""
echo "🧪 Test credentials:"
echo "   Username: 65160169"
echo "   Password: 1234"
echo "   Activity ID: 1"
echo ""
echo "🌐 Test URL: http://localhost:5173/qr-activity-checkinout-student/1"
