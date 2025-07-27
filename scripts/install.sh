#!/bin/bash

# DocuSense AI - Installation Script
# This script sets up the complete development environment

set -e

echo "🚀 DocuSense AI - Installation Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python 3.8+ is required but not installed"
        exit 1
    fi
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION found"
    else
        print_error "Node.js 16+ is required but not installed"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm $NPM_VERSION found"
    else
        print_error "npm is required but not installed"
        exit 1
    fi
}

# Install Python dependencies
install_backend() {
    print_status "Installing backend dependencies..."
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install dependencies
    pip install -r requirements.txt
    
    print_success "Backend dependencies installed"
    cd ..
}

# Install Node.js dependencies
install_frontend() {
    print_status "Installing frontend dependencies..."
    cd frontend
    
    # Install dependencies
    npm install
    
    print_success "Frontend dependencies installed"
    cd ..
}

# Create necessary directories
create_directories() {
    print_status "Creating project directories..."
    
    # Backend directories
    mkdir -p backend/app/{api,core,models,services,utils}
    mkdir -p backend/external
    mkdir -p backend/tests
    
    # Frontend directories
    mkdir -p frontend/src/{components,hooks,services,stores,types,utils,styles}
    mkdir -p frontend/src/components/{Layout,FileManager,Queue,Config,UI}
    mkdir -p frontend/public
    
    # Other directories
    mkdir -p docs
    mkdir -p scripts
    mkdir -p tests
    
    print_success "Project directories created"
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Backend .env
    cat > backend/.env << EOF
# DocuSense AI Backend Configuration
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=sqlite:///./docusense.db
SECRET_KEY=your-secret-key-here-change-in-production
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# AI Providers (add your API keys)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
MISTRAL_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=INFO
EOF

    # Frontend .env
    cat > frontend/.env << EOF
# DocuSense AI Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=DocuSense AI
VITE_APP_VERSION=1.0.0
EOF

    print_success "Environment files created"
}

# Create basic configuration files
create_config_files() {
    print_status "Creating configuration files..."
    
    # Backend main.py
    cat > backend/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="DocuSense AI API",
    description="Intelligent Document Analysis Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "DocuSense AI API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
EOF

    # Frontend vite.config.ts
    cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
EOF

    # Frontend tailwind.config.js
    cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#60a5fa',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#fffbeb',
          500: '#fbbf24',
          600: '#d97706',
          700: '#b45309',
        },
        accent: {
          50: '#ecfdf5',
          500: '#34d399',
          600: '#059669',
          700: '#047857',
        },
      },
    },
  },
  plugins: [],
}
EOF

    print_success "Configuration files created"
}

# Create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Start backend script
    cat > scripts/start-backend.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate
python main.py
EOF
    chmod +x scripts/start-backend.sh
    
    # Start frontend script
    cat > scripts/start-frontend.sh << 'EOF'
#!/bin/bash
cd frontend
npm run dev
EOF
    chmod +x scripts/start-frontend.sh
    
    # Start both script
    cat > scripts/start-dev.sh << 'EOF'
#!/bin/bash
# Start both backend and frontend in parallel
./scripts/start-backend.sh &
BACKEND_PID=$!
./scripts/start-frontend.sh &
FRONTEND_PID=$!

echo "DocuSense AI development servers started:"
echo "Backend: http://localhost:8000 (PID: $BACKEND_PID)"
echo "Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
EOF
    chmod +x scripts/start-dev.sh
    
    print_success "Startup scripts created"
}

# Main installation function
main() {
    echo ""
    print_status "Starting DocuSense AI installation..."
    
    # Check prerequisites
    check_python
    check_node
    check_npm
    
    # Create project structure
    create_directories
    create_env_files
    create_config_files
    create_startup_scripts
    
    # Install dependencies
    install_backend
    install_frontend
    
    echo ""
    print_success "🎉 DocuSense AI installation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Configure your API keys in backend/.env"
    echo "2. Start the development servers:"
    echo "   - Backend only: ./scripts/start-backend.sh"
    echo "   - Frontend only: ./scripts/start-frontend.sh"
    echo "   - Both: ./scripts/start-dev.sh"
    echo ""
    echo "3. Open http://localhost:5173 in your browser"
    echo ""
    print_warning "Don't forget to configure your AI provider API keys!"
}

# Run main function
main "$@" 