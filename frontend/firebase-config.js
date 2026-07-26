/**
 * MediFlow AI - Authentic Maharashtra Hospitals Persistence & Data Manager
 * Handles real registered hospital accounts, dynamic hospital registration, and personnel authentication.
 */

const REAL_MAHARASHTRA_HOSPITALS = [
    {
        id: "KEM-MUM",
        pin: "400012",
        name: "King Edward Memorial (KEM) Hospital",
        type: "GOVERNMENT_MUNICIPAL",
        district: "Mumbai",
        zone: "Central Mumbai / Parel Ward",
        address: "Acharya Donde Marg, Parel, Mumbai 400012",
        lat: 19.0026,
        lng: 72.8427,
        dutyOfficer: "Dr. Sangeeta Rawat",
        role: "Medical Director",
        helpline: "+91 (22) 2410-7000",
        specializations: ["Cardiology", "Trauma", "Neurology", "General Surgery", "Orthopedics"],
        totalBeds: 1800,
        occupiedBeds: 1420,
        availableBeds: 380,
        icuTotal: 140,
        icuAvailable: 28,
        oxygenAvailable: 180,
        ventilatorsAvailable: 12,
        erLoadStatus: "HIGH_SURGE",
        avgWaitMins: 22,
        opdQueue: 140,
        doctorsDuty: 85,
        avatarInitials: "KM",
        blood_bank: { 'A+': 120, 'B+': 140, 'O+': 180, 'AB+': 45, 'O-': 28, 'A-': 18, 'B-': 20, 'AB-': 12 }
    },
    {
        id: "JJH-MUM",
        pin: "400008",
        name: "Sir JJ Group of Hospitals & Grant Medical College",
        type: "GOVERNMENT_MUNICIPAL",
        district: "Mumbai",
        zone: "South Mumbai / Byculla Ward",
        address: "J.J. Marg, Nagpada, Byculla, Mumbai 400008",
        lat: 18.9629,
        lng: 72.8335,
        dutyOfficer: "Dr. Pallavi Saple",
        role: "Chief Operations Officer",
        helpline: "+91 (22) 2373-5555",
        specializations: ["Trauma", "General Surgery", "Nephrology", "Burns Unit", "Pediatrics"],
        totalBeds: 2000,
        occupiedBeds: 1510,
        availableBeds: 490,
        icuTotal: 160,
        icuAvailable: 32,
        oxygenAvailable: 220,
        ventilatorsAvailable: 15,
        erLoadStatus: "NORMAL",
        avgWaitMins: 14,
        opdQueue: 160,
        doctorsDuty: 95,
        avatarInitials: "JJ",
        blood_bank: { 'A+': 150, 'B+': 175, 'O+': 210, 'AB+': 60, 'O-': 35, 'A-': 22, 'B-': 25, 'AB-': 14 }
    },
    {
        id: "SAS-PUN",
        pin: "411001",
        name: "Sassoon General Hospital & BJ Medical College",
        type: "GOVERNMENT_MUNICIPAL",
        district: "Pune",
        zone: "Pune Central Station District",
        address: "Jai Prakash Narayan Road, Near Railway Station, Pune 411001",
        lat: 18.5284,
        lng: 73.8739,
        dutyOfficer: "Dr. Vinayak Kale",
        role: "Public Health Officer",
        helpline: "+91 (20) 2612-8000",
        specializations: ["Trauma", "Burn Care", "Pediatrics", "General Surgery"],
        totalBeds: 1290,
        occupiedBeds: 980,
        availableBeds: 310,
        icuTotal: 120,
        icuAvailable: 28,
        oxygenAvailable: 135,
        ventilatorsAvailable: 10,
        erLoadStatus: "NORMAL",
        avgWaitMins: 12,
        opdQueue: 95,
        doctorsDuty: 65,
        avatarInitials: "SG",
        blood_bank: { 'A+': 110, 'B+': 130, 'O+': 160, 'AB+': 55, 'O-': 38, 'A-': 25, 'B-': 28, 'AB-': 15 }
    },
    {
        id: "DMH-PUN",
        pin: "411004",
        name: "Deenanath Mangeshkar Hospital & Research Centre",
        type: "PRIVATE",
        district: "Pune",
        zone: "Kothrud / Erandwane Pavilion",
        address: "Erandwane, Near Mhatre Bridge, Pune 411004",
        lat: 18.5039,
        lng: 73.8315,
        dutyOfficer: "Dr. Dhananjay Kelkar",
        role: "Medical Director",
        helpline: "+91 (20) 4015-1000",
        specializations: ["Cardiology", "Oncology", "Neurology", "Orthopedics"],
        totalBeds: 800,
        occupiedBeds: 610,
        availableBeds: 190,
        icuTotal: 90,
        icuAvailable: 18,
        oxygenAvailable: 95,
        ventilatorsAvailable: 7,
        erLoadStatus: "NORMAL",
        avgWaitMins: 8,
        opdQueue: 25,
        doctorsDuty: 42,
        avatarInitials: "DM",
        blood_bank: { 'A+': 65, 'B+': 75, 'O+': 90, 'AB+': 30, 'O-': 12, 'A-': 10, 'B-': 14, 'AB-': 8 }
    },
    {
        id: "GMC-NAG",
        pin: "440003",
        name: "Government Medical College & Hospital (GMCH)",
        type: "GOVERNMENT_MUNICIPAL",
        district: "Nagpur",
        zone: "Hanuman Nagar Precinct",
        address: "Medical Square, Hanuman Nagar, Nagpur 440003",
        lat: 21.1275,
        lng: 79.0970,
        dutyOfficer: "Dr. Raj Gajbhiye",
        role: "Regional Health Officer",
        helpline: "+91 (712) 274-0400",
        specializations: ["Trauma", "Pediatrics", "Cardiology", "Nephrology"],
        totalBeds: 1400,
        occupiedBeds: 1050,
        availableBeds: 350,
        icuTotal: 110,
        icuAvailable: 32,
        oxygenAvailable: 180,
        ventilatorsAvailable: 14,
        erLoadStatus: "NORMAL",
        avgWaitMins: 15,
        opdQueue: 120,
        doctorsDuty: 75,
        avatarInitials: "GM",
        blood_bank: { 'A+': 95, 'B+': 115, 'O+': 140, 'AB+': 45, 'O-': 30, 'A-': 22, 'B-': 24, 'AB-': 12 }
    },
    {
        id: "BCH-MUM",
        pin: "400026",
        name: "Breach Candy Hospital Trust",
        type: "PRIVATE",
        district: "Mumbai",
        zone: "South Mumbai / Cumballa Hill",
        address: "60A Bhulabhai Desai Road, Breach Candy, Mumbai 400026",
        lat: 18.9715,
        lng: 72.8052,
        dutyOfficer: "Dr. Geeta Koppikar",
        role: "Medical Superintendent",
        helpline: "+91 (22) 2366-7788",
        specializations: ["Cardiology", "Oncology", "Orthopedics", "Emergency Care"],
        totalBeds: 212,
        occupiedBeds: 170,
        availableBeds: 42,
        icuTotal: 35,
        icuAvailable: 6,
        oxygenAvailable: 22,
        ventilatorsAvailable: 3,
        erLoadStatus: "HIGH_SURGE",
        avgWaitMins: 18,
        opdQueue: 20,
        doctorsDuty: 24,
        avatarInitials: "BC",
        blood_bank: { 'A+': 35, 'B+': 40, 'O+': 50, 'AB+': 18, 'O-': 8, 'A-': 9, 'B-': 10, 'AB-': 4 }
    },
    {
        id: "LIL-MUM",
        pin: "400050",
        name: "Lilavati Hospital & Research Centre",
        type: "PRIVATE",
        district: "Mumbai",
        zone: "Western Suburbs / Bandra West",
        address: "A-791, Bandra Reclamation, Bandra West, Mumbai 400050",
        lat: 19.0514,
        lng: 72.8288,
        dutyOfficer: "Dr. V. Ravishankar",
        role: "Chief Operating Officer",
        helpline: "+91 (22) 2675-1000",
        specializations: ["Cardiology", "Neurology", "Gastroenterology", "Urology"],
        totalBeds: 323,
        occupiedBeds: 255,
        availableBeds: 68,
        icuTotal: 50,
        icuAvailable: 9,
        oxygenAvailable: 38,
        ventilatorsAvailable: 4,
        erLoadStatus: "NORMAL",
        avgWaitMins: 10,
        opdQueue: 30,
        doctorsDuty: 35,
        avatarInitials: "LH",
        blood_bank: { 'A+': 55, 'B+': 60, 'O+': 80, 'AB+': 25, 'O-': 15, 'A-': 12, 'B-': 14, 'AB-': 7 }
    },
    {
        id: "CIV-NSK",
        pin: "422001",
        name: "Nashik District Civil Government Hospital",
        type: "GOVERNMENT_MUNICIPAL",
        district: "Nashik",
        zone: "Trimbak Naka Precinct",
        address: "Civil Hospital Road, Trimbak Naka, Nashik 422001",
        lat: 19.9975,
        lng: 73.7898,
        dutyOfficer: "Dr. Ashok Thorat",
        role: "Civil Surgeon & Administrator",
        helpline: "+91 (253) 257-2000",
        specializations: ["Emergency Care", "Maternity", "General Surgery", "Orthopedics"],
        totalBeds: 500,
        occupiedBeds: 380,
        availableBeds: 120,
        icuTotal: 45,
        icuAvailable: 12,
        oxygenAvailable: 75,
        ventilatorsAvailable: 5,
        erLoadStatus: "NORMAL",
        avgWaitMins: 15,
        opdQueue: 50,
        doctorsDuty: 32,
        avatarInitials: "NC",
        blood_bank: { 'A+': 55, 'B+': 65, 'O+': 85, 'AB+': 25, 'O-': 14, 'A-': 12, 'B-': 10, 'AB-': 6 }
    }
];

