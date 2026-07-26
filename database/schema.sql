-- MediFlow AI - Enterprise Healthcare Intelligence Database Schema
-- Supports PostgreSQL / MySQL Normalized Architecture for Placement & Research

CREATE DATABASE IF NOT EXISTS mediflow_db;
USE mediflow_db;

-- 1. User Authentication & Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS Users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('PATIENT', 'HOSPITAL_ADMIN', 'GOVT_ADMIN', 'DOCTOR') NOT NULL,
    hospital_id VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Maharashtra Hospital Master Registry
CREATE TABLE IF NOT EXISTS Hospitals (
    hospital_id VARCHAR(50) PRIMARY KEY,
    hospital_name VARCHAR(200) NOT NULL,
    hospital_type ENUM('GOVERNMENT_MUNICIPAL', 'PRIVATE', 'SEMI_GOVT', 'TRUST') NOT NULL,
    district VARCHAR(100) NOT NULL,       -- e.g., 'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'
    zone VARCHAR(100) NOT NULL,           -- e.g., 'Central Zone', 'Western Suburbs'
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    helpline VARCHAR(50) NOT NULL,
    specializations TEXT,                  -- Comma-separated: Cardiology, Trauma, Neurology
    has_trauma_center BOOLEAN DEFAULT TRUE,
    has_blood_bank BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Live Hospital Resource Operations (Primary Operational Data Source)
CREATE TABLE IF NOT EXISTS HospitalLiveResources (
    resource_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_id VARCHAR(50) NOT NULL,
    total_beds INT NOT NULL,
    available_beds INT NOT NULL,
    icu_total INT NOT NULL,
    icu_available INT NOT NULL,
    oxygen_beds_total INT NOT NULL,
    oxygen_beds_available INT NOT NULL,
    ventilator_total INT NOT NULL,
    ventilator_available INT NOT NULL,
    emergency_status ENUM('NORMAL', 'LOW_SURGE', 'HIGH_SURGE', 'CRITICAL_OVERFLOW') DEFAULT 'NORMAL',
    avg_wait_mins INT DEFAULT 15,
    opd_queue_length INT DEFAULT 20,
    ambulance_available INT DEFAULT 3,
    doctors_on_duty INT DEFAULT 12,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES Hospitals(hospital_id) ON DELETE CASCADE
);

-- 4. District Blood Bank Registry
CREATE TABLE IF NOT EXISTS BloodBankRegistry (
    blood_bank_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_id VARCHAR(50) NOT NULL,
    district VARCHAR(100) NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-') NOT NULL,
    units_available INT DEFAULT 0,
    contact_number VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES Hospitals(hospital_id) ON DELETE CASCADE
);

-- 5. AI Predictions & Decision Log
CREATE TABLE IF NOT EXISTS AI_Predictions (
    prediction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_id VARCHAR(50) NOT NULL,
    model_type VARCHAR(100) NOT NULL,     -- 'RandomForest', 'XGBoost', 'LSTM', 'Time Series'
    target_metric VARCHAR(100) NOT NULL,   -- 'Bed_Occupancy', 'Footfall', 'Wait_Time', 'Blood_Demand'
    predicted_value FLOAT NOT NULL,
    confidence_score FLOAT NOT NULL,       -- R2 score or precision score (e.g. 0.94)
    forecast_horizon VARCHAR(50),          -- '24_HOURS', '7_DAYS'
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES Hospitals(hospital_id)
);

-- 6. Audit & Operational History Logs
CREATE TABLE IF NOT EXISTS AuditLogs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    hospital_id VARCHAR(50),
    action_type VARCHAR(100) NOT NULL,     -- 'RESOURCE_UPDATE', 'RECOMMENDATION_GEN', 'EMERGENCY_TRIAGE'
    details TEXT,
    ip_address VARCHAR(45),
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Users (Patients, Hospital Admins, Govt Authority)
INSERT IGNORE INTO Users (username, password_hash, email, full_name, role, hospital_id) VALUES
('patient_demo', '$2a$10$demoPatientHash', 'patient@mediflow.in', 'Rajesh Sharma', 'PATIENT', NULL),
('stj_admin', '$2a$10$demoAdminHash', 'admin@stjude.org', 'Dr. Sarah Jenkins', 'HOSPITAL_ADMIN', 'STJ-101'),
('cgh_admin', '$2a$10$demoAdminHash', 'admin@citygeneral.gov', 'Dr. Marcus Vance', 'HOSPITAL_ADMIN', 'CGH-202'),
('govt_authority', '$2a$10$demoGovtHash', 'director@health.maharashtra.gov.in', 'Dr. Arvind Patil', 'GOVT_ADMIN', NULL);

-- 7. Data Lifecycle & Automatic Purging Routines (Automated Data Retention)
-- Maintain only needed data and automatically delete records older than 30 days
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS PruneExpiredHealthcareData()
BEGIN
    -- Delete AI patient footfall & occupancy prediction logs older than 30 days
    DELETE FROM AI_Predictions WHERE generated_at < NOW() - INTERVAL 30 DAY;
    
    -- Delete audit logs older than 30 days
    DELETE FROM AuditLogs WHERE logged_at < NOW() - INTERVAL 30 DAY;
    
    -- Delete zero-unit or obsolete blood bank entries older than 30 days
    DELETE FROM BloodBankRegistry WHERE units_available <= 0 AND last_updated < NOW() - INTERVAL 30 DAY;
END //
DELIMITER ;

