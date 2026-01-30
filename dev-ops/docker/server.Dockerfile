# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the root package files first (for caching)
COPY package.json package-lock.json ./

# Copy the specific app and package files
COPY apps/server/package.json ./apps/server/
COPY packages/business-logic/package.json ./packages/business-logic/

# Install dependencies (including the shared workspace)
RUN npm install

# Copy the rest of the source code
COPY apps/server ./apps/server
COPY packages ./packages

# Build the shared logic if needed (optional, depends on your setup)
# RUN npm run build -w packages/business-logic

# Expose the port the server runs on
EXPOSE 5000

# Start the server
CMD ["npm", "run", "dev", "-w", "apps/server"]