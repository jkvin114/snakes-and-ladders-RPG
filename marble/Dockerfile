FROM node:14-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the remaining source code to the working directory
COPY . .
# Expose the port on which the app runs
EXPOSE 5000

# Start the React app
CMD ["npm", "run","start"]
