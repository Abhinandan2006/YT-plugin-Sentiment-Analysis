import os
import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import logging

# Ensure NLTK resources are safely available (using /tmp which is always writable)
try:
    import tempfile
    nltk_dir = os.path.join(tempfile.gettempdir(), 'nltk_data')
    os.makedirs(nltk_dir, exist_ok=True)
    nltk.download('stopwords', download_dir=nltk_dir, quiet=True)
    nltk.download('wordnet', download_dir=nltk_dir, quiet=True)
    nltk.download('omw-1.4', download_dir=nltk_dir, quiet=True)
    nltk.data.path.append(nltk_dir)
except Exception as e:
    print(f"Warning: NLTK download failed, relying on pre-downloaded data: {e}")

# Logging configuration
logger = logging.getLogger('data_preprocessing')
logger.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

file_handler = logging.FileHandler(os.path.join(tempfile.gettempdir(), 'errors.log'))
file_handler.setLevel(logging.ERROR)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

logger.addHandler(console_handler)
logger.addHandler(file_handler)

def preprocess_comment(comment):
    try:
        if not isinstance(comment, str):
            return ""
        comment = comment.lower()
        comment = comment.strip()
        comment = re.sub(r'\n', ' ', comment)
        comment = re.sub(r'[^A-Za-z0-9\s!?.,]', '', comment)
        
        stop_words = set(stopwords.words('english')) - {'not', 'but', 'however', 'no', 'yet'}
        comment = ' '.join([word for word in comment.split() if word not in stop_words])
        
        lemmatizer = WordNetLemmatizer()
        comment = ' '.join([lemmatizer.lemmatize(word) for word in comment.split()])
        
        return comment
    except Exception as e:
        logger.error(f"Error processing comment: {e}")
        return ""

def process_data(data_path: str):
    try:
        raw_data_path = os.path.join(data_path, 'raw')
        interim_data_path = os.path.join(data_path, 'interim')
        
        # Create the data/interim directory if it does not exist
        os.makedirs(interim_data_path, exist_ok=True)
        
        logger.debug("Loading raw data from %s", raw_data_path)
        train_df = pd.read_csv(os.path.join(raw_data_path, 'train.csv'))
        test_df = pd.read_csv(os.path.join(raw_data_path, 'test.csv'))
        
        logger.debug("Applying preprocessing to train data")
        train_df['clean_comment'] = train_df['clean_comment'].apply(preprocess_comment)
        
        logger.debug("Applying preprocessing to test data")
        test_df['clean_comment'] = test_df['clean_comment'].apply(preprocess_comment)
        
        logger.debug("Saving processed data to %s", interim_data_path)
        train_df.to_csv(os.path.join(interim_data_path, 'train_processed.csv'), index=False)
        test_df.to_csv(os.path.join(interim_data_path, 'test_processed.csv'), index=False)
        
        logger.debug("Data preprocessing completed successfully")
    except Exception as e:
        logger.error('Unexpected error occurred during data preprocessing: %s', e)
        raise

def main():
    try:
        data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../data')
        process_data(data_path)
    except Exception as e:
        logger.error('Failed to complete data preprocessing process: %s', e)
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
