FROM node:20-slim

WORKDIR /app

# Copy backend configuration and dependencies
COPY backend/package*.json ./backend/

# Copy frontend
COPY frontend ./frontend

# Install backend dependencies
RUN cd backend && npm install --production

# Copy backend source
COPY backend ./backend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/corsi', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "backend/server.js"]
