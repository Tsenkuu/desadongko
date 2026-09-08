// map-data.js
// Data & Logic for Desa Dongko Interactive Map - GOOGLE MAPS API VERSION

// Default map center (Pusat Kecamatan Dongko)
const DEFAULT_CENTER = { lat: -8.1898793, lng: 111.5766407 };
const DEFAULT_ZOOM = 14;

// ---------------------------------------------------------
// MARKER DATA
// PENTING: Hanya isi koordinat latitude dan longitude dengan nilai asli/benar.
// ---------------------------------------------------------
const locations = [
    {
        id: 1,
        name: "Kantor Desa Dongko",
        category: "pemerintahan",
        lat: -8.1880, // Contoh data asli yang divalidasi
        lng: 111.5747,
        icon: "fa-building-columns",
        color: "#D4AF37", 
        desc: "Pusat pelayanan administrasi dan pemerintahan Desa Dongko."
    },
    {
        id: 2,
        name: "Kantor Kecamatan Dongko",
        category: "pemerintahan",
        lat: null, // [MEMBUTUHKAN KOORDINAT ASLI]
        lng: null,
        icon: "fa-landmark",
        color: "#D4AF37",
        desc: "Pusat pemerintahan tingkat kecamatan."
    },
    {
        id: 3,
        name: "Puskesmas Dongko",
        category: "kesehatan",
        lat: null, // [MEMBUTUHKAN KOORDINAT ASLI]
        lng: null,
        icon: "fa-hospital",
        color: "#e63946",
        desc: "Fasilitas pelayanan kesehatan masyarakat Dongko."
    },
    {
        id: 4,
        name: "Lapangan Dongko Culture",
        category: "lapangan",
        lat: null, // [MEMBUTUHKAN KOORDINAT ASLI]
        lng: null,
        icon: "fa-futbol",
        color: "#2D4A3E",
        desc: "Area ruang publik terbuka untuk olahraga dan acara kebudayaan."
    },
    {
        id: 5,
        name: "Pasar Dongko",
        category: "pasar",
        lat: null, // [MEMBUTUHKAN KOORDINAT ASLI]
        lng: null,
        icon: "fa-store",
        color: "#f4a261",
        desc: "Pusat kegiatan ekonomi dan perdagangan tradisional warga."
    },
    {
        id: 6,
        name: "Pom Bensin",
        category: "spbu",
        lat: null, // [MEMBUTUHKAN KOORDINAT ASLI]
        lng: null,
        icon: "fa-gas-pump",
        color: "#457b9d",
        desc: "Stasiun pengisian bahan bakar umum."
    },
    {
        id: 7,
        name: "Pendidikan",
        category: "pendidikan",
        lat: null, // [MEMBUTUHKAN KOORDINAT ASLI]
        lng: null,
        icon: "fa-school",
        color: "#1d3557",
        desc: "Fasilitas pendidikan di wilayah Dongko."
    },
    {
        id: 8,
        name: "Masjid",
        category: "ibadah",
        lat: null, // [MEMBUTUHKAN KOORDINAT ASLI]
        lng: null,
        icon: "fa-mosque",
        color: "#2a9d8f",
        desc: "Tempat ibadah utama warga desa."
    }
];

let map;
let markers = [];
let infoWindow;
let userMarker = null;
let geojsonBounds = null;

