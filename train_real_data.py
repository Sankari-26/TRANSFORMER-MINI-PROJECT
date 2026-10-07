import pandas as pd
import lightgbm as lgb
from pymongo import MongoClient

print("1. Connecting to MongoDB...")
client = MongoClient('mongodb://127.0.0.1:27017/') 
db = client['transformer-monitor'] 
collection = db['transformerdatas'] 

print("2. Fetching real historical data...")
cursor = collection.find({}, {'loadPercent': 1, 'oilTemperature': 1, '_id': 0})
df = pd.DataFrame(list(cursor))

if df.empty:
    print("❌ Error: No data found!")
    exit()

print("3. Generating a realistic Risk Curve...")
# Instead of 0 or 1, we now generate a continuous score from 0.0 to 1.0
def calculate_risk(row):
    load = row['loadPercent']
    temp = row['oilTemperature']
    
    risk = 0.0
    
    # Risk gradually increases as load goes over 60%
    if load > 60:
        risk += (load - 60) * 0.015 
        
    # Risk gradually increases as temp goes over 65°C
    if temp > 65:
        risk += (temp - 65) * 0.025
        
    # Cap the maximum risk at 1.0 (100%) and minimum at 0.0 (0%)
    return min(max(risk, 0.0), 1.0)

df['risk_score'] = df.apply(calculate_risk, axis=1)

print("4. Training LightGBM Regression Model...")
X = df[['loadPercent', 'oilTemperature']]
y = df['risk_score']

train_data = lgb.Dataset(X, label=y)

# 🔥 CHANGED to 'regression' so it predicts smooth numbers instead of just 0 or 1!
params = {
    'objective': 'regression',
    'metric': 'rmse',
    'boosting_type': 'gbdt',
    'learning_rate': 0.05,
    'num_leaves': 31
}

bst = lgb.train(params, train_data, num_boost_round=100)

print("5. Saving the finished AI model...")
bst.save_model('real_transformer_model.txt')
print("🔥 SUCCESS! Your new smooth Regression model is ready!")