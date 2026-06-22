import os
import json
import logging
import mlflow

# Logging configuration
logger = logging.getLogger('model_registration')
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

def register_model():
    try:
        # Load experiment info
        info_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../experiment_info.json')
        with open(info_path, 'r') as f:
            experiment_info = json.load(f)
            
        run_id = experiment_info['run_id']
        model_name = "SentimentAnalysisLGBM"
        
        logger.debug(f"Registering model with run_id {run_id}")
        
        # Register the model using the default tracking URI (or what's configured in environment)
        model_uri = f"runs:/{run_id}/lgbm_model"
        mlflow.register_model(model_uri, model_name)
        
        logger.debug(f"Model successfully registered as {model_name}")
    except Exception as e:
        logger.error(f"Error during model registration: {e}")
        raise

if __name__ == '__main__':
    register_model()
