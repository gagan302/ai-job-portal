#!/usr/bin/env bash
# Usage: ./push-to-github.sh https://github.com/<you>/ai-job-portal.git
set -e
[ -z "$1" ] && { echo "Pass your empty GitHub repo URL"; exit 1; }
git init -b main
git add .
git commit -m "Initial commit: AI-powered job portal microservices platform"
git remote add origin "$1"
git push -u origin main
