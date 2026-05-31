#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# start.sh — Script de inicio para el contenedor en Render
# Se ejecuta CADA VEZ que el contenedor arranca.
# ═══════════════════════════════════════════════════════════════
set -e

echo "▶ Iniciando AgendaPro en Render..."

# ── 1. Validar que APP_KEY esté seteada ─────────────────────────
if [ -z "$APP_KEY" ]; then
  echo "✗ ERROR: APP_KEY no está definida. Definila como variable de entorno en Render."
  exit 1
fi

# ── 2. Crear directorios de runtime si no existen ───────────────
mkdir -p /var/www/html/storage/logs \
         /var/www/html/storage/framework/cache \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/bootstrap/cache \
         /tmp/client_body \
         /tmp/proxy \
         /tmp/fastcgi

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

# ── 3. Optimizar Laravel para producción ────────────────────────
echo "▶ Optimizando configuración de Laravel..."
cd /var/www/html

php artisan config:cache   --no-interaction
php artisan route:cache    --no-interaction
php artisan view:cache     --no-interaction
php artisan event:cache    --no-interaction

# ── 4. Enlace simbólico de storage (fotos subidas localmente) ───
php artisan storage:link --no-interaction 2>/dev/null || true

echo "✓ Listo. Iniciando Nginx + PHP-FPM..."

# ── 5. Lanzar Supervisor (gestiona Nginx + PHP-FPM) ─────────────
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
