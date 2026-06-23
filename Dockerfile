FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-prod.txt .

RUN pip install --no-cache-dir -r requirements-prod.txt

RUN python -m nltk.downloader -d /usr/local/share/nltk_data stopwords wordnet omw-1.4

COPY . .

RUN touch errors.log && chmod 666 errors.log && chmod 777 /app

EXPOSE 5001

CMD gunicorn -w 2 -b 0.0.0.0:${PORT:-5001} app:app
