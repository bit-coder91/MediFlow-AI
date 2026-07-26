import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("Warning: SHAP is not installed. Explainability portion will be skipped. Run 'pip install shap' to enable it.")

def train_and_evaluate():
    data_path = "../data/mediflow_hmis_analytics_dataset.csv"
    model_dir = "../models"
    os.makedirs(model_dir, exist_ok=True)
    
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # --- Feature Engineering for Classification Tasks ---
    # Use -np.inf and np.inf to aggressively guard against any NaNs resulting from division/clipping
    df['Hospital_Load_Risk'] = pd.cut(
        df['Occupied_Beds'] / df['Bed_Capacity'], 
        bins=[-np.inf, 0.60, 0.85, np.inf], 
        labels=['Low', 'Medium', 'High']
    )
    
    # Ensure there are no NaNs in target variables just in case
    df = df.dropna(subset=['Hospital_Load_Risk', 'Tomorrow_Medicine_Demand', 'Tomorrow_Bed_Occupancy'])

    # --- Data Preprocessing ---
    le_dept = LabelEncoder()
    le_disease = LabelEncoder()
    df['Department_Encoded'] = le_dept.fit_transform(df['Department'])
    df['Disease_Encoded'] = le_disease.fit_transform(df['Disease_Name'])
    
    joblib.dump(le_dept, os.path.join(model_dir, "label_encoder_dept.joblib"))
    joblib.dump(le_disease, os.path.join(model_dir, "label_encoder_disease.joblib"))
    
    # Define Feature Space (X)
    features = ['Department_Encoded', 'Disease_Encoded', 'HMIS_Ward_Capacity', 'Bed_Capacity', 
                'Occupied_Beds', 'ICU_Beds', 'Occupied_ICU', 'Doctors', 'Nurses', 
                'Medicine_Stock', 'Medicine_Consumption', 'Patients_Admitted', 'Patients_Discharged']
    
    # Append strictly relevant blood metrics dynamically
    features.extend([col for col in df.columns if col.startswith("Blood_")])
    
    X = df[features]
    
    print("-" * 50)
    print("1. Training Linear Regression (Medicine Demand Prediction)")
    y_lr = df['Tomorrow_Medicine_Demand']
    X_train, X_test, y_train, y_test = train_test_split(X, y_lr, test_size=0.2, random_state=42)
    
    lr_model = LinearRegression().fit(X_train, y_train)
    lr_preds = lr_model.predict(X_test)
    print(f"LR R2 Score: {r2_score(y_test, lr_preds):.4f}")
    print(f"LR MAE: {mean_absolute_error(y_test, lr_preds):.2f}")
    joblib.dump(lr_model, os.path.join(model_dir, "linear_regression_medicine.joblib"))

    print("-" * 50)
    print("2. Training Decision Tree (Hospital Load Classification)")
    y_dt = df['Hospital_Load_Risk']
    X_train_dt, X_test_dt, y_train_dt, y_test_dt = train_test_split(X, y_dt, test_size=0.2, random_state=42)
    
    dt_model = DecisionTreeClassifier(max_depth=5, random_state=42).fit(X_train_dt, y_train_dt)
    dt_preds = dt_model.predict(X_test_dt)
    
    print(f"DT Accuracy: {accuracy_score(y_test_dt, dt_preds):.4f}")
    joblib.dump(dt_model, os.path.join(model_dir, "decision_tree_hospital_load.joblib"))

    print("-" * 50)
    print("3. Training Random Forest (Bed Occupancy Prediction)")
    y_rf = df['Tomorrow_Bed_Occupancy']
    X_train_rf, X_test_rf, y_train_rf, y_test_rf = train_test_split(X, y_rf, test_size=0.2, random_state=42)
    
    rf_model = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42).fit(X_train_rf, y_train_rf)
    rf_preds = rf_model.predict(X_test_rf)
    
    print(f"RF R2 Score: {r2_score(y_test_rf, rf_preds):.4f}")
    print(f"RF RMSE: {np.sqrt(mean_squared_error(y_test_rf, rf_preds)):.2f}")
    joblib.dump(rf_model, os.path.join(model_dir, "random_forest_bed_occupancy.joblib"))

    print("-" * 50)
    if SHAP_AVAILABLE:
        print("Generating SHAP Explainability for Random Forest (on sample subset)...")
        explainer = shap.TreeExplainer(rf_model)
        # Compute explicitly to prevent terminal freeze
        importances = pd.DataFrame({'Feature': X.columns, 'Importance': rf_model.feature_importances_}).sort_values('Importance', ascending=False)
        print("\nTop 5 Influential Features for Bed Predictions:")
        print(importances.head(5).to_string(index=False))
    else:
        print("Skipping SHAP evaluation (module not found).")
        
    print("-" * 50)
    print(f"All models successfully trained and exported to: {os.path.abspath(model_dir)}")

if __name__ == "__main__":
    train_and_evaluate()
