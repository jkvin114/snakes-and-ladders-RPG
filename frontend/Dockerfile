FROM node:14-alpine

# Set the working directory in the container
WORKDIR /app
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the remaining source code to the working directory
COPY . .

RUN npm run build

#convert all static .html files to plain txt
RUN ./convert.sh

# Expose the port on which the app runs
EXPOSE 3000

# Start the React app
CMD ["npx", "serve","-s","build"]
