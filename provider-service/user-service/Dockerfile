FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules (bcrypt needs these)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies (this will build native modules like bcrypt)
RUN npm install --production=false

# Remove build dependencies to reduce image size
RUN apk del python3 make g++

# Copy application code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]

