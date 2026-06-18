#!/bin/sh
set -e

# Ensure database file exists
touch /var/www/backend/database/database.sqlite

# Run migrations and seeders
php artisan migrate --force

exec "$@"
