#!/bin/bash
echo "🎹 QA Dashboard - Setup"
echo ""

echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To run the dashboard:"
echo ""
echo "  Terminal 1 - Backend:"
echo "    cd backend && npm start"
echo ""
echo "  Terminal 2 - Frontend:"
echo "    cd frontend && npm start"
echo ""
echo "  Then open http://localhost:3000"
echo ""
echo "💾 Seed demo data:"
echo "  curl -X POST http://localhost:3001/api/demo/seed"
echo ""
