import os
import yaml
import logging
import pickle
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.feature_extraction.text import TfidfVectorizer

logger = logging.getLogger('model_building')
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
    try:
        with open(params_path, 'r') as file:
            params = yaml.safe_load(file)
        return params
    except Exception as e:
        logger.error('Error loading params: %s', e)
        raise

def build_model():
    try:
        params_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../params.yaml')
        params = load_params(params_path)['model_building']
        
        ngram_range = tuple(params['ngram_range'])
        max_features = params['max_features']
        learning_rate = params['learning_rate']
        max_depth = params['max_depth']
        n_estimators = params['n_estimators']
        
        logger.debug("Loading training data")
        train_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../data/interim/train_processed.csv')
        train_df = pd.read_csv(train_path)
        
        train_df['clean_comment'] = train_df['clean_comment'].fillna('')
        
        X_train_text = train_df['clean_comment']
        y_train = train_df['category']
        
        logger.debug("Vectorizing text data")
        vectorizer = TfidfVectorizer(max_features=max_features, ngram_range=ngram_range)
        X_train = vectorizer.fit_transform(X_train_text)
        
        logger.debug("Training LGBM Model")
        model = LGBMClassifier(
            learning_rate=learning_rate,
            max_depth=max_depth,
            n_estimators=n_estimators,
            random_state=42
        )
        model.fit(X_train, y_train)
        
        logger.debug("Saving model and vectorizer")
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../lgbm_model.pkl')
        vectorizer_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../tfidf_vectorizer.pkl')
        
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
            
        with open(vectorizer_path, 'wb') as f:
            pickle.dump(vectorizer, f)
            
        logger.debug("Model building completed successfully")
    except Exception as e:
        logger.error("Error in model building: %s", e)
        raise

if __name__ == '__main__':
    build_model()
