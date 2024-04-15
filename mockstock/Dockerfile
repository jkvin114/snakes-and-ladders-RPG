# Use Python 3.10.0 base image
FROM python:3.10.0

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .
EXPOSE 5050

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Command to run your application
CMD [ "python", "python/app.py" ]  
