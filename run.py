import os
import sys
import time
import subprocess
import webbrowser

def main():
    print("=" * 65)
    print("      🏥 MediFlow AI - Hospital Resource Intelligence System 🏥")
    print("=" * 65)
    print("Initializing environment checks...")
    
    # 1. Check directories
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, "ml", "models")
    frontend_dir = os.path.join(base_dir, "frontend")
    
    if not os.path.exists(models_dir):
        print(f"❌ Error: Models directory missing at {models_dir}")
        sys.exit(1)
        
    if not os.path.exists(frontend_dir):
        print(f"❌ Error: Frontend directory missing at {frontend_dir}")
        sys.exit(1)
        
    print("✅ Project directories verified.")

    # 2. Check ML model files
    required_models = [
        "decision_tree_hospital_load.joblib",
        "linear_regression_medicine.joblib",
        "random_forest_bed_occupancy.joblib",
        "label_encoder_dept.joblib",
        "label_encoder_disease.joblib"
    ]
    
    missing = [m for m in required_models if not os.path.exists(os.path.join(models_dir, m))]
    if missing:
        print(f"⚠️  Warning: Missing trained models: {missing}")
        print("   Running train_models.py to train models now...")
        train_script = os.path.join(base_dir, "ml", "src", "train_models.py")
        if os.path.exists(train_script):
            subprocess.run([sys.executable, train_script], cwd=os.path.join(base_dir, "ml", "src"))
        else:
            print("❌ Error: Cannot train missing models, train_models.py not found.")
    else:
        print("✅ Pre-trained Machine Learning models verified.")

    # 3. Launch Flask Server
    server_script = os.path.join(base_dir, "server.py")
    print("\n🚀 Starting MediFlow AI Web Application Server...")
    print("   URL: http://127.0.0.1:5000")
    print("=" * 65)

    # Open browser automatically after 1.5 seconds
    def open_browser():
        time.sleep(1.5)
        webbrowser.open("http://127.0.0.1:5000")

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    # Run Flask server
    subprocess.run([sys.executable, server_script])

if __name__ == "__main__":
    main()
