FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 5173

# Start Vite server, binding to all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
