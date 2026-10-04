# Use Node.js 20 Alpine for smaller image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "server.js"]