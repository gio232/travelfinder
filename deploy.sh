#!/bin/bash
echo "🚀 Starting Deployment to GitHub..."
git init
git add .
git commit -m "Nomad OS Update: $(date)"
git branch -M main
git remote add origin https://github.com/gio232/travelfinder.git || git remote set-url origin https://github.com/gio232/travelfinder.git
git push -u origin main
echo "✅ Done! Project is now on GitHub."
