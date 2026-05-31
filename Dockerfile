# ═══════════════════════════════════════════════════════════════════════
# Dockerfile — AgendaPro (Laravel 12 + Inertia.js + Vue 3)
# Optimizado para despliegue en Render.com
#
# Stack: PHP 8.2 + Nginx + Node 20 (build only) + PostgreSQL externo
# ═══════════════════════════════════════════════════════════════════════

# ── Stage 1: Build de assets JS/CSS (Vite) ──────────────────────────────
FROM node:20-alpine AS node-builder

WORKDIR /app

# Copiar solo lo necesario para npm install (cache de capas)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copiar el resto del proyecto para ejecutar vite build
COPY . .

# Variables de build — las sensibles van en Render como env vars
ARG VITE_APP_NAME=AgendaPro
ARG VITE_FOTO_BASE_URL=https://www.tecnoweb.org.bo/inf513/grupo07sc/PracticaU4-3SC/LuisFernandoBlancoBautista/uploads

ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_FOTO_BASE_URL=$VITE_FOTO_BASE_URL

RUN npm run build


# ── Stage 2: Imagen PHP de producción ───────────────────────────────────
FROM php:8.2-fpm-alpine AS php-base

# Extensiones PHP necesarias
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpng-dev \
    libzip-dev \
    oniguruma-dev \
    postgresql-dev \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        mbstring \
        zip \
        gd \
        ftp \
    && rm -rf /var/cache/apk/*

# Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ── Dependencias PHP (sin dev) ───────────────────────────────────────────
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --optimize-autoloader

# ── Copiar código fuente ─────────────────────────────────────────────────
COPY . .

# ── Assets compilados del Stage 1 ───────────────────────────────────────
COPY --from=node-builder /app/public/build ./public/build

# ── Finalizar autoloader y publicar assets ───────────────────────────────
RUN composer dump-autoload --optimize \
    && php artisan vendor:publish --tag=laravel-assets --force --no-interaction 2>/dev/null || true

# ── Permisos de storage y bootstrap/cache ───────────────────────────────
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions \
             storage/framework/views bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# ── Configuración Nginx ──────────────────────────────────────────────────
COPY docker/nginx.conf /etc/nginx/nginx.conf

# ── Configuración Supervisor (Nginx + PHP-FPM) ───────────────────────────
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ── Script de inicio ─────────────────────────────────────────────────────
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]
