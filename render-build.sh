#!/usr/bin/env bash

# Navigate to frontend and build React
cd frontend
npm install
npm run build

# Go to backend and install server dependencies
cd ../backend
npm install
