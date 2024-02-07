# Use Node.js image
FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Set environment variables
ENV WATCHPACK_POLLING=true

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD [ "npm", "start" ]