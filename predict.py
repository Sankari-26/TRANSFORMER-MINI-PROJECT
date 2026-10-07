import sys
import lightgbm as lgb
import numpy as np

# 1. Catch the real-time data sent from Node.js
try:
    load_percent = float(sys.argv[1])
    oil_temp = float(sys.argv[2])
except IndexError:
    print("Error: Missing data")
    sys.exit(1)

# 2. Format the data for LightGBM
input_data = np.array([[load_percent, oil_temp]])

# 3. Load your newly trained AI model
try:
    bst = lgb.Booster(model_file='real_transformer_model.txt')
    
    # Get the raw probability (e.g., 0.85) and convert to a percentage (85.0)
    prediction_raw = bst.predict(input_data)[0]
    prediction_pct = round(prediction_raw * 100, 1)
    
    print(prediction_pct)
except Exception as e:
    print(f"Error: {e}")