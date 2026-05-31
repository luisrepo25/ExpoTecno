# ═══════════════════════════════════════════════════════════════════════
# Dockerfile — AgendaPro (Laravel 12 + Inertia.js + Vue 3)
# Deploy: Render.com — 3 stages
#
# NOTA: La extensión FTP se omite intencionalmente.
# En Render (cloud), el acceso FTP a tecnoweb.org.bo no está disponible.
# Las fotos se sirven directamente desde VITE_FOTO_BASE_URL (tecnoweb).
# El fallback local de storage funciona sin FTP.
# ═══════════════════════════════════════════════════════════════════════


# ── Stage 1: Dependencias PHP (necesario antes del build de Vite) ────────
FROM composer:2.7 AS composer-builder

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --ignore-platform-req=ext-ftp

COPY . .

RUN composer dump-autoload --optimize


# ── Stage 2: Build de assets JS/CSS (Vite) ──────────────────────────────
FROM node:20-alpine AS node-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .

# vendor/ necesario para resolver "tightenco/ziggy" en app.js
COPY --from=composer-builder /app/vendor ./vendor

ARG VITE_APP_NAME=AgendaPro
ARG VITE_FOTO_BASE_URL=https://www.tecnoweb.org.bo/inf513/grupo07sc/PracticaU4-3SC/LuisFernandoBlancoBautista/uploads

ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_FOTO_BASE_URL=$VITE_FOTO_BASE_URL

RUN npm run build


# ── Stage 3: Imagen PHP de producción ───────────────────────────────────
FROM php:8.2-fpm-alpine AS production

# Solo las librerías realmente necesarias para este proyecto:
#   - libpq-dev      → pdo_pgsql (conexión PostgreSQL)
#   - oniguruma-dev  → mbstring  (manejo de strings UTF-8)
#   - libzip-dev     → zip       (archivos comprimidos)
RUN apk add --no-cache \
        nginx \
        supervisor \
        curl \
        libpq-dev \
        oniguruma-dev \
        libzip-dev \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        mbstring \
        zip \
    && rm -rf /var/cache/apk/*

WORKDIR /var/www/html

# vendor/ optimizado (sin dev dependencies)
COPY --from=composer-builder /app/vendor ./vendor

# Código fuente de la aplicación
COPY . .

# Assets compilados por Vite
COPY --from=node-builder /app/public/build ./public/build

# Directorios de runtime y permisos
RUN mkdir -p storage/logs \
             storage/framework/cache \
             storage/framework/sessions \
             storage/framework/views \
             bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Configuraciones
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]