class DataStoreManager {
    constructor() {
        this.hospitalsKey = 'mediflow_registered_hospitals';
        this.sessionKey = 'mediflow_authenticated_hospital';
        this.themeKey = 'mediflow_theme_mode';
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem(this.hospitalsKey)) {
            localStorage.setItem(this.hospitalsKey, JSON.stringify(REAL_MAHARASHTRA_HOSPITALS));
        }
        this.pruneStaleData();
    }

    pruneStaleData() {
        try {
            const list = this.getHospitals();
            let modified = false;
            list.forEach(h => {
                if (h.blood_bank) {
                    Object.keys(h.blood_bank).forEach(g => {
                        if (h.blood_bank[g] < 0) {
                            h.blood_bank[g] = 0;
                            modified = true;
                        }
                    });
                }
            });
            if (modified) {
                localStorage.setItem(this.hospitalsKey, JSON.stringify(list));
            }
        } catch (err) {}
    }

    getHospitals() {
        try {
            const data = localStorage.getItem(this.hospitalsKey);
            return data ? JSON.parse(data) : REAL_MAHARASHTRA_HOSPITALS;
        } catch (err) {
            return REAL_MAHARASHTRA_HOSPITALS;
        }
    }

    getPublicHospitals() {
        return this.getHospitals().map(h => {
            const clean = { ...h };
            delete clean.pin;
            return clean;
        });
    }

    registerNewHospital(newHospData) {
        const list = this.getHospitals();
        
        // Generate unique Hospital Code ID
        const randomNum = Math.floor(100 + Math.random() * 900);
        const prefix = (newHospData.name || "HOSP").substring(0, 3).toUpperCase();
        const generatedId = `${prefix}-${randomNum}`;
        const pin = newHospData.pin || `${Math.floor(1000 + Math.random() * 9000)}`;

        const hospitalRecord = {
            id: generatedId,
            pin: pin,
            name: newHospData.name,
            type: newHospData.type || "PRIVATE",
            district: newHospData.district || "Mumbai",
            zone: newHospData.zone || `${newHospData.district} Medical Precinct`,
            address: newHospData.address || `${newHospData.district}, Maharashtra`,
            lat: newHospData.lat || 18.9388,
            lng: newHospData.lng || 72.8258,
            dutyOfficer: newHospData.dutyOfficer || "Dr. Medical Director",
            role: "Hospital Operations Manager",
            helpline: newHospData.helpline || "+91 (22) 100-2000",
            specializations: newHospData.specializations || ["Emergency Care", "General Surgery"],
            totalBeds: parseInt(newHospData.totalBeds || 150),
            occupiedBeds: parseInt(newHospData.totalBeds || 150) - parseInt(newHospData.availableBeds || 40),
            availableBeds: parseInt(newHospData.availableBeds || 40),
            icuTotal: parseInt(newHospData.icuTotal || 20),
            icuAvailable: parseInt(newHospData.icuAvailable || 5),
            oxygenAvailable: parseInt(newHospData.oxygenAvailable || 25),
            ventilatorsAvailable: parseInt(newHospData.ventilatorsAvailable || 4),
            erLoadStatus: "NORMAL",
            avgWaitMins: 15,
            opdQueue: 20,
            doctorsDuty: 15,
            avatarInitials: prefix.substring(0, 2),
            blood_bank: { 'A+': 30, 'B+': 30, 'O+': 40, 'AB+': 15, 'O-': 6, 'A-': 8, 'B-': 7, 'AB-': 3 }
        };

        list.unshift(hospitalRecord);
        localStorage.setItem(this.hospitalsKey, JSON.stringify(list));

        const publicRecord = { ...hospitalRecord };
        delete publicRecord.pin;
        return { success: true, hospital: publicRecord };
    }

    getAuthenticatedHospital() {
        try {
            const data = localStorage.getItem(this.sessionKey);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            return null;
        }
    }

    authenticateHospital(hospitalId, pin) {
        const list = this.getHospitals();
        const hospital = list.find(
            h => h.id.toUpperCase() === hospitalId.trim().toUpperCase() && h.pin === pin.trim()
        );
        if (hospital) {
            const sessionHosp = { ...hospital };
            delete sessionHosp.pin;
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionHosp));
            return { success: true, hospital: sessionHosp };
        }
        return { success: false, message: "Invalid Hospital Code ID or Access PIN." };
    }

    logoutHospital() {
        localStorage.removeItem(this.sessionKey);
    }

    getTheme() {
        return localStorage.getItem(this.themeKey) || 'dark';
    }

    setTheme(mode) {
        localStorage.setItem(this.themeKey, mode);
    }
}

window.dataStore = new DataStoreManager();
window.firebaseStore = window.dataStore;
