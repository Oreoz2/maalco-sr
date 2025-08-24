# Production build with Node.js server
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Create directory for SR images
RUN mkdir -p /app/public/sr-images

# Create default avatar
RUN echo "Default Avatar Placeholder" > /app/public/sr-images/default-avatar.png

# Expose port 4848
EXPOSE 4848

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4848

# Start the server
CMD ["npm", "start"]

