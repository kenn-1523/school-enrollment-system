# Use an official Node.js runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy app-specific package files
COPY apps/client/package.json ./apps/client/
COPY packages/business-logic/package.json ./packages/business-logic/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/client ./apps/client
COPY packages ./packages

# Expose Next.js port
EXPOSE 3000

# Start the Next.js dev server
CMD ["npm", "run", "dev", "-w", "apps/client"]