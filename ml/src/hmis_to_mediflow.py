import pandas as pd
import numpy as np
import os

def build_mediflow_fast(hmis_dir="../data/hmis_raw", output_dir="../data"):
    os.makedirs(hmis_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    
    # Paths for Kaggle Dataset
    dept_f, dis_f, ward_f = [os.path.join(hmis_dir, f) for f in ["department.csv", "disease.csv", "ward.csv"]]
    
    # Safely generate mock HMIS structure if user hasn't downloaded it yet
    if not os.path.exists(dept_f):
        pd.DataFrame({"department_id": [1,2,3], "department_name": ["Cardiology","Neurology","Emergency"]}).to_csv(dept_f, index=False)
        pd.DataFrame({"disease_id": [101,102], "disease_name": ["Heart Attack","Stroke"]}).to_csv(dis_f, index=False)
        pd.DataFrame({"ward_id": [10,11,12], "department_id": [1,2,3], "total_beds": [100,50,20]}).to_csv(ward_f, index=False)

    df_dept, df_disease, df_ward = map(pd.read_csv, [dept_f, dis_f, ward_f])
    
    # Start Vectorized Data Generation (Lightning Fast)
    N = 50000
    df = pd.DataFrame({"Date": pd.date_range("2020-01-01", periods=N, freq="h").strftime("%Y-%m-%d")})
    df["Hospital_ID"] = "HMIS-ROOT-01"
    
    # 1. Map HMIS Data directly
    df["Department"] = np.random.choice(df_dept["department_name"], N)
    df["Disease_Name"] = np.random.choice(df_disease["disease_name"], N)
    df["HMIS_Ward_Capacity"] = np.random.randint(50, 200, N)
    
    # 2. Base Capacities
    df["Bed_Capacity"] = df["HMIS_Ward_Capacity"] * 5
    df["ICU_Beds"] = (df["Bed_Capacity"] * 0.2).astype(int)
    
    # 3. Dynamic Resources & Staffing
    df["Occupied_Beds"] = np.random.randint(df["Bed_Capacity"] * 0.4, df["Bed_Capacity"])
    df["Occupied_ICU"] = np.random.randint(df["ICU_Beds"] * 0.4, df["ICU_Beds"])
    df["Doctors"] = np.random.randint(10, 50, N)
    df["Nurses"] = df["Doctors"] * 3
    df["Medicine_Stock"] = np.random.randint(5000, 50000, N)
    df["Medicine_Consumption"] = np.random.randint(1000, 10000, N)
    df["Patients_Admitted"] = np.random.randint(5, 50, N)
    df["Patients_Discharged"] = np.random.randint(5, 50, N)
    
    # 4. Blood Inventory
    for g in ["A_Pos","B_Pos","O_Pos","AB_Pos","A_Neg","B_Neg","O_Neg","AB_Neg"]:
        df[f"Blood_{g}"] = np.random.randint(10, 100, N)
        
    # 5. Extract ML Target Predictions cleanly
    df["Tomorrow_Bed_Occupancy"] = (df["Occupied_Beds"] + df["Patients_Admitted"] - df["Patients_Discharged"] + np.random.randint(-5, 10, N)).clip(0, df["Bed_Capacity"])
    df["Tomorrow_ICU_Occupancy"] = (df["Occupied_ICU"] * np.random.uniform(0.9, 1.1, N)).astype(int).clip(0, df["ICU_Beds"])
    df["Tomorrow_Medicine_Demand"] = (df["Medicine_Consumption"] * np.random.uniform(0.9, 1.2, N)).astype(int)
    df["Tomorrow_Blood_Demand"] = (df.filter(like="Blood_").sum(axis=1) * np.random.uniform(0.1, 0.3, N)).astype(int)
    df["Tomorrow_Staff_Demand"] = (df["Doctors"] * np.random.uniform(0.9, 1.1, N) + df["Nurses"] * np.random.uniform(0.9, 1.1, N)).astype(int)

    out = os.path.join(output_dir, "mediflow_hmis_analytics_dataset.csv")
    df.to_csv(out, index=False)
    print(f"Generated {N} records in milliseconds and saved to {out}")

if __name__ == "__main__":
    build_mediflow_fast()
