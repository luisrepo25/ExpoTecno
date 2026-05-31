# ═══════════════════════════════════════════════════════════════════════
# Dockerfile — AgendaPro (Laravel 12 + Inertia.js + Vue 3)
# Optimizado para Render.com — 3 stages
#
# Stage 1 (composer): instala dependencias PHP → genera vendor/ con ziggy
# Stage 2 (node):     copia vendor/ y compila assets Vite
# Stage 3 (prod):     imagen final PHP 8.2 + Nginx + PHP-FPM
# ═══════════════════════════════════════════════════════════════════════


# ── Stage 1: Dependencias PHP (Composer) ────────────────────────────────
# Necesario ANTES del build de Vite porque app.js importa
# "../../vendor/tightenco/ziggy" — Ziggy es un paquete PHP que expone
# las rutas Laravel al frontend JavaScript.
FROM composer:2.7 AS composer-builder

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --optimize-autoloader

COPY . .

RUN composer dump-autoload --optimize


# ── Stage 2: Build de assets JS/CSS (Vite) ──────────────────────────────
FROM node:20-alpine AS node-builder

WORKDIR /app

# Dependencias Node primero (cache de capas)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Código fuente
COPY . .

# vendor/ desde el stage anterior — Vite lo necesita para resolver ziggy
COPY --from=composer-builder /app/vendor ./vendor

# Variables de build de Vite (configurar en Render como Build Args)
ARG VITE_APP_NAME=AgendaPro
ARG VITE_FOTO_BASE_URL=https://www.tecnoweb.org.bo/inf513/grupo07sc/PracticaU4-3SC/LuisFernandoBlancoBautista/uploads

ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_FOTO_BASE_URL=$VITE_FOTO_BASE_URL

RUN npm run build


# ── Stage 3: Imagen PHP de producción ───────────────────────────────────
FROM php:8.2-fpm-alpine AS production

# Dependencias del sistema + extensiones PHP
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

WORKDIR /var/www/html

# vendor/ optimizado desde Stage 1
COPY --from=composer-builder /app/vendor ./vendor

# Código fuente de la aplicación
COPY . .

# Assets compilados desde Stage 2
COPY --from=node-builder /app/public/build ./public/build

# Finalizar autoloader
RUN php artisan package:discover --ansi 2>/dev/null || true

# Permisos
RUN mkdir -p storage/logs storage/framework/cache \
             storage/framework/sessions storage/framework/views \
             bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Configuraciones de Nginx y Supervisor
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Script de inicio
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]
