#!/usr/bin/env bash
# startup.sh - Production startup script for SniperBot

set -Eeuo pipefail

DOMAIN="sniperbot.space"
PORT="4028"
HOST="127.0.0.1"

echo "================================================"
echo "🚀 Starting SniperBot Production"
echo "================================================"

# Move to script directory
cd "$(dirname "$0")"

####################################################
# Verify environment
####################################################

if [[ ! -f ".env.local" ]]; then
    echo "❌ .env.local not found."
    exit 1
fi

required_vars=(
    BYBIT_API_KEY
    BYBIT_API_SECRET
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=.\+" .env.local; then
        echo "❌ Missing ${var} in .env.local"
        exit 1
    fi
done

if grep -qi "^BYBIT_USE_TESTNET=true" .env.local; then
    echo "❌ Testnet is enabled."
    echo "Set BYBIT_USE_TESTNET=false"
    exit 1
fi

echo "✅ Environment verified"

####################################################
# Install dependencies
####################################################

if [[ ! -d node_modules ]]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

####################################################
# Build
####################################################

echo "🔍 Running type check..."
npm run type-check

echo "🏗 Building..."
npm run build

if [[ ! -d .next ]]; then
    echo "❌ Build failed."
    exit 1
fi

echo "✅ Build successful"

####################################################
# Configure Nginx
####################################################

if command -v nginx >/dev/null 2>&1; then

    echo "⚙ Configuring Nginx..."

    if [[ -f "cert.pem" && -f "cert.key" ]]; then
        echo "📄 Local Cloudflare certs found in repo root. Installing to /etc/ssl/cloudflare..."
        sudo mkdir -p /etc/ssl/cloudflare
        sudo cp -f cert.pem /etc/ssl/cloudflare/cert.pem
        sudo cp -f cert.key /etc/ssl/cloudflare/cert.key
        sudo chmod 644 /etc/ssl/cloudflare/cert.pem
        sudo chmod 600 /etc/ssl/cloudflare/cert.key
    else
        echo "⚠️ Local cert.pem and cert.key not found in repo root. Using existing /etc/ssl/cloudflare files."
    fi

    sudo mkdir -p /etc/nginx/sites-available
    sudo mkdir -p /etc/nginx/sites-enabled

    sudo tee /etc/nginx/sites-available/sniperbot.space >/dev/null <<'EOF'
server {
    listen 443 ssl http2;
    server_name sniperbot.space www.sniperbot.space;

    ssl_certificate /etc/ssl/cloudflare/cert.pem;
    ssl_certificate_key /etc/ssl/cloudflare/cert.key;

    location / {
        proxy_pass http://127.0.0.1:4028;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name sniperbot.space www.sniperbot.space;
    return 301 https://$host$request_uri;
}
EOF

    sudo ln -sf \
        /etc/nginx/sites-available/sniperbot.space \
        /etc/nginx/sites-enabled/sniperbot.space

    sudo rm -f /etc/nginx/sites-enabled/default

    echo "🔍 Testing Nginx..."

    sudo nginx -t

    echo "🔄 Reloading Nginx..."

    sudo systemctl reload nginx

    echo "✅ Nginx configured"

else
    echo "⚠️ Nginx not installed. Skipping web server configuration."
fi

####################################################
# Start application
####################################################

echo
echo "=============================================="
echo "🌐 Domain : https://${DOMAIN}"
echo "🖥 Host   : ${HOST}"
echo "🚀 Port   : ${PORT}"
echo "=============================================="
echo
echo "⚠️ MAINNET TRADING ENABLED"
echo "⚠️ REAL MONEY IS AT RISK"
echo

HOSTNAME="${HOST}" PORT="${PORT}" npm run serve -- -H 127.0.0.1 -p 4028