#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# Create venv if it doesn't exist
if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv .venv
fi

# Activate venv
source .venv/bin/activate

# Install dependencies
pip install -q -r requirements.txt

# Start the server
echo "Starting Club Leadly API on http://localhost:8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
