FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
    git unzip curl libpng-dev libonig-dev libxml2-dev libsqlite3-dev \
    && docker-php-ext-install pdo_sqlite mbstring gd xml bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY docker/php/php.ini "$PHP_INI_DIR/php.ini"

WORKDIR /var/www/backend

COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-interaction --optimize-autoloader --no-dev

COPY backend/ ./
COPY docker/php/.env.docker .env

RUN mkdir -p database \
    && touch database/database.sqlite \
    && chmod -R 775 storage bootstrap/cache database \
    && chown -R www-data:www-data .

RUN php artisan key:generate --force \
    && php artisan storage:link --force \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]
