#!/usr/bin/env bash
set -o errexit   # exit immediately on any error

echo "==> Creating Python virtual environment..."
python3 -m venv venv

echo "==> Upgrading pip..."
./venv/bin/pip install --upgrade pip

echo "==> Installing dependencies..."
./venv/bin/pip install -r requirements.txt

echo "==> Verifying uvicorn..."
./venv/bin/python -m uvicorn --version

echo "==> Build complete!"
