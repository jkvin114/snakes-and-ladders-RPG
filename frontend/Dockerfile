FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

ENV NODE_ENV=production
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the remaining source code to the working directory
COPY . .

RUN npm run build


# Expose the port on which the app runs
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]
