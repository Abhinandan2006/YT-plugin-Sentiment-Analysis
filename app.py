import os
import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from src.data.data_preprocessing import preprocess_comment

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes so the browser plugin can access the API

# Load the models globally
model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lgbm_model.pkl')
vectorizer_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tfidf_vectorizer.pkl')

try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    with open(vectorizer_path, 'rb') as f:
        vectorizer = pickle.load(f)
    print("Models loaded successfully.")
except Exception as e:
    print(f"Error loading models: {e}")
    model = None
    vectorizer = None

@app.route('/predict', methods=['POST'])
def predict():
    if model is None or vectorizer is None:
        return jsonify({"error": "Model or vectorizer not loaded on the server."}), 500
        
    data = request.get_json()
    if not data or 'comments' not in data:
        return jsonify({"error": "Invalid payload. Please provide a JSON object with a 'comments' array."}), 400
        
    comments = data['comments']
    
    if not isinstance(comments, list):
        return jsonify({"error": "'comments' must be a list."}), 400
        
    if len(comments) == 0:
        return jsonify({"predictions": []})
        
    # Preprocess comments
    cleaned_comments = [preprocess_comment(c) for c in comments]
    
    # Transform using vectorizer
    X = vectorizer.transform(cleaned_comments)
    
    # Predict using the model
    predictions = model.predict(X)
    
    # Prepare the response
    results = []
    for orig_comment, pred in zip(comments, predictions):
        results.append({
            "comment": orig_comment,
            # Returning as int so the plugin can do any further logic it needs to
            "sentiment": int(pred) 
        })
        
    return jsonify({"predictions": results})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    # Run the app locally on port 5001 (to avoid conflict with MLflow)
    app.run(host='0.0.0.0', port=5001, debug=True)
