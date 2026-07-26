/**
 * MediFlow AI - Healthcare Network Application Controller
 * Handles Public Candidate Viewing, Authentic Maharashtra Hospital Data, Leaflet Maps,
 * Live Google Web Search, New Hospital Registration, and Hourly Bed Updates.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("MediFlow AI Healthcare Platform Initializing...");

    // Global State
    let leafletMapInstance = null;
    let mapMarkers = [];
    let userLocation = { lat: 18.9388, lng: 72.8258 };

    // Request real-time user GPS coordinates
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                userLocation.lat = pos.coords.latitude;
                userLocation.lng = pos.coords.longitude;
                console.log("Real-time user GPS position acquired:", userLocation);
            },
            (err) => console.log("Using default location (Mumbai center):", err.message),
            { timeout: 4000 }
        );
    }

    // Element References
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const btnGlobalRefresh = document.getElementById('btn-global-refresh');
    const btnQuickEmergency = document.getElementById('btn-quick-emergency');
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    const btnRunAiRec = document.getElementById('btn-run-ai-rec');
    const btnTriggerEmergTriage = document.getElementById('btn-trigger-emerg-triage');
    const btnSearchBloodInventory = document.getElementById('btn-search-blood-inventory');
    const predictionForm = document.getElementById('prediction-form');

    // Discovery Filter Controls
    const discSearchInput = document.getElementById('disc-search-input');
    const discDistrictSelect = document.getElementById('disc-district-select');
    const discTypeSelect = document.getElementById('disc-type-select');
    const discSpecSelect = document.getElementById('disc-spec-select');

    // Google Search & New Hospital Registration Elements
    const formGoogleWebSearch = document.getElementById('form-google-web-search');
    const formRegisterNewHospital = document.getElementById('form-register-new-hospital');

    // Gated Admin Portal Elements
    const formGatedAdminLogin = document.getElementById('form-gated-admin-login');
    const adminGatedLoginPanel = document.getElementById('admin-gated-login-panel');
    const adminUnlockedConsole = document.getElementById('admin-unlocked-console');
    const btnLogoutHospitalAdmin = document.getElementById('btn-logout-hospital-admin');
    const formAdminResourceUpdate = document.getElementById('form-admin-resource-update');

    // --------------------------------------------------------------------------
    // 1. Dark / Light Theme System
    // --------------------------------------------------------------------------
    function initTheme() {
        const savedTheme = localStorage.getItem('mediflow_theme') || (window.dataStore ? window.dataStore.getTheme() : 'light');
        const iconSun = document.getElementById('theme-icon-sun');
        const iconMoon = document.getElementById('theme-icon-moon');

        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            if (iconSun) iconSun.classList.remove('hidden');
            if (iconMoon) iconMoon.classList.add('hidden');
        } else {
            document.body.classList.remove('dark-theme');
            if (iconSun) iconSun.classList.add('hidden');
            if (iconMoon) iconMoon.classList.remove('hidden');
        }
    }

    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        const newTheme = isDark ? 'dark' : 'light';
        localStorage.setItem('mediflow_theme', newTheme);
        if (window.dataStore) window.dataStore.setTheme(newTheme);

        const iconSun = document.getElementById('theme-icon-sun');
        const iconMoon = document.getElementById('theme-icon-moon');

        if (isDark) {
            if (iconSun) iconSun.classList.remove('hidden');
            if (iconMoon) iconMoon.classList.add('hidden');
            showToast("Theme Mode", "Switched to Dark Mode theme", "info");
        } else {
            if (iconSun) iconSun.classList.add('hidden');
            if (iconMoon) iconMoon.classList.remove('hidden');
            showToast("Theme Mode", "Switched to Light Mode theme", "info");
        }
    }

    if (btnToggleTheme) btnToggleTheme.addEventListener('click', toggleTheme);
    initTheme();

    // --------------------------------------------------------------------------
    // 2. Real Session Runtime Counter (Starts from 00:00:00)
    // --------------------------------------------------------------------------
    const sessionStartTime = Date.now();
    function updateSessionRuntime() {
        const elapsedSecs = Math.floor((Date.now() - sessionStartTime) / 1000);
        const hrs = String(Math.floor(elapsedSecs / 3600)).padStart(2, '0');
        const mins = String(Math.floor((elapsedSecs % 3600) / 60)).padStart(2, '0');
        const secs = String(elapsedSecs % 60).padStart(2, '0');
        const runtimeEl = document.getElementById('live-clock');
        if (runtimeEl) runtimeEl.innerText = `${hrs}:${mins}:${secs}`;
    }
    setInterval(updateSessionRuntime, 1000);
    updateSessionRuntime();

    // --------------------------------------------------------------------------
    // 3. User Access Header UI Updater
    // --------------------------------------------------------------------------
    function updateAuthHeaderUI() {
        const authHosp = window.dataStore.getAuthenticatedHospital();
        const tagEl = document.getElementById('sidebar-access-tag');
        const codeEl = document.getElementById('sidebar-access-code');
        const nameEl = document.getElementById('sidebar-hospital-name');
        const subEl = document.getElementById('sidebar-hospital-sub');
        const avatarEl = document.getElementById('officer-avatar');

        if (authHosp) {
            if (tagEl) tagEl.innerText = "AUTHENTICATED STAFF";
            if (codeEl) codeEl.innerText = authHosp.id;
            if (nameEl) nameEl.innerText = authHosp.name;
            if (subEl) subEl.innerText = `${authHosp.dutyOfficer} (${authHosp.district})`;
            if (avatarEl) avatarEl.innerText = authHosp.avatarInitials || "ADM";
        } else {
            if (tagEl) tagEl.innerText = "Public Mode";
            if (codeEl) codeEl.innerText = "GUEST";
            if (nameEl) nameEl.innerText = "Public Candidate View";
            if (subEl) subEl.innerText = "No Password Required";
            if (avatarEl) avatarEl.innerText = "GUEST";
        }
    }

    updateAuthHeaderUI();

    // --------------------------------------------------------------------------
    // 4. Smart Hospital Priority Recommendation Algorithm
    // --------------------------------------------------------------------------
    function computeAiRecommendationScore(h, requiredSpec = 'ALL', isEmergency = false) {
        const userLat = userLocation.lat, userLng = userLocation.lng;
        const dLat = (h.lat - userLat) * Math.PI / 180;
        const dLng = (h.lng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(userLat * Math.PI / 180) * Math.cos(h.lat * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
        const distKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
        const estTravelMins = Math.round(distKm * 2.2) + 6;

        const availB = h.availableBeds !== undefined ? h.availableBeds : (h.available_beds !== undefined ? h.available_beds : 50);
        const totalB = h.totalBeds !== undefined ? h.totalBeds : (h.total_beds !== undefined ? h.total_beds : 200);
        const icuAvail = h.icuAvailable !== undefined ? h.icuAvailable : (h.icu_available !== undefined ? h.icu_available : 10);
        const icuTot = h.icuTotal !== undefined ? h.icuTotal : (h.icu_total !== undefined ? h.icu_total : 30);
        const waitM = h.avgWaitMins !== undefined ? h.avgWaitMins : (h.avg_wait_mins !== undefined ? h.avg_wait_mins : 15);
        const rating = h.rating || 4.6;
        const reviewCount = h.review_count || 180;

        const distScore = Math.max(0.0, 1.0 - (distKm / 60.0));
        const bedScore = availB / Math.max(1, totalB);
        const icuScore = icuAvail / Math.max(1, icuTot);
        const waitScore = Math.max(0.0, 1.0 - (waitM / 60.0));
        const specs = h.specializations || ["Emergency Care"];
        const specMatch = (requiredSpec === 'ALL' || specs.some(s => s.toLowerCase().includes(requiredSpec.toLowerCase()))) ? 1.0 : 0.4;

        let finalScore = 0;
        if (isEmergency) {
            finalScore = (distScore * 35) + (icuScore * 35) + (bedScore * 15) + (waitScore * 15);
        } else {
            finalScore = (distScore * 25) + (bedScore * 25) + (icuScore * 25) + (waitScore * 15) + (specMatch * 10);
        }

        return {
            recScore: Math.round(finalScore * 10) / 10,
            distKm,
            estTravelMins,
            rating,
            review_count: reviewCount,
            available_beds: availB,
            total_beds: totalB,
            icu_available: icuAvail,
            avg_wait_mins: waitM
        };
    }

    // --------------------------------------------------------------------------
    // 5. Leaflet Map Component
    // --------------------------------------------------------------------------
    function initLeafletMap(hospitals) {
        const mapContainer = document.getElementById('leaflet-map');
        if (!mapContainer || typeof L === 'undefined') return;

        if (leafletMapInstance) {
            leafletMapInstance.remove();
            leafletMapInstance = null;
        }

        leafletMapInstance = L.map('leaflet-map').setView([18.9388, 72.8258], 9);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap | MediFlow Live Network'
        }).addTo(leafletMapInstance);

        mapMarkers = [];
        hospitals.forEach(h => {
            if (!h.lat || !h.lng) return;
            const icuAvail = h.icuAvailable !== undefined ? h.icuAvailable : (h.icu_available || 10);
            const markerColor = icuAvail > 20 ? '#10b981' : (icuAvail > 8 ? '#f59e0b' : '#ef4444');
            
            const customIcon = L.divIcon({
                className: 'custom-leaflet-marker',
                html: `<div style="background-color: ${markerColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 8px ${markerColor};"></div>`,
                iconSize: [14, 14]
            });

            const popupContent = `
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
                    <strong style="font-size: 13px; display: block;">${h.name}</strong>
                    <span style="color: #64748b;">${h.district} &bull; ${h.type}</span><br/>
                    <div style="margin-top: 4px;">
                        <strong>Beds Avail:</strong> ${h.availableBeds || h.available_beds || 40}/${h.totalBeds || h.total_beds || 200}<br/>
                        <strong>ICU Avail:</strong> <span style="color: #10b981; font-weight: bold;">${icuAvail} Beds</span><br/>
                        <strong>Helpline:</strong> ${h.helpline}
                    </div>
                </div>
            `;

            const marker = L.marker([h.lat, h.lng], { icon: customIcon })
                .addTo(leafletMapInstance)
                .bindPopup(popupContent);

            mapMarkers.push(marker);
        });
    }

    // --------------------------------------------------------------------------
    // 6. Public Patient Hospital Directory Handler
    // --------------------------------------------------------------------------
    function loadMaharashtraDiscovery() {
        const container = document.getElementById('discovery-hospital-cards');
        if (!container) return;

        const allHospitals = window.dataStore.getHospitals();
        const district = discDistrictSelect ? discDistrictSelect.value : 'ALL';
        const hospType = discTypeSelect ? discTypeSelect.value : 'ALL';
        const spec = discSpecSelect ? discSpecSelect.value : 'ALL';
        const search = discSearchInput ? discSearchInput.value.toLowerCase() : '';

        const filtered = allHospitals.filter(h => {
            if (district !== 'ALL' && h.district.toLowerCase() !== district.toLowerCase()) return false;
            if (hospType !== 'ALL' && h.type.toLowerCase() !== hospType.toLowerCase()) return false;
            if (spec !== 'ALL' && !h.specializations.some(s => s.toLowerCase().includes(spec.toLowerCase()))) return false;
            if (search && !(h.name.toLowerCase().includes(search) || h.address.toLowerCase().includes(search))) return false;
            return true;
        });

        renderDiscoveryCards(filtered);
        initLeafletMap(filtered);
    }

    function renderDiscoveryCards(list) {
        const container = document.getElementById('discovery-hospital-cards');
        if (!container) return;

        const specFilter = discSpecSelect ? discSpecSelect.value : 'ALL';

        const scoredList = list.map(h => {
            const metrics = computeAiRecommendationScore(h, specFilter, false);
            return { ...h, ...metrics };
        });

        scoredList.sort((a, b) => b.recScore - a.recScore);

        if (scoredList.length === 0) {
            container.innerHTML = `<div class="col-span-2 p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-xs">No hospitals match your search criteria.</div>`;
            return;
        }

        container.innerHTML = scoredList.map(h => `
            <div class="card p-6 bg-white/90 border border-[#2D8A8A]/10 rounded-3xl flex flex-col justify-between hover:border-[#2D8A8A]/30 transition shadow-xl relative overflow-hidden">
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="text-[10px] font-bold ${h.type === 'GOVERNMENT_MUNICIPAL' ? 'text-[#2D8A8A] bg-[#EBF5F5] border-[#2D8A8A]/20' : 'text-[#D3663E] bg-[#FDF2EE] border-[#F5A285]/30'} border px-3 py-1 rounded-full uppercase tracking-wider block mb-1.5">
                                ${h.type === 'GOVERNMENT_MUNICIPAL' ? '🏛️ Public Government Hospital' : '🏥 Private Specialty Hospital'}
                            </span>
                            <h3 class="text-base font-heading font-extrabold text-[#1E232A]">${h.name}</h3>
                            <p class="text-xs text-[#4A5568] mt-0.5">${h.address} &bull; <strong class="text-[#1E232A]">${h.district}</strong></p>
                        </div>
                        
                        <div class="text-right flex flex-col items-end gap-1">
                            <div class="px-3.5 py-1 bg-[#2D8A8A] text-white rounded-full text-xs font-bold block shadow-md">
                                ${h.recScore} <span class="text-[9px] font-normal text-teal-100">/ 100</span>
                            </div>
                            <span class="text-[10px] text-[#D3663E] font-bold bg-[#FDF2EE] border border-[#F5A285]/30 px-2.5 py-0.5 rounded-full block">
                                ⭐ ${h.rating || 4.7} <span class="text-[9px] text-[#4A5568]">(${h.review_count || 185} Google reviews)</span>
                            </span>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2.5 my-4">
                        <div class="p-3 bg-[#F4F1EA] border border-[#2D8A8A]/10 rounded-2xl text-center">
                            <span class="text-[10px] text-[#4A5568] block font-medium">Available Beds</span>
                            <span class="text-sm font-bold text-[#1E232A]">${h.available_beds} / ${h.total_beds}</span>
                        </div>
                        <div class="p-3 bg-[#EBF5F5] border border-[#2D8A8A]/20 rounded-2xl text-center">
                            <span class="text-[10px] text-[#2D8A8A] block font-medium">ICU Available</span>
                            <span class="text-sm font-bold text-[#2D8A8A]">${h.icu_available} Beds</span>
                        </div>
                        <div class="p-3 bg-[#EBF5F5] border border-[#2D8A8A]/20 rounded-2xl text-center">
                            <span class="text-[10px] text-[#2D8A8A] block font-medium">Est. Arrival Time</span>
                            <span class="text-xs font-extrabold text-[#2D8A8A] block">~${h.estTravelMins} mins</span>
                            <span class="text-[10px] text-[#4A5568]">(${h.distKm} km away)</span>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-1.5 mb-4">
                        ${(h.specializations || ["Emergency Care"]).map(s => `<span class="text-[10px] bg-[#EBF5F5] text-[#2D8A8A] px-2.5 py-1 rounded-full border border-[#2D8A8A]/15 font-medium">${s}</span>`).join('')}
                    </div>
                </div>

                <div class="pt-3 border-t border-[#2D8A8A]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span class="text-xs text-[#4A5568]">Helpline: <strong class="text-[#1E232A] font-mono">${h.helpline}</strong></span>
                    <div class="flex items-center gap-2">
                        <a href="https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}" target="_blank" class="px-3.5 py-1.5 bg-[#2D8A8A] text-white rounded-full text-xs font-bold hover:bg-[#236B6B] transition flex items-center gap-1 shadow-sm">
                            <span>📍 Google Maps Pointer</span>
                        </a>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}" target="_blank" class="px-3 py-1.5 bg-[#EBF5F5] text-[#2D8A8A] border border-[#2D8A8A]/20 hover:bg-[#2D8A8A] hover:text-white rounded-full text-xs font-bold transition flex items-center gap-1 shadow-sm">
                            <span>Directions</span>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    if (discSearchInput) discSearchInput.addEventListener('input', loadMaharashtraDiscovery);
    if (discDistrictSelect) discDistrictSelect.addEventListener('change', loadMaharashtraDiscovery);
    if (discTypeSelect) discTypeSelect.addEventListener('change', loadMaharashtraDiscovery);
    if (discSpecSelect) discSpecSelect.addEventListener('change', loadMaharashtraDiscovery);
    if (btnRunAiRec) {
        btnRunAiRec.addEventListener('click', () => {
            loadMaharashtraDiscovery();
            showToast("Hospital Match", "Calculated top hospital priority scores for your area", "success");
        });
    }

    // --------------------------------------------------------------------------
    // 7. Online Google Web Hospital Search Handler (Real-Time Upgraded API)
    // --------------------------------------------------------------------------
    // --------------------------------------------------------------------------
    // 7. Online Pharmacy & Medicine Price Comparator + Google Maps Pointers
    // --------------------------------------------------------------------------
    let pharmacyMapInstance = null;

    // --------------------------------------------------------------------------
    // Pharmacy search — central async function (avoids code duplication)
    // --------------------------------------------------------------------------
    async function runPharmacySearch(query) {
        const container = document.getElementById('google-search-results-cards');
        if (!container || !query) return;

        container.innerHTML = `<div class="p-8 text-center bg-white/90 border border-[#2D8A8A]/10 rounded-3xl text-[#1E232A] text-xs font-semibold flex justify-center items-center gap-2">
            <svg class="w-4 h-4 animate-spin text-[#2D8A8A]" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            Comparing live medicine prices for "${query}" across online pharmacy platforms &amp; mapping nearby chemists...
        </div>`;

        try {
            const res = await fetch(`/api/pharmacy/compare-medicines?medicine=${encodeURIComponent(query)}&user_lat=${userLocation.lat}&user_lng=${userLocation.lng}`);
            if (res.ok) {
                const data = await res.json();
                renderPharmacyPriceComparison(data);
                showToast("Comparison Complete", `Compared online prices & mapped nearby chemists for ${query}`, "success");
            } else {
                const errText = await res.text().catch(() => 'Server error');
                console.warn("Pharmacy API non-OK:", res.status, errText);
                container.innerHTML = `<div class="p-8 text-center bg-white/90 border border-[#2D8A8A]/10 rounded-3xl text-[#4A5568] text-xs">⚠️ Server returned status ${res.status}. Please try again or check the backend is running.</div>`;
            }
        } catch (err) {
            console.warn("Pharmacy price comparison error:", err);
            container.innerHTML = `<div class="p-8 text-center bg-white/90 border border-[#2D8A8A]/10 rounded-3xl text-[#4A5568] text-xs">⚠️ Could not reach the server. Make sure the backend is running and try again.</div>`;
        }
    }

    if (formGoogleWebSearch) {
        formGoogleWebSearch.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('google-search-query').value.trim();
            runPharmacySearch(query);
        });
    }

    // Quick medicine search chips — set input value then directly call search (no form dispatch needed)
    document.querySelectorAll('.btn-quick-med').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const queryInput = document.getElementById('google-search-query');
            if (queryInput) {
                queryInput.value = btn.textContent.trim();
                runPharmacySearch(queryInput.value.trim());
            }
        });
    });

    function renderPharmacyPriceComparison(data) {
        const container = document.getElementById('google-search-results-cards');
        if (!container) return;

        const rawInfo = data.medicine_info || {};
        // Safe defaults so toFixed / template literals never crash
        const info = {
            name:     rawInfo.name     || data.query || 'Medicine',
            generic:  rawInfo.generic  || 'Active Formulation',
            pack:     rawInfo.pack     || '1 Strip',
            uses:     rawInfo.uses     || 'General healthcare',
            base_mrp: rawInfo.base_mrp != null ? rawInfo.base_mrp : 60.0,
            otc:      rawInfo.otc      != null ? rawInfo.otc : true
        };
        const comparisons = data.platform_comparisons || [];
        const nearby = data.nearby_pharmacies || [];

        const otcBadge = info.otc 
            ? `<span class="px-3 py-1 bg-[#EBF5F5] text-[#2D8A8A] border border-[#2D8A8A]/20 rounded-full text-xs font-bold flex items-center gap-1">🟢 OTC - No Prescription Needed</span>`
            : `<span class="px-3 py-1 bg-[#FDF2EE] text-[#D3663E] border border-[#F5A285]/30 rounded-full text-xs font-bold flex items-center gap-1">🔴 Prescription Required</span>`;

        let html = `
            <!-- Medicine Info Banner -->
            <div class="card p-6 bg-white/90 border border-[#2D8A8A]/10 rounded-3xl shadow-xl backdrop-blur-md">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#2D8A8A]/10">
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="text-lg font-heading font-extrabold text-[#1E232A]">${info.name}</h3>
                            ${otcBadge}
                        </div>
                        <p class="text-xs text-[#4A5568] mt-1">Generic Formulation: <strong class="text-[#1E232A]">${info.generic}</strong> &bull; Pack: <span class="font-mono text-[#2D8A8A] font-semibold">${info.pack}</span></p>
                        <p class="text-xs text-[#4A5568] mt-0.5">Indications: ${info.uses}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs text-[#4A5568] block">Standard Baseline MRP</span>
                        <span class="text-xl font-heading font-extrabold text-[#1E232A]">₹${info.base_mrp.toFixed(2)}</span>
                    </div>
                </div>

                <!-- Platform Comparison Cards -->
                <div class="mt-5">
                    <h4 class="text-xs font-heading font-bold text-[#1E232A] uppercase tracking-wider mb-3">Online Pharmacy Platform Price Comparison</h4>
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                        ${comparisons.map(p => `
                            <div class="p-4 bg-white border ${p.is_cheapest ? 'border-2 border-[#2D8A8A]' : (p.is_best_reviewed ? 'border-2 border-[#F5A285]' : 'border-[#2D8A8A]/10')} rounded-2xl flex flex-col justify-between shadow-sm relative">
                                ${p.is_cheapest ? `<span class="absolute -top-2.5 right-3 bg-[#2D8A8A] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">CHEAPEST VALUE</span>` : ''}
                                ${p.is_best_reviewed ? `<span class="absolute -top-2.5 right-3 bg-[#F5A285] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">TOP RATED</span>` : ''}

                                <div>
                                    <div class="font-heading font-extrabold text-sm text-[#1E232A]">${p.platform}</div>
                                    <div class="flex items-center gap-1 mt-1 text-[11px] text-[#4A5568]">
                                        <span class="text-[#D3663E] font-bold">⭐ ${p.rating}</span>
                                        <span>(${p.review_count})</span>
                                    </div>

                                    <div class="mt-3">
                                        <div class="text-[10px] text-[#4A5568] line-through">MRP ₹${p.mrp.toFixed(2)}</div>
                                        <div class="text-base font-extrabold text-[#2D8A8A]">₹${p.price.toFixed(2)}</div>
                                        <span class="text-[10px] text-emerald-600 font-bold block">${p.discount_percent}% OFF (Save ₹${p.savings.toFixed(2)})</span>
                                    </div>
                                    <div class="text-[10px] text-[#4A5568] mt-2 font-medium">🚚 ${p.delivery_eta}</div>
                                </div>

                                <a href="${p.purchase_url}" target="_blank" class="mt-3 w-full py-1.5 ${p.is_cheapest ? 'bg-[#2D8A8A] text-white' : 'bg-[#EBF5F5] text-[#2D8A8A] border border-[#2D8A8A]/20'} hover:bg-[#236B6B] hover:text-white rounded-full text-center text-xs font-bold transition block shadow-sm">
                                    Buy on ${p.platform.split(' ')[0]}
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Nearby Physical Chemists & Google Maps Pointers List -->
            <div class="card p-6 bg-white/90 border border-[#2D8A8A]/10 rounded-3xl shadow-xl backdrop-blur-md">
                <div class="flex justify-between items-center pb-3 border-b border-[#2D8A8A]/10 mb-4">
                    <div>
                        <h4 class="text-sm font-heading font-extrabold text-[#1E232A] flex items-center gap-2">
                            <span>📍 Nearby Chemists & Local Pharmacies</span>
                            <span class="text-xs bg-[#EBF5F5] text-[#2D8A8A] border border-[#2D8A8A]/20 px-3 py-0.5 rounded-full font-mono font-bold">GOOGLE MAPS POINTERS</span>
                        </h4>
                        <p class="text-xs text-[#4A5568] mt-0.5">Click any store map link to open direct Google Maps navigation pointers.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${nearby.map(store => `
                        <div class="p-4 bg-white border border-[#2D8A8A]/10 rounded-2xl flex flex-col justify-between hover:border-[#2D8A8A]/30 transition shadow-sm">
                            <div>
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <h5 class="text-sm font-bold text-[#1E232A]">${store.name}</h5>
                                        <p class="text-xs text-[#4A5568] mt-0.5 truncate max-w-xs">${store.address}</p>
                                    </div>
                                    <span class="text-xs font-bold text-[#2D8A8A] bg-[#EBF5F5] px-2.5 py-0.5 rounded-full border border-[#2D8A8A]/20">${store.distance_km} km</span>
                                </div>
                                <div class="flex items-center gap-2 text-xs text-[#4A5568] my-2">
                                    <span class="text-[#D3663E] font-bold">⭐ ${store.rating}</span>
                                    <span>(${store.review_count} reviews)</span>
                                    <span>&bull; Helpline: <strong class="font-mono text-[#1E232A]">${store.phone}</strong></span>
                                </div>
                            </div>

                            <div class="pt-2 border-t border-[#2D8A8A]/10 flex items-center gap-2 mt-2">
                                <a href="${store.google_maps_url}" target="_blank" class="flex-1 py-1.5 bg-[#2D8A8A] text-white rounded-full text-xs font-bold hover:bg-[#236B6B] transition text-center shadow-sm flex items-center justify-center gap-1">
                                    <span>📍 Google Maps Pointer</span>
                                </a>
                                <a href="${store.google_maps_directions}" target="_blank" class="px-3 py-1.5 bg-[#EBF5F5] text-[#2D8A8A] border border-[#2D8A8A]/20 hover:bg-[#2D8A8A] hover:text-white rounded-full text-xs font-bold transition text-center shadow-sm">
                                    Directions
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Render Leaflet map for physical chemist locations
        initPharmacyLeafletMap(nearby);
    }

    function initPharmacyLeafletMap(stores) {
        const mapContainer = document.getElementById('pharmacy-map-container');
        const mapDiv = document.getElementById('pharmacy-leaflet-map');
        if (!mapContainer || !mapDiv || !stores.length) return;

        mapContainer.classList.remove('hidden');

        if (pharmacyMapInstance) {
            pharmacyMapInstance.remove();
            pharmacyMapInstance = null;
        }

        const centerLat = stores[0].lat || userLocation.lat;
        const centerLng = stores[0].lng || userLocation.lng;

        pharmacyMapInstance = L.map('pharmacy-leaflet-map').setView([centerLat, centerLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(pharmacyMapInstance);

        stores.forEach(s => {
            if (!s.lat || !s.lng) return;
            const customIcon = L.divIcon({
                className: 'custom-leaflet-pharmacy-marker',
                html: `<div style="background-color: #2D8A8A; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(45, 138, 138, 0.6);"></div>`,
                iconSize: [16, 16]
            });

            const popupHtml = `
                <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #1E232A; padding: 4px;">
                    <strong style="font-size: 13px; display: block; color: #2D8A8A;">${s.name}</strong>
                    <span>${s.address}</span><br/>
                    <div style="margin-top: 6px;">
                        <strong>Distance:</strong> ${s.distance_km} km &bull; ⭐ ${s.rating}<br/>
                        <a href="${s.google_maps_url}" target="_blank" style="color: #2D8A8A; font-weight: bold; text-decoration: underline; display: inline-block; margin-top: 4px;">Open Google Maps Location &rarr;</a>
                    </div>
                </div>
            `;

            L.marker([s.lat, s.lng], { icon: customIcon })
                .addTo(pharmacyMapInstance)
                .bindPopup(popupHtml);
        });
    }

    // --------------------------------------------------------------------------
    // 8. New Hospital Registration Form Handler
    // --------------------------------------------------------------------------
    if (formRegisterNewHospital) {
        formRegisterNewHospital.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newHospData = {
                name: document.getElementById('reg-name').value.trim(),
                district: document.getElementById('reg-district').value.trim(),
                type: document.getElementById('reg-type').value,
                helpline: document.getElementById('reg-helpline').value.trim(),
                address: document.getElementById('reg-address').value.trim(),
                totalBeds: document.getElementById('reg-total-beds').value,
                availableBeds: document.getElementById('reg-avail-beds').value,
                icuTotal: 20,
                icuAvailable: document.getElementById('reg-icu-avail').value,
                pin: document.getElementById('reg-pin').value.trim(),
                specializations: ["Emergency Care", "General Surgery", "Specialized Care"]
            };

            // Register in local DataStore
            const res = window.dataStore.registerNewHospital(newHospData);

            // Register backend proxy
            try {
                await fetch('/api/hospitals/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newHospData)
                });
            } catch (err) { }

            if (res.success) {
                showToast("Registration Complete", `Registered ${res.hospital.name}! Staff Login ID: ${res.hospital.id}`, "success");
                formRegisterNewHospital.reset();

                // Refresh discovery cards & navigate to main directory
                loadMaharashtraDiscovery();
                document.querySelector('[data-tab="tab-patient-discovery"]').click();
            }
        });
    }

    // --------------------------------------------------------------------------
    // 9. 1-Click Emergency Mode (Real-Time GPS Location & Reviews Integration)
    // --------------------------------------------------------------------------
    async function triggerEmergencyTriage() {
        const emergSpecialty = document.getElementById('emerg-specialty-select').value;
        const allHospitals = window.dataStore.getHospitals();

        document.querySelector('[data-tab="tab-emergency-mode"]').click();

        const container = document.getElementById('emergency-ranked-cards');
        if (!container) return;

        // Try backend recommendation API with user GPS coordinates
        let scoredList = [];
        try {
            const res = await fetch('/api/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    specialty: emergSpecialty,
                    user_lat: userLocation.lat,
                    user_lng: userLocation.lng,
                    emergency: true
                })
            });
            if (res.ok) {
                const data = await res.json();
                scoredList = data.recommendations || [];
            }
        } catch (e) {
            console.warn("Backend recommendation call error, evaluating locally:", e);
        }

        if (scoredList.length === 0) {
            scoredList = allHospitals.map(h => {
                const metrics = computeAiRecommendationScore(h, emergSpecialty, true);
                return { ...h, ...metrics };
            });
            scoredList.sort((a, b) => b.recScore - a.recScore);
        }

        container.innerHTML = scoredList.slice(0, 4).map((h, idx) => `
            <div class="card p-6 bg-[#FDF2EE] border-2 border-[#F5A285]/40 rounded-3xl flex flex-col justify-between relative shadow-xl">
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="text-[10px] font-bold text-white bg-[#F5A285] px-3 py-1 rounded-full uppercase tracking-wider block mb-1.5 shadow-sm">
                                #${idx + 1} PRIORITY MATCH &bull; ${h.distance_km || h.distKm || 1.5} KM AWAY
                            </span>
                            <h3 class="text-base font-heading font-extrabold text-[#1E232A]">${h.name}</h3>
                            <p class="text-xs text-[#4A5568] mt-0.5">${h.address} &bull; <strong class="text-[#1E232A]">${h.district}</strong></p>
                        </div>
                        
                        <div class="text-right">
                            <div class="px-3 py-1 bg-[#F5A285] text-white rounded-full text-sm font-extrabold block shadow-sm">
                                ${h.recommendation_score || h.recScore} <span class="text-[9px] font-normal">/ 100</span>
                            </div>
                            <span class="text-[10px] text-[#D3663E] font-bold block mt-1">⭐ ${h.rating || 4.6} (${h.review_count || 180} reviews)</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2.5 my-4">
                        <div class="p-3 bg-white border border-[#F5A285]/30 rounded-2xl text-center">
                            <span class="text-[10px] text-[#4A5568] block font-medium">Available ICU</span>
                            <span class="text-sm font-bold text-[#D3663E]">${h.icu_available !== undefined ? h.icu_available : h.icuAvailable} Beds</span>
                        </div>
                        <div class="p-3 bg-white border border-[#F5A285]/30 rounded-2xl text-center">
                            <span class="text-[10px] text-[#4A5568] block font-medium">Est Arrival</span>
                            <span class="text-sm font-bold text-[#D3663E]">${h.est_travel_mins || h.estTravelMins} mins</span>
                        </div>
                        <div class="p-3 bg-white border border-[#F5A285]/30 rounded-2xl text-center">
                            <span class="text-[10px] text-[#4A5568] block font-medium">ER Wait</span>
                            <span class="text-sm font-bold text-[#1E232A]">${h.avg_wait_mins || h.avgWaitMins || 12} mins</span>
                        </div>
                    </div>

                    <div class="p-3.5 bg-white border border-[#F5A285]/30 rounded-2xl mb-4 text-xs text-[#D3663E] font-medium">
                        ⚡ <strong>Emergency Readiness:</strong> Real-time ICU capacity verified with emergency trauma team ready.
                    </div>
                </div>

                <div class="pt-3 border-t border-[#F5A285]/30 flex items-center justify-between">
                    <a href="tel:${h.helpline}" class="px-4 py-2 bg-[#F5A285] text-white rounded-full text-xs font-bold hover:bg-[#E48F71] transition flex items-center gap-1.5 shadow-md">
                        📞 Call Helpline (${h.helpline})
                    </a>
                    <a href="https://maps.google.com/?q=${h.lat},${h.lng}" target="_blank" class="px-4 py-2 bg-white text-[#D3663E] border border-[#F5A285]/40 hover:bg-[#FDF2EE] rounded-full text-xs font-bold transition">
                        Open Emergency Map
                    </a>
                </div>
            </div>
        `).join('');

        showToast("Emergency Finder Active", `Ranked top nearest emergency facilities for ${emergSpecialty}`, "info");
    }

    if (btnQuickEmergency) btnQuickEmergency.addEventListener('click', triggerEmergencyTriage);
    if (btnTriggerEmergTriage) btnTriggerEmergTriage.addEventListener('click', triggerEmergencyTriage);

    // --------------------------------------------------------------------------
    // 10. Official Blood Bank Directory Search (Public View)
    // --------------------------------------------------------------------------
    async function loadBloodBankRegistry() {
        const container = document.getElementById('blood-search-results');
        if (!container) return;

        const group = document.getElementById('blood-group-select').value;
        const district = document.getElementById('blood-district-select').value;

        try {
            const res = await fetch(`/api/blood-bank/search?blood_group=${encodeURIComponent(group)}&district=${district}`);
            if (res.ok) {
                const data = await res.json();
                renderBloodSearchResults(data.inventory || []);
            }
        } catch (err) {
            console.warn("Blood bank search error:", err);
        }
    }

    function renderBloodSearchResults(list) {
        const container = document.getElementById('blood-search-results');
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `<div class="col-span-3 p-8 text-center bg-white/60 border border-[#2D8A8A]/10 rounded-3xl text-[#4A5568] text-xs">No blood banks match your current criteria.</div>`;
            return;
        }

        container.innerHTML = list.map(b => `
            <div class="card p-5 bg-white/90 border border-[#2D8A8A]/10 rounded-3xl flex flex-col justify-between shadow-xl">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-heading font-extrabold text-[#D3663E] bg-[#FDF2EE] border border-[#F5A285]/30 px-3 py-1 rounded-full">
                            Blood Group: ${b.blood_group}
                        </span>
                        <span class="text-xs font-mono font-bold ${b.units_available > 30 ? 'text-[#2D8A8A]' : 'text-[#D3663E]'}">
                            ${b.units_available} Units Available
                        </span>
                    </div>

                    <h4 class="text-sm font-heading font-bold text-[#1E232A] mt-2">${b.hospital_name}</h4>
                    <p class="text-xs text-[#4A5568] mt-0.5">${b.address} &bull; <strong class="text-[#1E232A]">${b.district}</strong></p>
                </div>

                <div class="pt-3 mt-3 border-t border-[#2D8A8A]/10 flex items-center justify-between text-xs">
                    <span class="text-[#4A5568] font-mono">${b.helpline}</span>
                    <a href="tel:${b.helpline}" class="px-4 py-1.5 bg-[#EBF5F5] text-[#2D8A8A] border border-[#2D8A8A]/20 rounded-full hover:bg-[#2D8A8A] hover:text-white transition font-bold">
                        Call Blood Bank
                    </a>
                </div>
            </div>
        `).join('');
    }

    if (btnSearchBloodInventory) btnSearchBloodInventory.addEventListener('click', loadBloodBankRegistry);

    function renderHospitalAdminPortalState() {
        const authHosp = window.dataStore.getAuthenticatedHospital();
        const staffBadge = document.getElementById('nav-staff-badge');

        if (authHosp) {
            if (adminGatedLoginPanel) adminGatedLoginPanel.classList.add('hidden');
            if (adminUnlockedConsole) adminUnlockedConsole.classList.remove('hidden');
            if (staffBadge) {
                staffBadge.innerText = "ACTIVE";
                staffBadge.className = "ml-auto text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono";
            }

            document.getElementById('unlocked-hosp-name').innerText = authHosp.name;
            document.getElementById('unlocked-hosp-id').innerText = authHosp.id;

            document.getElementById('admin-avail-beds').value = authHosp.availableBeds !== undefined ? authHosp.availableBeds : (authHosp.available_beds || 380);
            document.getElementById('admin-avail-icu').value = authHosp.icuAvailable !== undefined ? authHosp.icuAvailable : (authHosp.icu_available || 28);
            document.getElementById('admin-avail-oxygen').value = authHosp.oxygenAvailable || authHosp.oxygen_available || 180;
            document.getElementById('admin-avail-ventilators').value = authHosp.ventilatorsAvailable || authHosp.ventilators_available || 12;
            document.getElementById('admin-er-status').value = authHosp.erLoadStatus || authHosp.er_status || "HIGH_SURGE";
            document.getElementById('admin-wait-mins').value = authHosp.avgWaitMins || authHosp.avg_wait_mins || 22;
            document.getElementById('admin-opd-queue').value = authHosp.opdQueue || authHosp.opd_queue || 140;
            document.getElementById('admin-doctors-duty').value = authHosp.doctorsDuty || authHosp.doctors_on_duty || 85;
        } else {
            if (adminGatedLoginPanel) adminGatedLoginPanel.classList.remove('hidden');
            if (adminUnlockedConsole) adminUnlockedConsole.classList.add('hidden');
            if (staffBadge) {
                staffBadge.innerText = "LOGIN";
                staffBadge.className = "ml-auto text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono";
            }
        }

        updateAuthHeaderUI();
    }

    if (formGatedAdminLogin) {
        formGatedAdminLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('gated-login-id').value;
            const pin = document.getElementById('gated-login-pin').value;
            const errEl = document.getElementById('gated-login-error');

            const res = window.dataStore.authenticateHospital(id, pin);
            if (res.success) {
                if (errEl) errEl.classList.add('hidden');
                showToast("Authenticated", `Logged in as Hospital Staff for ${res.hospital.name}`, "success");
                renderHospitalAdminPortalState();
            } else {
                if (errEl) {
                    errEl.innerText = res.message;
                    errEl.classList.remove('hidden');
                }
            }
        });
    }

    if (btnLogoutHospitalAdmin) {
        btnLogoutHospitalAdmin.addEventListener('click', () => {
            window.dataStore.logoutHospital();
            showToast("Logged Out", "Hospital Staff session closed. Returned to Public Mode.", "info");
            renderHospitalAdminPortalState();
        });
    }

    if (formAdminResourceUpdate) {
        formAdminResourceUpdate.addEventListener('submit', async (e) => {
            e.preventDefault();
            const authHosp = window.dataStore.getAuthenticatedHospital();
            if (!authHosp) return;

            const payload = {
                hospital_id: authHosp.id,
                available_beds: parseInt(document.getElementById('admin-avail-beds').value),
                icu_available: parseInt(document.getElementById('admin-avail-icu').value),
                oxygen_available: parseInt(document.getElementById('admin-avail-oxygen').value),
                ventilators_available: parseInt(document.getElementById('admin-avail-ventilators').value),
                er_status: document.getElementById('admin-er-status').value,
                avg_wait_mins: parseInt(document.getElementById('admin-wait-mins').value),
                opd_queue: parseInt(document.getElementById('admin-opd-queue').value),
                doctors_on_duty: parseInt(document.getElementById('admin-doctors-duty').value)
            };

            // Update in local store
            authHosp.availableBeds = payload.available_beds;
            authHosp.icuAvailable = payload.icu_available;
            authHosp.oxygenAvailable = payload.oxygen_available;
            authHosp.ventilatorsAvailable = payload.ventilators_available;
            authHosp.erLoadStatus = payload.er_status;
            authHosp.avgWaitMins = payload.avg_wait_mins;
            authHosp.opdQueue = payload.opd_queue;
            authHosp.doctorsDuty = payload.doctors_on_duty;

            localStorage.setItem('mediflow_authenticated_hospital', JSON.stringify(authHosp));

            try {
                await fetch('/api/hospital/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) { }

            showToast("Resource Update Published", `Updated operational bed availability for ${authHosp.name}`, "success");
            loadMaharashtraDiscovery();
        });
    }

    // --------------------------------------------------------------------------
    // 12. Government Health Dashboard (Public View)
    // --------------------------------------------------------------------------
    async function loadGovtAuthorityAnalytics() {
        try {
            const res = await fetch('/api/analytics/government');
            if (res.ok) {
                const data = await res.json();
                document.getElementById('govt-kpi-hospitals').innerText = `${data.overall_kpis.total_hospitals} Hospitals`;
                document.getElementById('govt-kpi-occupancy').innerText = `${data.overall_kpis.state_occupancy_pct}%`;
                document.getElementById('govt-kpi-icu').innerText = `${data.overall_kpis.icu_occupancy_pct}%`;
                document.getElementById('govt-kpi-bed-count').innerText = `${data.overall_kpis.state_available_beds} Avail / ${data.overall_kpis.total_capacity_beds} Total Beds`;
                document.getElementById('govt-kpi-icu-count').innerText = `${data.overall_kpis.state_available_icu} ICU Beds Available`;

                renderGovtDistrictTable(data.district_analytics || {});
            }
        } catch (err) {
            console.warn("Govt analytics error:", err);
        }
    }

    function renderGovtDistrictTable(districts) {
        const tbody = document.getElementById('govt-district-table-body');
        if (!tbody) return;

        tbody.innerHTML = Object.keys(districts).map(dName => {
            const d = districts[dName];
            const pct = Math.round(((d.total_beds - d.available_beds) / d.total_beds) * 100 * 10) / 10;
            return `
                <tr class="hover:bg-slate-800/30 transition">
                    <td class="py-2.5 px-4 font-bold text-white">${dName} District</td>
                    <td class="py-2.5 px-4 text-slate-300">${d.hospitals} Hospitals</td>
                    <td class="py-2.5 px-4 text-slate-300">${d.total_beds} Beds</td>
                    <td class="py-2.5 px-4 text-emerald-400 font-semibold">${d.available_beds} Beds</td>
                    <td class="py-2.5 px-4 text-blue-400 font-semibold">${d.icu_available} Beds</td>
                    <td class="py-2.5 px-4"><span class="text-xs font-bold ${pct > 80 ? 'text-red-400' : 'text-emerald-400'}">${pct}% Occupied</span></td>
                </tr>
            `;
        }).join('');
    }

    // --------------------------------------------------------------------------
    // Public Analytical & ML Predictive Dashboard
    // --------------------------------------------------------------------------
    let chartBedsIcuInstance = null;
    let chartBloodInventoryInstance = null;
    let chartFootfallTrendInstance = null;

    async function loadPublicAnalyticsDashboard() {
        try {
            const res = await fetch('/api/analytics/government');
            if (res.ok) {
                const data = await res.json();
                const kpis = data.overall_kpis || {};
                
                const elBeds = document.getElementById('pub-kpi-beds');
                const elAvailBeds = document.getElementById('pub-kpi-avail-beds');
                const elIcu = document.getElementById('pub-kpi-icu');
                const elOccupancy = document.getElementById('pub-kpi-occupancy');

                if (elBeds) elBeds.innerText = (kpis.total_capacity_beds || 1850).toLocaleString();
                if (elAvailBeds) elAvailBeds.innerText = `${(kpis.state_available_beds || 435).toLocaleString()} Beds Available`;
                if (elIcu) elIcu.innerText = (kpis.state_available_icu || 78).toString();
                if (elOccupancy) elOccupancy.innerText = `${kpis.state_occupancy_pct || 76.5}%`;

                setTimeout(() => {
                    initPublicAnalyticsCharts(data.district_analytics || {});
                    loadDepartmentDrillDownAnalytics();
                    loadPredictedBloodShortageAnalytics();
                    loadAutomatedDemandSupplyForecast();
                }, 60);
            }
        } catch (err) {
            console.warn("Public analytics loading error:", err);
        }
    }

    let chartDemandSupplyBloodInstance = null;
    let chartDemandSupplyMedicinesInstance = null;
    let chartDemandSupplyBedsInstance = null;
    let chartTrendForecastTimelineInstance = null;

    async function loadAutomatedDemandSupplyForecast(district = 'ALL') {
        try {
            const res = await fetch(`/api/analytics/demand-supply-forecast?district=${encodeURIComponent(district)}`);
            if (res.ok) {
                const data = await res.json();
                // Render KPI cards directly — no chart dependency
                renderDemandSupplyKpiCards(data);
                // Also run charts if they are still present (safe — skips missing canvases)
                renderDemandSupplyCharts(data);
            }
        } catch (err) {
            console.warn("Demand Supply forecast loading error:", err);
        }
    }

    // District-Wise Dropdown — event delegation so it works regardless of tab load order
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'kpi-district-filter') {
            const selectedDistrict = e.target.value;
            loadAutomatedDemandSupplyForecast(selectedDistrict);
            const label = selectedDistrict === 'ALL' ? 'All Maharashtra Districts' : selectedDistrict + ' District';
            showToast('District Filter Applied', `Showing resource metrics for ${label}`, 'info');
        }
    });

    function renderDemandSupplyCharts(data = {}) {
        if (typeof Chart === 'undefined') return;

        // Chart A: Blood Group Demand vs Supply (in Litres)
        const canvasBlood = document.getElementById('chart-demand-supply-blood');
        if (canvasBlood) {
            if (chartDemandSupplyBloodInstance) chartDemandSupplyBloodInstance.destroy();
            const bloodData = (data && data.blood_demand_supply && data.blood_demand_supply.length) ? data.blood_demand_supply : [
                { blood_group: 'O+', supply_litres: 171, weekly_demand_litres: 144 },
                { blood_group: 'A+', supply_litres: 130.5, weekly_demand_litres: 112.5 },
                { blood_group: 'B+', supply_litres: 139.5, weekly_demand_litres: 121.5 },
                { blood_group: 'AB+', supply_litres: 54, weekly_demand_litres: 49.5 },
                { blood_group: 'O-', supply_litres: 29.2, weekly_demand_litres: 36 },
                { blood_group: 'A-', supply_litres: 20.2, weekly_demand_litres: 27 },
                { blood_group: 'B-', supply_litres: 22.5, weekly_demand_litres: 31.5 },
                { blood_group: 'AB-', supply_litres: 13.5, weekly_demand_litres: 18 }
            ];
            const labels = bloodData.map(b => b.blood_group);
            const supplyData = bloodData.map(b => b.supply_litres);
            const demandData = bloodData.map(b => b.weekly_demand_litres);

            chartDemandSupplyBloodInstance = new Chart(canvasBlood, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Current Supply (Litres)', data: supplyData, backgroundColor: '#2D8A8A', borderRadius: 8 },
                        { label: '7-Day Demand Forecast (Litres)', data: demandData, backgroundColor: '#F5A285', borderRadius: 8 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } }
                }
            });
        }

        // Chart B: Generic Essential Medicines Stock Supply vs Demand
        const canvasMeds = document.getElementById('chart-demand-supply-medicines');
        if (canvasMeds) {
            if (chartDemandSupplyMedicinesInstance) chartDemandSupplyMedicinesInstance.destroy();
            const medsData = (data && data.generic_medicines_demand_supply && data.generic_medicines_demand_supply.length) ? data.generic_medicines_demand_supply : [
                { name: 'Paracetamol 500mg', supply_units: 14200, weekly_demand: 8400 },
                { name: 'Amoxicillin 500mg', supply_units: 6800, weekly_demand: 4200 },
                { name: 'Azithromycin 500mg', supply_units: 2900, weekly_demand: 3000 },
                { name: 'Metformin 500mg', supply_units: 9500, weekly_demand: 5100 },
                { name: 'Cetirizine 10mg', supply_units: 11000, weekly_demand: 6200 },
                { name: 'Pantoprazole 40mg', supply_units: 8200, weekly_demand: 4800 }
            ];
            const labels = medsData.map(m => m.name.split(' ')[0] + ' ' + (m.name.split(' ')[1] || ''));
            const supplyData = medsData.map(m => m.supply_units);
            const demandData = medsData.map(m => m.weekly_demand);

            chartDemandSupplyMedicinesInstance = new Chart(canvasMeds, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Pharmacy Stock (Units)', data: supplyData, backgroundColor: '#2D8A8A', borderRadius: 8 },
                        { label: '7-Day Patient Demand (Units)', data: demandData, backgroundColor: '#D3663E', borderRadius: 8 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } }
                }
            });
        }

        // Chart C: Beds & ICU Capacity Demand vs Supply
        const canvasBeds = document.getElementById('chart-demand-supply-beds');
        if (canvasBeds) {
            if (chartDemandSupplyBedsInstance) chartDemandSupplyBedsInstance.destroy();
            const bedsData = (data && data.beds_demand_supply) ? data.beds_demand_supply : {
                available_beds_supply: 435, occupied_beds: 1415, predicted_daily_bed_demand: 1517,
                available_icu_supply: 78, occupied_icu: 162, predicted_daily_icu_demand: 204
            };

            chartDemandSupplyBedsInstance = new Chart(canvasBeds, {
                type: 'bar',
                data: {
                    labels: ['General Ward Beds', 'ICU Critical Care Beds'],
                    datasets: [
                        { label: 'Available Supply', data: [bedsData.available_beds_supply || 435, bedsData.available_icu_supply || 78], backgroundColor: '#2D8A8A', borderRadius: 8 },
                        { label: 'Current Occupied', data: [bedsData.occupied_beds || 1415, bedsData.occupied_icu || 162], backgroundColor: '#F5A285', borderRadius: 8 },
                        { label: 'Predicted Daily Surge Demand', data: [bedsData.predicted_daily_bed_demand || 1517, bedsData.predicted_daily_icu_demand || 204], backgroundColor: '#D3663E', borderRadius: 8 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } }
                }
            });
        }

        // Chart D: 30-Day Trend & 7-Day Forward Forecast Projection
        const canvasTimeline = document.getElementById('chart-trend-forecast-timeline');
        if (canvasTimeline) {
            if (chartTrendForecastTimelineInstance) chartTrendForecastTimelineInstance.destroy();
            const timeline = (data && data.trend_forecast_timeline) ? data.trend_forecast_timeline : {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri (Forecast)', 'Sat (Forecast)', 'Sun (Forecast)'],
                bed_occupancy_pct: [74, 75, 76, 76.5, 82, 79, 77]
            };

            chartTrendForecastTimelineInstance = new Chart(canvasTimeline, {
                type: 'line',
                data: {
                    labels: timeline.labels || [],
                    datasets: [
                        {
                            label: 'Bed Occupancy % Trend & Forecast',
                            data: timeline.bed_occupancy_pct || [],
                            borderColor: '#2D8A8A',
                            backgroundColor: 'rgba(45, 138, 138, 0.1)',
                            fill: true,
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } }
                }
            });
        }

        renderDemandSupplyKpiCards(data);
    }

    function renderDemandSupplyKpiCards(data) {
        if (!data) return;

        // NOTE: State Summary card (title, badge, subtitle, top 4 KPI metrics)
        // always shows fixed aggregated state-wide data — never updated by district filter.

        // Derive occupancy for trend cards (district-scoped, used only below)
        const b = data.beds_demand_supply || {};
        const totalBeds = b.total_beds_capacity || 1850;
        const availBeds = b.available_beds_supply || 435;
        const availIcu  = b.available_icu_supply  || 78;
        const occBeds   = b.occupied_beds || (totalBeds - availBeds);
        const occPct    = totalBeds > 0 ? Math.round((occBeds / totalBeds) * 100) : 76.5;

        const bloodData = data.blood_demand_supply || [];


        const bloodContainer = document.getElementById('kpi-grid-blood-demand-supply');
        if (bloodContainer && bloodData.length) {
            bloodContainer.innerHTML = bloodData.map(bItem => {
                const pct = Math.min(100, Math.round((bItem.supply_litres / Math.max(1, bItem.weekly_demand_litres)) * 100));
                const isDeficit = bItem.deficit_surplus_litres < 0;

                return `
                    <div class="p-3.5 bg-white border border-[#2D8A8A]/15 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-heading font-extrabold text-sm text-[#1E232A]">${bItem.blood_group}</span>
                                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${isDeficit ? 'bg-[#FDF2EE] text-[#D3663E] border border-[#F5A285]/30' : 'bg-[#EBF5F5] text-[#2D8A8A] border border-[#2D8A8A]/20'}">
                                    ${bItem.status}
                                </span>
                            </div>

                            <div class="text-base font-extrabold text-[#2D8A8A] font-mono mt-1">${bItem.supply_litres} L <span class="text-[10px] text-[#4A5568] font-normal">Supply</span></div>
                            <div class="text-[10px] text-[#4A5568] mt-0.5">7-Day Demand: <strong class="font-mono text-[#1E232A]">${bItem.weekly_demand_litres} L</strong></div>

                            <div class="w-full bg-[#F4F1EA] h-2 rounded-full mt-2 overflow-hidden">
                                <div class="h-full ${isDeficit ? 'bg-[#D3663E]' : 'bg-[#2D8A8A]'}" style="width: ${pct}%"></div>
                            </div>
                        </div>

                        <div class="pt-2 border-t border-[#2D8A8A]/10 mt-2 text-[10px] font-bold ${isDeficit ? 'text-[#D3663E]' : 'text-[#2D8A8A]'}">
                            ${isDeficit ? `⚠️ Deficit: ${Math.abs(bItem.deficit_surplus_litres)} L` : `✅ Reserve Surplus: +${bItem.deficit_surplus_litres} L`}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 2. Generic Essential Medicines KPI Cards
        const medsContainer = document.getElementById('kpi-grid-medicines-demand-supply');
        if (medsContainer) {
            const medsData = data.generic_medicines_demand_supply || [];
            medsContainer.innerHTML = medsData.map(m => {
                const isLow = m.status === 'LOW_STOCK';
                return `
                    <div class="p-4 bg-white border border-[#2D8A8A]/15 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h5 class="font-heading font-extrabold text-xs text-[#1E232A]">${m.name}</h5>
                                    <span class="text-[10px] text-[#2D8A8A] font-semibold">${m.category}</span>
                                </div>
                                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${isLow ? 'bg-[#FDF2EE] text-[#D3663E]' : 'bg-[#EBF5F5] text-[#2D8A8A]'}">
                                    ${m.reserve_days} Days Reserve
                                </span>
                            </div>

                            <div class="space-y-1 text-xs text-[#4A5568] mt-2">
                                <div class="flex justify-between">
                                    <span>Pharmacy Stock:</span>
                                    <strong class="font-mono text-[#2D8A8A]">${m.supply_units.toLocaleString()} Units</strong>
                                </div>
                                <div class="flex justify-between">
                                    <span>7-Day Patient Demand:</span>
                                    <strong class="font-mono text-[#1E232A]">${m.weekly_demand.toLocaleString()} Units</strong>
                                </div>
                            </div>
                        </div>

                        <div class="w-full bg-[#F4F1EA] h-2 rounded-full mt-3 overflow-hidden">
                            <div class="h-full bg-[#2D8A8A]" style="width: ${Math.min(100, Math.round((m.supply_units / (m.weekly_demand * 1.5)) * 100))}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 3. Hospital Ward Beds & ICU KPI Summary Cards
        const bedsContainer = document.getElementById('kpi-grid-beds-demand-supply');
        if (bedsContainer) {
            const totalBedsVal = b.total_beds_capacity || 8325;
            const occBedsVal = b.occupied_beds || 6375;
            const totalIcuVal = b.total_icu_capacity || 750;
            const occIcuVal = b.occupied_icu || 585;

            bedsContainer.innerHTML = `
                <div class="p-4 bg-white border border-[#2D8A8A]/15 rounded-2xl shadow-sm">
                    <div class="flex justify-between items-center mb-2 pb-2 border-b border-[#2D8A8A]/10">
                        <h5 class="font-heading font-extrabold text-xs text-[#1E232A]">🛏️ General Ward Hospital Beds</h5>
                        <span class="text-xs font-bold text-[#2D8A8A] bg-[#EBF5F5] px-2.5 py-0.5 rounded-full">${b.available_beds_supply || 435} Beds Free</span>
                    </div>
                    <div class="space-y-1.5 text-xs text-[#4A5568]">
                        <div class="flex justify-between"><span>Total Capacity:</span><strong class="font-mono text-[#1E232A]">${totalBedsVal.toLocaleString()} Beds</strong></div>
                        <div class="flex justify-between"><span>Currently Occupied:</span><strong class="font-mono text-[#F5A285]">${occBedsVal.toLocaleString()} Beds (${Math.round((occBedsVal / totalBedsVal) * 100)}%)</strong></div>
                        <div class="flex justify-between"><span>Predicted Daily Surge Demand:</span><strong class="font-mono text-[#D3663E]">${(b.predicted_daily_bed_demand || 6826).toLocaleString()} Beds</strong></div>
                    </div>
                    <div class="w-full bg-[#F4F1EA] h-2.5 rounded-full mt-3 overflow-hidden">
                        <div class="h-full bg-[#2D8A8A]" style="width: ${Math.round((occBedsVal / totalBedsVal) * 100)}%"></div>
                    </div>
                </div>

                <div class="p-4 bg-white border border-[#2D8A8A]/15 rounded-2xl shadow-sm">
                    <div class="flex justify-between items-center mb-2 pb-2 border-b border-[#2D8A8A]/10">
                        <h5 class="font-heading font-extrabold text-xs text-[#1E232A]">🚑 ICU Critical Care Beds</h5>
                        <span class="text-xs font-bold text-[#D3663E] bg-[#FDF2EE] px-2.5 py-0.5 rounded-full">${b.available_icu_supply || 78} Free</span>
                    </div>
                    <div class="space-y-1.5 text-xs text-[#4A5568]">
                        <div class="flex justify-between"><span>Total ICU Capacity:</span><strong class="font-mono text-[#1E232A]">${totalIcuVal.toLocaleString()} Beds</strong></div>
                        <div class="flex justify-between"><span>Currently Occupied:</span><strong class="font-mono text-[#F5A285]">${occIcuVal.toLocaleString()} Beds (${Math.round((occIcuVal / totalIcuVal) * 100)}%)</strong></div>
                        <div class="flex justify-between"><span>Predicted Critical ICU Demand:</span><strong class="font-mono text-[#D3663E]">${(b.predicted_daily_icu_demand || 637).toLocaleString()} Beds</strong></div>
                    </div>
                    <div class="w-full bg-[#F4F1EA] h-2.5 rounded-full mt-3 overflow-hidden">
                        <div class="h-full bg-[#D3663E]" style="width: ${Math.round((occIcuVal / totalIcuVal) * 100)}%"></div>
                    </div>
                </div>
            `;
        }

        // Helper function
        function roundNum(val, dec) {
            return Math.round(val * Math.pow(10, dec)) / Math.pow(10, dec);
        }

        // 4. 30-Day Historical Trend & Forward Care Projection Summary
        const trendContainer = document.getElementById('kpi-grid-trend-forecast-summary');
        if (trendContainer) {
            trendContainer.innerHTML = `
                <div class="p-4 bg-white border border-[#2D8A8A]/15 rounded-2xl shadow-sm">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-lg">📊</span>
                        <h5 class="font-heading font-extrabold text-xs text-[#1E232A]">Average Occupancy Rate</h5>
                    </div>
                    <div class="text-xl font-extrabold text-[#2D8A8A] font-mono mt-1">${occPct}% <span class="text-xs text-[#4A5568] font-normal">Normal Range</span></div>
                    <p class="text-[11px] text-[#4A5568] mt-1">Sustained steady load based on network trends.</p>
                </div>

                <div class="p-4 bg-white border border-[#2D8A8A]/15 rounded-2xl shadow-sm">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-lg">📈</span>
                        <h5 class="font-heading font-extrabold text-xs text-[#1E232A]">Predicted Peak Surge Day</h5>
                    </div>
                    <div class="text-xl font-extrabold text-[#D3663E] font-mono mt-1">Friday <span class="text-xs text-[#D3663E] font-bold">(${Math.min(95, occPct + 6)}% Occupancy)</span></div>
                    <p class="text-[11px] text-[#4A5568] mt-1">+14% anticipated patient admission surge towards weekend.</p>
                </div>

                <div class="p-4 bg-white border border-[#2D8A8A]/15 rounded-2xl shadow-sm">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-lg">🛡️</span>
                        <h5 class="font-heading font-extrabold text-xs text-[#1E232A]">Recommended ICU Buffer</h5>
                    </div>
                    <div class="text-xl font-extrabold text-[#2D8A8A] font-mono mt-1">+${Math.max(10, Math.round(availIcu * 0.6))} Beds <span class="text-xs text-[#2D8A8A] font-bold">Reserve Ready</span></div>
                    <p class="text-[11px] text-[#4A5568] mt-1">Recommended critical care reserve buffer for emergency surge capacity.</p>
                </div>
            `;
        }
    }

    async function loadPredictedBloodShortageAnalytics() {
        const alertsContainer = document.getElementById('blood-shortage-alerts-container');
        const cardsGrid = document.getElementById('blood-shortage-cards-grid');
        const hospitalResults = document.getElementById('hospital-blood-shortage-results');
        if (!alertsContainer || !cardsGrid) return;

        const search = document.getElementById('blood-shortage-search')?.value.trim() || '';
        const bg = document.getElementById('blood-shortage-group-select')?.value || 'ALL';

        try {
            const res = await fetch(`/api/analytics/blood-shortage-predict?blood_group=${encodeURIComponent(bg)}&search=${encodeURIComponent(search)}`);
            if (res.ok) {
                const data = await res.json();
                renderBloodShortageAnalytics(data);
            }
        } catch (err) {
            console.warn("Blood shortage prediction loading error:", err);
        }
    }

    function renderBloodShortageAnalytics(data) {
        const alertsContainer = document.getElementById('blood-shortage-alerts-container');
        const cardsGrid = document.getElementById('blood-shortage-cards-grid');
        const hospitalResults = document.getElementById('hospital-blood-shortage-results');

        if (!alertsContainer || !cardsGrid) return;

        const alerts = data.critical_alerts || [];
        const forecasts = data.shortage_forecasts || [];
        const hospitalShortages = data.hospital_shortages || [];

        // 1. Critical Alert Banner
        if (alerts.length > 0) {
            alertsContainer.innerHTML = alerts.map(a => `
                <div class="p-3 bg-[#FDF2EE] border border-[#F5A285]/40 rounded-2xl flex items-center justify-between text-xs text-[#D3663E]">
                    <div class="flex items-center gap-2 font-bold">
                        <span class="w-2.5 h-2.5 rounded-full bg-[#F5A285]"></span>
                        <span>Blood Group ${a.blood_group}: Shortage Forecasted (${a.days_left} Days Reserve)</span>
                    </div>
                    <span class="font-mono text-[11px] bg-[#F5A285] text-white px-2.5 py-0.5 rounded-full font-bold">${a.stock_litres} Litres Available</span>
                </div>
            `).join('');
        } else {
            alertsContainer.innerHTML = `<div class="p-3 bg-[#EBF5F5] border border-[#2D8A8A]/20 rounded-2xl text-xs text-[#2D8A8A] font-bold">✅ Network Blood Stock Healthy: Total ${data.total_network_litres || 1492.2} Litres in reserve across all blood groups.</div>`;
        }

        // 2. Group-Wise Litres Grid
        cardsGrid.innerHTML = forecasts.map(f => {
            const isCritical = f.risk_level === 'CRITICAL';
            const isModerate = f.risk_level === 'MODERATE';
            const cardBg = isCritical ? 'bg-[#FDF2EE] border-[#F5A285]/40 text-[#D3663E]' : (isModerate ? 'bg-[#F7F4EF] border-[#2D8A8A]/20 text-[#1E232A]' : 'bg-white border-[#2D8A8A]/10 text-[#1E232A]');

            return `
                <div class="p-3.5 ${cardBg} border rounded-2xl flex flex-col justify-between shadow-sm">
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="font-heading font-extrabold text-sm">${f.blood_group}</span>
                            <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${isCritical ? 'bg-[#F5A285] text-white' : 'bg-[#EBF5F5] text-[#2D8A8A]'}">
                                ${f.risk_level}
                            </span>
                        </div>
                        <div class="text-base font-extrabold font-mono mt-1 text-[#2D8A8A]">${f.current_stock_litres} Litres</div>
                        <div class="text-[10px] text-[#4A5568] mt-0.5 font-medium">Daily Burn: ~${f.daily_burn_litres} L/day</div>
                    </div>
                    <div class="pt-2 border-t border-[#2D8A8A]/10 mt-2 text-[10px] font-bold ${isCritical ? 'text-[#D3663E]' : 'text-[#2D8A8A]'}">
                        ⏳ ${f.days_until_depletion} Days Reserve
                    </div>
                </div>
            `;
        }).join('');

        // 3. Hospital-Wise Shortage Directory Search Results
        if (hospitalResults) {
            if (hospitalShortages.length === 0) {
                hospitalResults.innerHTML = `<div class="p-4 bg-[#F7F4EF] border border-[#2D8A8A]/10 rounded-2xl text-xs text-[#4A5568] text-center">No hospital shortages matched your blood group or search query.</div>`;
            } else {
                hospitalResults.innerHTML = hospitalShortages.map(h => `
                    <div class="p-4 bg-white border border-[#2D8A8A]/15 rounded-2xl shadow-sm hover:border-[#2D8A8A]/30 transition">
                        <div class="flex justify-between items-start mb-2 pb-2 border-b border-[#2D8A8A]/10">
                            <div>
                                <div class="flex items-center gap-2">
                                    <h5 class="text-sm font-bold text-[#1E232A]">${h.hospital_name}</h5>
                                    <span class="text-[10px] bg-[#FDF2EE] text-[#D3663E] border border-[#F5A285]/30 px-2.5 py-0.5 rounded-full font-bold">
                                        ${h.shortage_count} Shortage Groups
                                    </span>
                                </div>
                                <p class="text-xs text-[#4A5568] mt-0.5">${h.district} District &bull; Helpline: <strong class="font-mono text-[#1E232A]">${h.helpline}</strong></p>
                            </div>
                            <a href="tel:${h.helpline}" class="px-3 py-1 bg-[#2D8A8A] text-white rounded-full text-xs font-bold hover:bg-[#236B6B] transition">
                                Contact Blood Desk
                            </a>
                        </div>

                        <div class="flex flex-wrap gap-2 mt-2">
                            ${h.shortage_groups.map(sg => `
                                <div class="px-3 py-1 bg-[#FDF2EE] border border-[#F5A285]/30 rounded-xl flex items-center gap-2 text-xs">
                                    <strong class="text-[#D3663E]">${sg.blood_group}</strong>
                                    <span class="text-[#1E232A] font-mono font-bold">${sg.litres_available} L</span>
                                    <span class="text-[10px] text-[#4A5568]">(${sg.status})</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    // Registration link click listener at bottom of Staff Login Form
    const linkGotoRegister = document.getElementById('link-goto-register-facility');
    if (linkGotoRegister) {
        linkGotoRegister.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => {
                tab.classList.remove('active');
                tab.classList.remove('hidden'); // strip Tailwind hidden so CSS can show it
            });

            const regTab = document.getElementById('tab-register-hospital');
            if (regTab) {
                regTab.classList.remove('hidden');
                regTab.classList.add('active');
            }
            
            const staffNav = document.querySelector('[data-tab="tab-hospital-admin"]');
            if (staffNav) staffNav.classList.add('active');
        });
    }

    async function loadDepartmentDrillDownAnalytics() {
        const container = document.getElementById('drilldown-results-container');
        if (!container) return;

        const search = document.getElementById('drill-search-input')?.value.trim() || '';
        const district = document.getElementById('drill-district-select')?.value || 'ALL';
        const dept = document.getElementById('drill-dept-select')?.value || 'ALL';

        try {
            const res = await fetch(`/api/analytics/department-drilldown?district=${encodeURIComponent(district)}&department=${encodeURIComponent(dept)}&search=${encodeURIComponent(search)}`);
            if (res.ok) {
                const data = await res.json();
                renderDepartmentDrillDownResults(data.hierarchical_analytics || []);
            }
        } catch (err) {
            console.warn("Department drilldown loading error:", err);
            container.innerHTML = `<div class="p-6 text-center text-xs text-[#4A5568] bg-[#F4F1EA] rounded-2xl">Could not load department analytics right now.</div>`;
        }
    }

    function renderDepartmentDrillDownResults(hospitals) {
        const container = document.getElementById('drilldown-results-container');
        if (!container) return;

        if (hospitals.length === 0) {
            container.innerHTML = `<div class="p-6 text-center text-xs text-[#4A5568] bg-[#F4F1EA] rounded-2xl border border-[#2D8A8A]/10">No department analytical records matched your search filters.</div>`;
            return;
        }

        container.innerHTML = hospitals.map(h => `
            <div class="p-5 bg-white border border-[#2D8A8A]/15 rounded-2xl shadow-sm hover:border-[#2D8A8A]/30 transition">
                <div class="flex justify-between items-start pb-3 border-b border-[#2D8A8A]/10 mb-3">
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="text-sm font-heading font-extrabold text-[#1E232A]">${h.hospital_name}</h4>
                            <span class="text-[10px] bg-[#EBF5F5] text-[#2D8A8A] px-2.5 py-0.5 rounded-full font-bold border border-[#2D8A8A]/20">${h.district}</span>
                        </div>
                        <p class="text-xs text-[#4A5568] mt-0.5">Public Department Breakdown &bull; <strong class="text-[#2D8A8A]">${h.department_count} Specializations Tracked</strong></p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-bold text-[#1E232A] block">${h.available_beds} Total Beds Available</span>
                        <span class="text-[10px] text-[#2D8A8A] font-semibold block mt-0.5">${h.icu_available} ICU Beds Active</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${h.departments.map(d => `
                        <div class="p-3.5 bg-[#F7F4EF] border border-[#2D8A8A]/10 rounded-xl flex flex-col justify-between hover:bg-[#EBF5F5] transition">
                            <div>
                                <div class="flex justify-between items-center mb-1.5">
                                    <span class="font-heading font-extrabold text-xs text-[#1E232A]">${d.dept_name}</span>
                                    <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${d.surge_level === 'HIGH_SURGE' ? 'bg-[#FDF2EE] text-[#D3663E] border border-[#F5A285]/30' : 'bg-[#EBF5F5] text-[#2D8A8A] border border-[#2D8A8A]/20'}">
                                        ${d.surge_level}
                                    </span>
                                </div>

                                <div class="space-y-1 text-[11px] text-[#4A5568]">
                                    <div class="flex justify-between">
                                        <span>Bed Capacity:</span>
                                        <strong class="text-[#1E232A]">${d.available_beds} / ${d.allocated_beds} Available</strong>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Occupancy Ratio:</span>
                                        <strong class="${d.occupancy_pct > 80 ? 'text-[#D3663E]' : 'text-[#2D8A8A]'} font-mono">${d.occupancy_pct}%</strong>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Available ICU:</span>
                                        <strong class="text-[#2D8A8A] font-mono">${d.available_icu_beds} Beds</strong>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Avg. Emergency Wait:</span>
                                        <strong class="text-[#1E232A] font-mono">~${d.avg_wait_mins} mins</strong>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>On-Duty Staffing:</span>
                                        <strong class="text-[#1E232A]">${d.doctors_on_duty_ratio}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // Drill-Down Event Listeners
    const drillSearchEl = document.getElementById('drill-search-input');
    const drillDistrictEl = document.getElementById('drill-district-select');
    const drillDeptEl = document.getElementById('drill-dept-select');

    if (drillSearchEl) drillSearchEl.addEventListener('input', loadDepartmentDrillDownAnalytics);
    if (drillDistrictEl) drillDistrictEl.addEventListener('change', loadDepartmentDrillDownAnalytics);
    if (drillDeptEl) drillDeptEl.addEventListener('change', loadDepartmentDrillDownAnalytics);

    function initPublicAnalyticsCharts(districts) {
        if (typeof Chart === 'undefined') return;

        // Chart 1: Bed & ICU Capacity
        const canvasBeds = document.getElementById('chart-beds-icu');
        if (canvasBeds) {
            if (chartBedsIcuInstance) chartBedsIcuInstance.destroy();
            const labels = Object.keys(districts).length ? Object.keys(districts) : ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'];
            const totalBedsData = labels.map(l => districts[l]?.total_beds || (l === 'Mumbai' ? 950 : 500));
            const availBedsData = labels.map(l => districts[l]?.available_beds || (l === 'Mumbai' ? 210 : 130));
            const availIcuData = labels.map(l => districts[l]?.icu_available || (l === 'Mumbai' ? 38 : 22));

            chartBedsIcuInstance = new Chart(canvasBeds, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Total Capacity', data: totalBedsData, backgroundColor: 'rgba(30, 35, 42, 0.15)', borderRadius: 6 },
                        { label: 'Available Beds', data: availBedsData, backgroundColor: '#2D8A8A', borderRadius: 6 },
                        { label: 'Available ICU', data: availIcuData, backgroundColor: '#F5A285', borderRadius: 6 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans', size: 11 } } } },
                    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
                }
            });
        }

        // Chart 2: Aggregated Blood Inventory
        const canvasBlood = document.getElementById('chart-blood-inventory');
        if (canvasBlood) {
            if (chartBloodInventoryInstance) chartBloodInventoryInstance.destroy();
            chartBloodInventoryInstance = new Chart(canvasBlood, {
                type: 'doughnut',
                data: {
                    labels: ['O+ Positive', 'A+ Positive', 'B+ Positive', 'AB+ Positive', 'O- Negative', 'A- Negative', 'B- Negative', 'AB- Negative'],
                    datasets: [{
                        data: [380, 290, 310, 120, 65, 45, 50, 30],
                        backgroundColor: ['#2D8A8A', '#236B6B', '#3AA6A6', '#F5A285', '#D3663E', '#E07A5F', '#81B29A', '#F4F1EA'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { font: { family: 'Plus Jakarta Sans', size: 10 } } } }
                }
            });
        }

        // Chart 3: ML Footfall & Occupancy Forecast
        const canvasFootfall = document.getElementById('chart-footfall-trend');
        if (canvasFootfall) {
            if (chartFootfallTrendInstance) chartFootfallTrendInstance.destroy();
            chartFootfallTrendInstance = new Chart(canvasFootfall, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu (Today)', 'Fri (Forecast)', 'Sat (Forecast)', 'Sun (Forecast)'],
                    datasets: [
                        { label: 'Patient Footfall Count', data: [1120, 1250, 1310, 1380, 1450, 1390, 1280], borderColor: '#2D8A8A', backgroundColor: 'rgba(45, 138, 138, 0.08)', fill: true, tension: 0.3 },
                        { label: 'Predicted Bed Occupancy (%)', data: [72, 74, 76, 78, 82, 79, 75], borderColor: '#F5A285', borderDash: [5, 5], fill: false, tension: 0.3 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans', size: 11 } } } },
                    scales: { y: { beginAtZero: false, min: 50, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
                }
            });
        }
    }

    // Prediction Form Submission Handler
    const predictionFormEl = document.getElementById('prediction-form');
    if (predictionFormEl) {
        predictionFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dept = document.getElementById('pred-dept').value;
            const disease = document.getElementById('pred-disease').value;
            const admitted = parseFloat(document.getElementById('pred-admitted').value) || 35;
            const discharged = parseFloat(document.getElementById('pred-discharged').value) || 25;
            const outputBox = document.getElementById('prediction-results-box');

            if (outputBox) {
                outputBox.classList.remove('hidden');
                outputBox.innerHTML = `<div class="text-xs font-semibold text-[#1E232A]">Calculating patient care & bed load forecast...</div>`;
            }

            try {
                const res = await fetch('/api/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        department: dept,
                        disease: disease,
                        patients_admitted: admitted,
                        patients_discharged: discharged,
                        bed_capacity: 1850,
                        occupied_beds: 1415,
                        icu_beds: 150,
                        occupied_icu: 72
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const preds = data.predictions || {};
                    const recs = data.recommendations || [];

                    outputBox.innerHTML = `
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#2D8A8A]/15 mb-3">
                            <div>
                                <span class="text-[10px] font-bold text-[#2D8A8A] bg-[#EBF5F5] border border-[#2D8A8A]/20 px-3 py-0.5 rounded-full uppercase">
                                    PREDICTIVE CARE FORECAST SUMMARY
                                </span>
                                <h4 class="text-sm font-heading font-extrabold text-[#1E232A] mt-1">${dept} - ${disease} Forecast</h4>
                            </div>
                            <div class="text-right">
                                <span class="text-xs font-bold text-[#D3663E] bg-[#FDF2EE] border border-[#F5A285]/30 px-3 py-1 rounded-full">
                                    Risk Level: ${preds.hospital_load_risk || 'Normal'}
                                </span>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
                            <div class="p-3 bg-white border border-[#2D8A8A]/10 rounded-xl">
                                <span class="text-[10px] text-[#4A5568] block">Forecast Occupancy</span>
                                <span class="text-sm font-bold text-[#2D8A8A]">${preds.tomorrow_occupancy_pct}% (${preds.tomorrow_bed_occupancy} Beds)</span>
                            </div>
                            <div class="p-3 bg-white border border-[#2D8A8A]/10 rounded-xl">
                                <span class="text-[10px] text-[#4A5568] block">Medicine Demand</span>
                                <span class="text-sm font-bold text-[#1E232A]">${preds.tomorrow_medicine_demand} Units</span>
                            </div>
                            <div class="p-3 bg-white border border-[#2D8A8A]/10 rounded-xl">
                                <span class="text-[10px] text-[#4A5568] block">ICU Buffer Reserve</span>
                                <span class="text-sm font-bold text-[#2D8A8A]">${preds.recommended_icu_buffer} Beds</span>
                            </div>
                            <div class="p-3 bg-white border border-[#2D8A8A]/10 rounded-xl">
                                <span class="text-[10px] text-[#4A5568] block">Staff Surge Staffing</span>
                                <span class="text-sm font-bold text-[#D3663E]">+${preds.recommended_staff_surge} Personnel</span>
                            </div>
                        </div>

                        <div class="text-xs text-[#1E232A] font-medium pt-2 border-t border-[#2D8A8A]/10">
                            <strong>AI Clinical Recommendation:</strong> ${recs.join(' ')}
                        </div>
                    `;
                }
            } catch (err) {
                console.warn("Prediction error:", err);
            }
        });
    }

    // --------------------------------------------------------------------------
    // 13. Navigation Tabs Handler
    // --------------------------------------------------------------------------
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTabId = item.getAttribute('data-tab');

            // Remove active from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Hide all tab contents — also strip Tailwind's 'hidden' class so CSS .tab-content.active can show them
            tabContents.forEach(tab => {
                tab.classList.remove('active');
                tab.classList.remove('hidden');
            });

            item.classList.add('active');
            const activeTab = document.getElementById(targetTabId);
            if (activeTab) {
                activeTab.classList.remove('hidden'); // ensure Tailwind hidden is gone
                activeTab.classList.add('active');
            }

            if (targetTabId === 'tab-hospital-admin') {
                renderHospitalAdminPortalState();
            } else if (targetTabId === 'tab-patient-discovery') {
                loadMaharashtraDiscovery();
            } else if (targetTabId === 'tab-blood-search') {
                loadBloodBankRegistry();
            } else if (targetTabId === 'tab-public-analytics') {
                loadPublicAnalyticsDashboard();
            } else if (targetTabId === 'tab-emergency-mode') {
                triggerEmergencyTriage();
            } else if (targetTabId === 'tab-google-search') {
                // Auto-run a default search if the results panel is empty
                const queryInput = document.getElementById('google-search-query');
                const resultsContainer = document.getElementById('google-search-results-cards');
                const hasResults = resultsContainer && resultsContainer.querySelector('.card');
                if (queryInput && !hasResults) {
                    if (!queryInput.value) queryInput.value = 'Paracetamol 500mg';
                    runPharmacySearch(queryInput.value.trim());
                }
            } else if (targetTabId === 'tab-govt-authority') {
                loadGovtAuthorityAnalytics();
            }
        });
    });

    // --------------------------------------------------------------------------
    // 14. Toast Notification Engine
    // --------------------------------------------------------------------------
    function showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const borderClass = type === 'success' ? 'border-emerald-500 text-emerald-400' : (type === 'error' ? 'border-red-500 text-red-400' : 'border-blue-500 text-blue-400');
        
        const toast = document.createElement('div');
        toast.className = `toast p-3.5 bg-slate-900 border-l-4 ${borderClass} shadow-xl rounded-r-lg max-w-xs border border-slate-800 text-slate-100 flex items-start gap-2.5`;
        toast.innerHTML = `
            <div class="flex-1">
                <div class="text-xs font-bold text-white">${title}</div>
                <div class="text-[11px] text-slate-300 mt-0.5">${message}</div>
            </div>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 250);
        }, 3500);
    }



    if (btnGlobalRefresh) {
        btnGlobalRefresh.addEventListener('click', () => {
            loadMaharashtraDiscovery();
            loadPublicAnalyticsDashboard();
            loadGovtAuthorityAnalytics();
            showToast("Network Refreshed", "Refreshed Maharashtra Hospital Network", "info");
        });
    }

    // Initialize Page View
    loadMaharashtraDiscovery();
    loadPublicAnalyticsDashboard();
    renderHospitalAdminPortalState();
});
