import os
import yaml
import logging
import pickle
import json
import pandas as pd
import mlflow
import mlflow.sklearn
from sklearn.metrics import accuracy_score, f1_score

# Logging configuration
logger = logging.getLogger('model_evaluation')
logger.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

file_handler = logging.FileHandler('errors.log')
file_handler.setLevel(logging.ERROR)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

logger.addHandler(console_handler)
logger.addHandler(file_handler)

def load_params(params_path: str) -> dict:
    with open(params_path, 'r') as file:
        return yaml.safe_load(file)

def evaluate_model():
    try:
        params_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../params.yaml')
        params = load_params(params_path)['model_building']
        
        logger.debug("Loading processed test data")
        test_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../data/interim/test_processed.csv')
        test_df = pd.read_csv(test_path)
        test_df['clean_comment'] = test_df['clean_comment'].fillna('')
        X_test_text = test_df['clean_comment']
        y_test = test_df['category']
        
        logger.debug("Loading model and vectorizer")
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../lgbm_model.pkl')
        vectorizer_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../tfidf_vectorizer.pkl')
        
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        with open(vectorizer_path, 'rb') as f:
            vectorizer = pickle.load(f)
            
        logger.debug("Evaluating model")
        X_test = vectorizer.transform(X_test_text)
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        logger.debug(f"Accuracy: {accuracy}, F1 Score: {f1}")
        
        # Determine tracking URI (defaults to local if not specified, avoiding connection errors if server is down)
        mlflow.set_experiment("LGBM_Sentiment_Analysis")
        
        with mlflow.start_run() as run:
            mlflow.log_params(params)
            mlflow.log_metric("accuracy", accuracy)
            mlflow.log_metric("f1_score", f1)
            
            # Log models
            mlflow.sklearn.log_model(model, "lgbm_model")
            
            experiment_info = {
                "run_id": run.info.run_id,
                "accuracy": accuracy,
                "f1_score": f1
            }
            
            out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../experiment_info.json')
            with open(out_path, 'w') as f:
                json.dump(experiment_info, f, indent=4)
                
        logger.debug("Model evaluation completed successfully")
    except Exception as e:
        logger.error("Error during model evaluation: %s", e)
        raise

if __name__ == '__main__':
    evaluate_model()
