#!/bin/sh
set -e

# Ensure database file exists
touch /var/www/backend/database/database.sqlite

# Run migrations
php artisan migrate --force

# Seed only if no employees exist (first run)
if [ "$(php artisan tinker --execute='echo App\Models\Employee::count();' 2>/dev/null)" = "0" ]; then
    php artisan db:seed --force
fi

exec "$@"
