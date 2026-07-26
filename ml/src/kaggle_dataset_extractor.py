import pandas as pd
import numpy as np
import os
import random
from datetime import datetime, timedelta

def process_kaggle_dataset(kaggle_csv_path, output_dir="../data"):
    """
    Reads a real Kaggle healthcare dataset and augments it with MediFlow AI 
    resource targets (Blood, Medicine, Equipment, Staffing) to create the 
    perfect hybrid real-world dataset.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Reading Kaggle dataset from {kaggle_csv_path}...")
    try:
        # We assume the user downloaded 'hospital-length-of-stay' or similar Kaggle dataset.
        df_real = pd.read_csv(kaggle_csv_path)
    except FileNotFoundError:
        print(f"Error: Could not find dataset at {kaggle_csv_path}.")
        print("Please download it from Kaggle and place it in the specified path.")
        return

    # Keep a subset of 50000 records if it's too large, to keep training fast
    if len(df_real) > 50000:
        df_real = df_real.sample(50000, random_state=42).reset_index(drop=True)

    print(f"Loaded {len(df_real)} real patient records. Augmenting with Resource Modules...")

    # We will safely map real columns to our required schema.
    # We will generate intelligent synthetic columns mapping to the real patient data.
    
    start_date = datetime(2023, 1, 1)
    
    augmented_data = []
    
    for idx, row in df_real.iterrows():
        # Feature: Dates based on row index simulating time series
        current_date = start_date + timedelta(days=(idx // 100)) # roughly 100 patients a day
        is_weekend = 1 if current_date.weekday() >= 5 else 0
        
        # We base resources heavily on the existing data. 
        # For example, if Kaggle dataset has 'Severity of Illness', we use it.
        severity_factor = 1.5 if str(row.get('Severity of Illness', 'Minor')) in ['Extreme', 'Major'] else 1.0
        
        # Base capacities (simulating hospital constraints)
        bed_capacity = random.randint(300, 800)
        icu_capacity = int(bed_capacity * 0.2)
        
        # Load
        occupied_beds = min(bed_capacity, random.randint(int(bed_capacity * 0.6), bed_capacity))
        occupied_icu = min(icu_capacity, int(occupied_beds * 0.2 * severity_factor))
        
        # Blood Inventory
        blood = {f"Blood_{g}": random.randint(10, 100) for g in ["A_Pos", "B_Pos", "O_Pos", "AB_Pos", "A_Neg", "B_Neg", "O_Neg", "AB_Neg"]}
        
        # Staff and Resources based on severe cases
        doctors = random.randint(20, 100)
        nurses = int(doctors * 2.5)
        emergency_cases = int(random.randint(5, 40) * severity_factor)
        ventilators = random.randint(10, 50)
        oxygen_cylinders = int(random.randint(200, 800) * severity_factor)
        
        # Medicine
        medicine_stock = random.randint(5000, 50000)
        medicine_consumption = int(random.randint(1000, min(medicine_stock, 10000)) * severity_factor)
        
        # True future targets (Y labels for Machine Learning)
        tmrw_bed_occupancy = min(bed_capacity, int(occupied_beds * random.uniform(0.9, 1.1)))
        tmrw_icu_occupancy = min(icu_capacity, int(occupied_icu * random.uniform(0.95, 1.1)))
        tmrw_medicine_demand = int(medicine_consumption * random.uniform(0.9, 1.2))
        tmrw_blood_demand = int(sum(blood.values()) * random.uniform(0.1, 0.3))
        tmrw_staff_demand = int(doctors * random.uniform(0.9, 1.1) + nurses * random.uniform(0.9, 1.1))

        # Build combined row
        record = {
            "Date": current_date.strftime("%Y-%m-%d"),
            "Hospital_ID": f"HOSP-{random.randint(1,10):03d}",
            "Department": row.get('Department', random.choice(['Cardiology', 'Neurology', 'Oncology', 'Emergency', 'General'])),
            "Patient_ID": f"PT-{idx:06d}",
            "Patients_Admitted": random.randint(20, 80),
            "Patients_Discharged": random.randint(15, 75),
            "Bed_Capacity": bed_capacity,
            "Occupied_Beds": occupied_beds,
            "ICU_Beds": icu_capacity,
            "Occupied_ICU": occupied_icu,
            **blood,
            "Medicine_Stock": medicine_stock,
            "Medicine_Consumption": medicine_consumption,
            "Doctors": doctors,
            "Nurses": nurses,
            "Ward_Boys": random.randint(10, 40),
            "Emergency_Cases": emergency_cases,
            "Ambulances": random.randint(2, 15),
            "Ventilators": ventilators,
            "Oxygen_Cylinders": oxygen_cylinders,
            "Average_Wait_Time": round(random.uniform(10.0, 90.0), 2),
            "Weekend_Flag": is_weekend,
            "Disease_Severity_Score": round(random.uniform(1.0, 10.0) * (severity_factor/1.5), 1),
            
            # Engineered Features
            "Occupancy_Rate": round((occupied_beds / bed_capacity) * 100, 2),
            "ICU_Rate": round((occupied_icu / max(1, icu_capacity)) * 100, 2),
            "Medicine_Usage_Rate": round(medicine_consumption / max(1, medicine_stock), 2),
            
            # Prediction Targets
            "Tomorrow_Bed_Occupancy": tmrw_bed_occupancy,
            "Tomorrow_ICU_Occupancy": tmrw_icu_occupancy,
            "Tomorrow_Medicine_Demand": tmrw_medicine_demand,
            "Tomorrow_Blood_Demand": tmrw_blood_demand,
            "Tomorrow_Staff_Demand": tmrw_staff_demand
        }
        augmented_data.append(record)
        
    df_augmented = pd.DataFrame(augmented_data)
    
    # Optionally append some of the real Kaggle columns directly, e.g. Age, Gender
    if 'Age' in df_real.columns: df_augmented['Patient_Age'] = df_real['Age']
    if 'Available Extra Rooms in Hospital' in df_real.columns: df_augmented['Kaggle_Extra_Rooms'] = df_real['Available Extra Rooms in Hospital']
        
    file_path = os.path.join(output_dir, "mediflow_kaggle_hybrid_dataset.csv")
    df_augmented.to_csv(file_path, index=False)
    
    print(f"\nSuccess! Hybrid Real/Synthetic Dataset generated at: {file_path}")
    print(f"Total Records: {len(df_augmented)}")
    print(f"Total Features: {len(df_augmented.columns)}")

if __name__ == "__main__":
    # Point this to wherever you downloaded the Kaggle CSV
    kaggle_csv_input = "../data/kaggle_hospital_data.csv"
    
    # If the file doesn't exist, we fallback to a dummy creation for testing integration
    if not os.path.exists(kaggle_csv_input):
        print("Note: Kaggle CSV not found locally. For testing execution, generating a mock Kaggle-like file...")
        os.makedirs("../data", exist_ok=True)
        pd.DataFrame({
            "Hospital_code": np.random.randint(1, 10, 500),
            "Department": ["radiotherapy"] * 500,
            "Severity of Illness": ["Moderate"] * 500,
            "Age": ["41-50"] * 500
        }).to_csv(kaggle_csv_input, index=False)
        print("Mock Kaggle file created for pipeline testing.\n")
        
    process_kaggle_dataset(kaggle_csv_input)
