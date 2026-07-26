import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

def generate_dataset(num_records=50000, output_dir="../data"):
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Base Definitions
    hospitals = [f"HOSP-{i:03d}" for i in range(1, 11)]
    departments = ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Pediatrics', 'Emergency', 'General Medicine']
    seasons = ['Winter', 'Spring', 'Summer', 'Monsoon', 'Autumn']
    disease_categories = ['Infectious', 'Chronic', 'Trauma', 'Surgical', 'Routine']
    equipment_statuses = ['Optimal', 'Warning', 'Critical', 'Maintenance']
    weather_conditions = ['Clear', 'Rain', 'Storm', 'Heatwave', 'Coldwave']
    
    data = []
    
    start_date = datetime(2023, 1, 1)
    
    print(f"Generating {num_records} synthetic hospital records...")
    
    for i in range(num_records):
        # Time variables
        current_date = start_date + timedelta(days=random.randint(0, 730))
        day_of_week = current_date.strftime("%a")
        is_weekend = 1 if current_date.weekday() >= 5 else 0
        is_holiday = 1 if random.random() < 0.05 else 0  # 5% chance of holiday
        season = random.choice(seasons)
        weather = random.choice(weather_conditions)
        
        # Base capacities
        bed_capacity = random.randint(50, 500)
        icu_capacity = int(bed_capacity * random.uniform(0.1, 0.25))
        
        # Current load
        patients_admitted = random.randint(10, int(bed_capacity * 0.8))
        patients_discharged = random.randint(5, patients_admitted)
        occupied_beds = min(bed_capacity, random.randint(int(bed_capacity * 0.4), bed_capacity))
        occupied_icu = min(icu_capacity, random.randint(int(icu_capacity * 0.3), icu_capacity))
        
        # Derived Rates
        occupancy_rate = round((occupied_beds / bed_capacity) * 100, 2)
        icu_rate = round((occupied_icu / icu_capacity) * 100 if icu_capacity > 0 else 0, 2)
        
        # Blood Inventory
        blood = {f"Blood_{g}": random.randint(0, 100) for g in 
                 ["A_Pos", "B_Pos", "O_Pos", "AB_Pos", "A_Neg", "B_Neg", "O_Neg", "AB_Neg"]}
        
        # Staff and Resources
        doctors = random.randint(10, 100)
        nurses = random.randint(int(doctors * 1.5), int(doctors * 3))
        ward_boys = random.randint(5, int(nurses * 0.8))
        
        emergency_cases = random.randint(1, 50)
        trauma_cases = random.randint(0, emergency_cases)
        ambulances_deployed = random.randint(1, 20)
        
        ventilators = random.randint(5, 50)
        oxygen_cylinders = random.randint(100, 1000)
        
        # Medicine
        medicine_stock = random.randint(1000, 50000)
        medicine_consumption = random.randint(500, medicine_stock)
        
        # Targets (Future predictions based on current state with noise)
        tmrw_bed_occupancy = min(bed_capacity, max(0, int(occupied_beds + (patients_admitted - patients_discharged) + random.randint(-10, 20))))
        tmrw_icu_occupancy = min(icu_capacity, max(0, int(occupied_icu + random.randint(-5, 10))))
        tmrw_medicine_demand = int(medicine_consumption * random.uniform(0.9, 1.2))
        tmrw_blood_demand = int(sum(blood.values()) * random.uniform(0.05, 0.2))
        tmrw_staff_demand = int(doctors * random.uniform(0.9, 1.1)) + int(nurses * random.uniform(0.9, 1.1))
        
        record = {
            "Date": current_date.strftime("%Y-%m-%d"),
            "Hospital_ID": random.choice(hospitals),
            "Department": random.choice(departments),
            "Patient_ID": f"PT-{i:06d}",
            "Patients_Admitted": patients_admitted,
            "Patients_Discharged": patients_discharged,
            "Bed_Capacity": bed_capacity,
            "Occupied_Beds": occupied_beds,
            "ICU_Beds": icu_capacity,
            "Occupied_ICU": occupied_icu,
            **blood,
            "Medicine_Stock": medicine_stock,
            "Medicine_Consumption": medicine_consumption,
            "Doctors": doctors,
            "Nurses": nurses,
            "Ward_Boys": ward_boys,
            "Emergency_Cases": emergency_cases,
            "Ambulances": ambulances_deployed,
            "Ventilators": ventilators,
            "Oxygen_Cylinders": oxygen_cylinders,
            "Average_Wait_Time": round(random.uniform(5.0, 120.0), 2),
            "Weather": weather,
            "Holiday": is_holiday,
            "Weekend_Flag": is_weekend,
            "Season": season,
            "Day_Of_Week": day_of_week,
            "Disease_Category": random.choice(disease_categories),
            "Disease_Severity_Score": round(random.uniform(1.0, 10.0), 1),
            "Equipment_Status": random.choice(equipment_statuses),
            
            # Engineered Features
            "Occupancy_Rate": occupancy_rate,
            "ICU_Rate": icu_rate,
            "Patient_Growth": patients_admitted - patients_discharged,
            "Emergency_Ratio": round(emergency_cases / max(1, patients_admitted), 2),
            "Medicine_Usage_Rate": round(medicine_consumption / max(1, medicine_stock), 2),
            "Blood_Usage_Rate": round(random.uniform(0.1, 0.8), 2),
            "Doctor_Patient_Ratio": round(doctors / max(1, occupied_beds), 3),
            "Nurse_Patient_Ratio": round(nurses / max(1, occupied_beds), 3),
            
            # Targets
            "Tomorrow_Bed_Occupancy": tmrw_bed_occupancy,
            "Tomorrow_ICU_Occupancy": tmrw_icu_occupancy,
            "Tomorrow_Medicine_Demand": tmrw_medicine_demand,
            "Tomorrow_Blood_Demand": tmrw_blood_demand,
            "Tomorrow_Staff_Demand": tmrw_staff_demand
        }
        data.append(record)
        
    df = pd.DataFrame(data)
    
    # Sort by date and hospital
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values(by=['Hospital_ID', 'Date']).reset_index(drop=True)
    
    # Automated Data Pruning: Keep only necessary active data for footfall & load analysis
    max_date = df['Date'].max()
    retention_cutoff = max_date - pd.Timedelta(days=365)
    initial_len = len(df)
    df = df[df['Date'] >= retention_cutoff].reset_index(drop=True)
    pruned_count = initial_len - len(df)
    print(f"Automated Data Retention: Pruned {pruned_count} old/unneeded historical records outside retention window.")

    file_path = os.path.join(output_dir, "mediflow_synthetic_dataset.csv")
    df.to_csv(file_path, index=False)
    print(f"Dataset successfully generated and saved to: {file_path}")
    print(f"Total Active Records Maintained: {len(df)}")
    print(f"Total Features: {len(df.columns)}")
    
if __name__ == "__main__":
    generate_dataset()