// Initialize Google Maps API
window.initMap = async function() {
    const mapElement = document.getElementById('dongko-map');
    if (!mapElement) return;

    // Load necessary libraries
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    // Initialize Map with multiple controls
    map = new Map(mapElement, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        mapId: "DEMO_MAP_ID", // Dibutuhkan untuk menggunakan AdvancedMarkerElement
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DEFAULT,
            position: google.maps.ControlPosition.TOP_LEFT,
        },
        zoomControl: true,
        fullscreenControl: true,
        streetViewControl: false
    });

    infoWindow = new google.maps.InfoWindow();

    // 1. LOAD GEOJSON BATAS DESA
    const overlayError = document.getElementById('map-error-overlay');
    const focusBtn = document.getElementById('btn-focus-desa');
    geojsonBounds = new google.maps.LatLngBounds();

    map.data.loadGeoJson('assets/dongko.geojson', null, function(features) {
        if(features.length > 0) {
            // Sembunyikan error jika geojson berhasil
            if(overlayError) overlayError.style.display = 'none';
            if(focusBtn) {
                focusBtn.style.display = 'flex';
            }

            // Hitung bounds (koordinat batas wilayah)
            map.data.forEach(function(feature) {
                const geometry = feature.getGeometry();
                if(geometry.getType() === 'Polygon') {
                    geometry.getArray().forEach(path => {
                        path.getArray().forEach(latLng => geojsonBounds.extend(latLng));
                    });
                } else if(geometry.getType() === 'MultiPolygon') {
                    geometry.getArray().forEach(polygon => {
                        polygon.getArray().forEach(path => {
                            path.getArray().forEach(latLng => geojsonBounds.extend(latLng));
                        });
                    });
                }
            });

            // Fokus ke bounds desa
            if(!geojsonBounds.isEmpty()) {
                map.fitBounds(geojsonBounds);
            }
        }
    });

    // Style Polygon sesuai permintaan: Garis Kuning 3px, Fill kuning transparan 10-15%
    map.data.setStyle({
        strokeColor: '#D4AF37', // Kuning
        strokeWeight: 3,
        fillColor: '#D4AF37',
        fillOpacity: 0.15
    });

    // Menangkap jika data kosong setelah delay
    setTimeout(() => {
        let hasData = false;
        map.data.forEach(() => hasData = true);
        if(!hasData) {
            console.warn("GeoJSON tidak dimuat atau kosong.");
            if(overlayError) overlayError.style.display = 'flex';
        }
    }, 1500);

    // 2. RENDER MARKERS KUSTOM
    const createCustomContent = (iconClass, color) => {
        const div = document.createElement('div');
        div.className = 'custom-map-marker';
        div.innerHTML = `<div class="marker-pin" style="background-color: ${color}"><i class="fa-solid ${iconClass}"></i></div>`;
        return div;
    };

    const renderMarkers = (filterCategory = 'semua') => {
        // Hapus marker lama
        markers.forEach(m => m.map = null);
        markers = [];

        locations.forEach(loc => {
            // HANYA RENDER JIKA KOORDINAT VALID
            if (loc.lat !== null && loc.lng !== null) {
                if (filterCategory === 'semua' || loc.category === filterCategory) {
                    
                    const marker = new AdvancedMarkerElement({
                        map: map,
                        position: { lat: loc.lat, lng: loc.lng },
                        content: createCustomContent(loc.icon, loc.color),
                        title: loc.name
                    });

                    marker.addListener('click', () => {
                        const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
                        const popupContent = `
                            <div class="map-popup-google" style="min-width: 200px;">
                                <span class="popup-category" style="font-size:0.7rem; color:${loc.color}; font-weight:bold;">${loc.category.toUpperCase()}</span>
                                <h4 style="margin:5px 0;">${loc.name}</h4>
                                <p style="font-size:0.85rem; margin-bottom:10px;">${loc.desc}</p>
                                <a href="${gmapsUrl}" target="_blank" class="btn-popup" style="display:inline-block; background:${loc.color}; color:white; padding:5px 10px; text-decoration:none; border-radius:4px; font-size:0.8rem;">
                                    <i class="fa-solid fa-location-arrow"></i> Petunjuk Arah
                                </a>
                            </div>
                        `;
                        infoWindow.setContent(popupContent);
                        infoWindow.open(map, marker);
                    });

                    marker._customLoc = loc; 
                    markers.push(marker);
                }
            }
        });
    };

    renderMarkers();

    // 3. FITUR: FOCUS KE DESA
    if(focusBtn) {
        focusBtn.addEventListener('click', () => {
            if(geojsonBounds && !geojsonBounds.isEmpty()) {
                map.fitBounds(geojsonBounds);
            }
        });
    }

    // 4. FITUR: FILTER CHIPS
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            filterChips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            const category = e.target.getAttribute('data-filter');
            renderMarkers(category);
        });
    });

    // 5. FITUR: SEARCH LOKASI
    const searchInput = document.getElementById('map-search-input');
    const searchResults = document.getElementById('map-search-results');

    if(searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            searchResults.innerHTML = '';
            
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            const filtered = locations.filter(loc => loc.lat !== null && loc.lng !== null && (loc.name.toLowerCase().includes(query) || loc.category.toLowerCase().includes(query)));
            
            if (filtered.length > 0) {
                searchResults.style.display = 'block';
                filtered.forEach(loc => {
                    const div = document.createElement('div');
                    div.className = 'search-result-item';
                    div.innerHTML = `<i class="fa-solid ${loc.icon}" style="color:${loc.color}"></i> <span>${loc.name}</span>`;
                    div.addEventListener('click', () => {
                        map.setZoom(17);
                        map.panTo({ lat: loc.lat, lng: loc.lng });
                        renderMarkers('semua');
                        
                        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                        document.querySelector('.filter-chip[data-filter="semua"]').classList.add('active');
                        
                        searchInput.value = '';
                        searchResults.style.display = 'none';
                        
                        const targetMarker = markers.find(m => m.position.lat === loc.lat && m.position.lng === loc.lng);
                        if(targetMarker) {
                            google.maps.event.trigger(targetMarker, 'click');
                        }
                    });
                    searchResults.appendChild(div);
                });
            } else {
                searchResults.style.display = 'block';
                searchResults.innerHTML = '<div class="search-result-item">Tidak ditemukan lokasi yang valid</div>';
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.map-search-container')) {
                searchResults.style.display = 'none';
            }
        });
    }

    // 6. FITUR: LOKASI SAYA
    const locateBtn = document.getElementById('btn-locate');
    let userCircle = null;
    
    if(locateBtn) {
        locateBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert("Browser Anda tidak mendukung Geolocation.");
                return;
            }
            
            locateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mencari...';
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const accuracy = Math.round(position.coords.accuracy);
                    const latlng = { lat: lat, lng: lng };

                    if (userMarker) userMarker.map = null;
                    if (userCircle) userCircle.setMap(null);

                    userMarker = new AdvancedMarkerElement({
                        map: map,
                        position: latlng,
                        content: createCustomContent('fa-street-view', '#1d3557'),
                        title: 'Lokasi Anda'
                    });

                    userMarker.addListener('click', () => {
                        infoWindow.setContent(`<div style="padding:10px;"><strong>Posisi Anda</strong><br>Akurasi: ${accuracy} meter</div>`);
                        infoWindow.open(map, userMarker);
                    });

                    userCircle = new google.maps.Circle({
                        strokeColor: "#1d3557",
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: "#457b9d",
                        fillOpacity: 0.2,
                        map,
                        center: latlng,
                        radius: accuracy / 2,
                    });

                    map.setZoom(17);
                    map.panTo(latlng);
                    
                    locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Lokasi Saya';
                },
                (error) => {
                    alert("Lokasi tidak dapat diakses. Pastikan Anda mengizinkan akses GPS di browser Anda.");
                    locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Lokasi Saya';
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    // 7. PUSH LEGENDA KE DALAM GOOGLE MAPS CONTROLS
    const legendElement = document.querySelector('.map-legend');
    if (legendElement) {
        // Hapus margin top yang sebelumnya diset di CSS agar rapi sebagai floating control
        legendElement.style.marginTop = '0';
        legendElement.style.marginRight = '10px';
        legendElement.style.marginBottom = '20px';
        legendElement.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legendElement);
    }
};

// Panggil fungsi inisialisasi secara dinamis (fallback support jika tag <script> tidak async)
