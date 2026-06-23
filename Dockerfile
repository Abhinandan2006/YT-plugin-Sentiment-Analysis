FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for LightGBM
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy production requirements
COPY requirements-prod.txt .

# Install python dependencies
RUN pip install --no-cache-dir -r requirements-prod.txt

# Pre-download NLTK data to a global, readable directory
RUN python -m nltk.downloader -d /usr/local/share/nltk_data stopwords wordnet omw-1.4

# Copy the rest of the application code
COPY . .

# Render runs containers as a non-root user. 
# We need to ensure the app can write to errors.log if it needs to.
RUN touch errors.log && chmod 666 errors.log && chmod 777 /app

# Expose port (default 5001, but can be overridden by environment variable)
EXPOSE 5001

# Command to run the application using Gunicorn
# Use the PORT environment variable if available (e.g., on Render), otherwise default to 5001
CMD gunicorn -w 2 -b 0.0.0.0:${PORT:-5001} app:app
