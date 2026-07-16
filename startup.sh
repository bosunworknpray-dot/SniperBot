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
# Check Node.js and npm
####################################################

if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    echo "Run: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

####################################################
# Check available memory
####################################################

echo "📊 Checking available memory..."
MEMORY_KB=$(free -k | awk '/^Mem:/{print $7}')
MEMORY_MB=$((MEMORY_KB / 1024))
echo "Available memory: ${MEMORY_MB} MB"

if [[ ${MEMORY_MB} -lt 512 ]]; then
    echo "⚠️ Low memory detected (${MEMORY_MB} MB). Using memory-optimized installation..."
fi

####################################################
# Install dependencies with memory optimization
####################################################

echo "📦 Installing dependencies..."

# Remove existing node_modules to start fresh
if [[ -d node_modules ]]; then
    echo "🗑️ Removing existing node_modules..."
    rm -rf node_modules
fi

# Clear npm cache to free memory
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Create .npmrc with memory optimization settings
cat > .npmrc <<'EOF'
# Memory optimization
max-old-space-size=512
node_options="--max-old-space-size=512"
legacy-peer-deps=true
EOF

echo "🔧 Installing with memory optimization..."

# Try different installation strategies
if npm install --no-audit --no-fund --legacy-peer-deps --max-old-space-size=512; then
    echo "✅ Dependencies installed successfully (Strategy 1)"
elif npm install --no-audit --no-fund --prefer-offline --legacy-peer-deps; then
    echo "✅ Dependencies installed successfully (Strategy 2)"
elif npm install --production=false --legacy-peer-deps; then
    echo "✅ Dependencies installed successfully (Strategy 3)"
else
    echo "❌ Failed to install dependencies with regular methods."
    echo "Trying with increased memory allocation..."
    
    # Try with more memory if available
    if [[ ${MEMORY_MB} -gt 1024 ]]; then
        NODE_OPTIONS="--max-old-space-size=1024" npm install --legacy-peer-deps || {
            echo "❌ Still failed. Try manually running:"
            echo "  NODE_OPTIONS=\"--max-old-space-size=1024\" npm install --legacy-peer-deps"
            exit 1
        }
    else
        # Try with swap
        echo "⚠️ Low memory. Attempting to create swap file..."
        sudo dd if=/dev/zero of=/swapfile bs=1M count=1024 status=progress
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo "✅ Swap file created. Retrying install..."
        
        NODE_OPTIONS="--max-old-space-size=1024" npm install --legacy-peer-deps || {
            echo "❌ Installation failed. Manual steps:"
            echo "1. Free up memory: sudo apt-get clean && sudo apt-get autoremove"
            echo "2. Increase swap: sudo dd if=/dev/zero of=/swapfile bs=1M count=2048"
            echo "3. Run: NODE_OPTIONS=\"--max-old-space-size=1024\" npm install"
            exit 1
        }
    fi
fi

# Clean up .npmrc
rm -f .npmrc

echo "✅ Dependencies installed successfully"

####################################################
# Verify critical dependencies are installed
####################################################

if ! npx tsc --version >/dev/null 2>&1; then
    echo "❌ TypeScript compiler not found. Reinstalling dependencies..."
    npm install typescript @types/node --save-dev --legacy-peer-deps
fi

echo "✅ TypeScript version: $(npx tsc --version)"

####################################################
# Build
####################################################

echo "🔍 Running type check..."
if ! npm run type-check; then
    echo "❌ Type check failed. Please fix type errors."
    exit 1
fi

echo "🏗 Building application..."
if ! npm run build; then
    echo "❌ Build failed. Check build errors above."
    exit 1
fi

if [[ ! -d .next ]]; then
    echo "❌ Build failed - .next directory not found."
    exit 1
fi

echo "✅ Build successful"

####################################################
# Configure Nginx
####################################################

if command -v nginx >/dev/null 2>&1; then

    echo "⚙ Configuring Nginx..."

    # Check for Cloudflare certs
    if [[ -f "cert.pem" && -f "cert.key" ]]; then
        echo "📄 Local Cloudflare certs found in repo root. Installing to /etc/ssl/cloudflare..."
        sudo mkdir -p /etc/ssl/cloudflare
        sudo cp -f cert.pem /etc/ssl/cloudflare/cert.pem
        sudo cp -f cert.key /etc/ssl/cloudflare/cert.key
        sudo chmod 644 /etc/ssl/cloudflare/cert.pem
        sudo chmod 600 /etc/ssl/cloudflare/cert.key
        echo "✅ Certificates installed"
    else
        echo "⚠️ Local cert.pem and cert.key not found in repo root."
        echo "Using existing /etc/ssl/cloudflare files if they exist."
        
        if [[ ! -f /etc/ssl/cloudflare/cert.pem ]] || [[ ! -f /etc/ssl/cloudflare/cert.key ]]; then
            echo "❌ No SSL certificates found. Nginx SSL configuration will fail."
            echo "Please place cert.pem and cert.key in the repo root or /etc/ssl/cloudflare/"
            exit 1
        fi
    fi

    # Create Nginx directories
    sudo mkdir -p /etc/nginx/sites-available
    sudo mkdir -p /etc/nginx/sites-enabled

    # Write Nginx config
    sudo tee /etc/nginx/sites-available/sniperbot.space >/dev/null <<'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name sniperbot.space www.sniperbot.space;
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name sniperbot.space www.sniperbot.space;

    ssl_certificate /etc/ssl/cloudflare/cert.pem;
    ssl_certificate_key /etc/ssl/cloudflare/cert.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/sniperbot_access.log;
    error_log /var/log/nginx/sniperbot_error.log;

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:4028;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/sniperbot.space /etc/nginx/sites-enabled/sniperbot.space
    sudo rm -f /etc/nginx/sites-enabled/default

    # Test Nginx configuration
    echo "🔍 Testing Nginx configuration..."
    if ! sudo nginx -t; then
        echo "❌ Nginx configuration failed. Check config above."
        exit 1
    fi

    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    if ! sudo systemctl reload nginx; then
        echo "⚠️ Failed to reload Nginx. Trying restart..."
        sudo systemctl restart nginx
    fi

    echo "✅ Nginx configured successfully"

else
    echo "⚠️ Nginx not installed. Skipping web server configuration."
    echo "The app will still run on port ${PORT} but won't be accessible via domain."
fi

####################################################
# Check if port is already in use
####################################################

if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ Port ${PORT} is already in use."
    echo "Killing existing process on port ${PORT}..."
    kill -9 $(lsof -t -i:${PORT}) 2>/dev/null || true
    sleep 2
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
echo "⚠️  ⚠️  ⚠️  WARNING  ⚠️  ⚠️  ⚠️"
echo "MAINNET TRADING ENABLED - REAL MONEY AT RISK"
echo "⚠️  ⚠️  ⚠️  WARNING  ⚠️  ⚠️  ⚠️"
echo
echo "Starting application..."
echo "Press Ctrl+C to stop"
echo

# Start the application with memory optimization
NODE_OPTIONS="--max-old-space-size=512" HOSTNAME="${HOST}" PORT="${PORT}" npm run serve -- -H 127.0.0.1 -p 4028