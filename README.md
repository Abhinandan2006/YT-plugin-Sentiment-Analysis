# YouTube Comment Sentiment Analyzer 🟢🔴

A powerful, AI-driven Chrome Extension that automatically analyzes the sentiment of YouTube comments in real-time. It uses a Machine Learning backend to classify comments as positive or negative, extracting key insights like frequent words, channel member interactions, and superchats—all presented in a beautiful popup dashboard.

## ✨ Features

- **Real-Time Sentiment Analysis**: Automatically categorizes loaded YouTube comments into Positive 🟢 or Negative 🔴 sentiments and injects visual badges directly into the YouTube page.
- **Smart Auto-Scrolling**: Automatically scrolls and loads exactly 100 unanalyzed comments at a time with a single click.
- **Advanced Dashboard**: View a breakdown of the sentiment with a dynamic CSS pie chart and precise percentage statistics.
- **Audience Insights**: Tracks and counts comments made by **Channel Members** and highlights **Superchats / Super Thanks**.
- **Keyword Extraction**: Identifies and displays the top 5 most frequently used words across all analyzed comments.

## 🛠️ Technology Stack

- **Frontend (Chrome Extension)**: HTML, CSS, JavaScript (Vanilla), Chrome Extension Manifest V3.
- **Backend (API)**: Python, Flask, Flask-CORS, Gunicorn.
- **Machine Learning**: LightGBM (LGBMClassifier), Scikit-Learn (TF-IDF Vectorization), NLTK (Text preprocessing & stopwords).
- **Deployment**: Render (Web Service), Docker.

---

## 🚀 Installation & Setup

### 1. Installing the Chrome Extension
To use the extension in your browser, you need to load it in Developer Mode.

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** by toggling the switch in the top right corner.
4. Click the **Load unpacked** button.
5. Select the `chrome_extension` folder located inside this project directory.
6. The extension is now installed! Pin it to your toolbar for easy access.

### 2. Running the Backend Server (Locally)
If you wish to run the Machine Learning API on your local machine:

1. Ensure you have Python 3.10+ installed.
2. Open your terminal and navigate to the project root directory.
3. Install the required dependencies:
   ```bash
   pip install -r requirements-prod.txt
   ```
4. Start the Flask server:
   ```bash
   python app.py
   ```
5. The API will be available at `http://localhost:5001`. *(Note: You will need to update the `API_URL` in `chrome_extension/background.js` to point to localhost if you are testing locally).*

### 3. Cloud Deployment (Render)
This project is fully configured to be deployed on [Render](https://render.com/) using Docker.

1. Connect your GitHub repository to Render.
2. Create a new **Web Service**.
3. Choose **Docker** as the runtime environment.
4. Render will automatically detect the `Dockerfile` and build the container.
5. Ensure your `background.js` points to your newly generated Render URL (e.g., `https://your-app-name.onrender.com/predict`).

---

## 📖 How to Use

1. Open any YouTube video in your Chrome browser.
2. Click the **Sentiment Analyzer** extension icon in your toolbar.
3. Click the **Analyze Comments** button.
4. The page will automatically scroll to gather 100 comments.
5. Once finished, a dashboard will appear showcasing your analytics, and green/red sentiment badges will appear next to the usernames in the YouTube comment section!

## 📁 Project Structure

- `/chrome_extension`: Contains all frontend code (Manifest, Popup UI, Background service workers, and Content scripts).
- `/src`: Contains the data ingestion, preprocessing, and model training pipelines.
- `app.py`: The Flask API server script.
- `Dockerfile`: The Docker configuration for cloud deployment.
- `lgbm_model.pkl` & `tfidf_vectorizer.pkl`: The serialized Machine Learning models.
