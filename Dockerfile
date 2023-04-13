# Base image
FROM node:19.0.1-alpine

# Create app directory
WORKDIR /app


ARG ENV=prod
ENV ENV=$ENV

ARG PORT=3001
ENV PORT=$PORT

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

EXPOSE 3001

# Creates a "dist" folder with the production build
RUN npm run build

# Start the server using the production build
CMD ["npm", "run", "start:prod"]
