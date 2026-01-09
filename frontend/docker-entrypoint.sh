#!/bin/sh
set -e

# Fix permissions for node_modules binaries if they exist
if [ -d "node_modules/.bin" ]; then
  chmod +x node_modules/.bin/* 2>/dev/null || true
fi

# Use npx to run vite (avoids permission issues)
exec npx vite --host

