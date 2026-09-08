// map-data.js
// Data & Logic for Desa Dongko Interactive Map

const MAP_CENTER = [-8.1880, 111.5747];
const MAP_ZOOM = 14;

// Marker Data (Disesuaikan dengan tata letak pada gambar Reklame Desa)
const locations = [
    {
        id: 1,
        name: "Kantor Desa Dongko",
        category: "pemerintahan",
        lat: -8.1830,
        lng: 111.5800,
        icon: "fa-building-columns",
        color: "#D4AF37", 
        desc: "Pusat pelayanan administrasi dan pemerintahan Desa Dongko."
    },
    {
        id: 2,
        name: "Kantor Kecamatan Dongko",
        category: "pemerintahan",
        lat: -8.1950,
        lng: 111.5820,
        icon: "fa-landmark",
        color: "#D4AF37",
        desc: "Pusat pemerintahan tingkat kecamatan."
    },
    {
        id: 3,
        name: "Puskesmas Dongko",
        category: "kesehatan",
        lat: -8.2000,
        lng: 111.5620,
        icon: "fa-hospital",
        color: "#e63946",
        desc: "Fasilitas pelayanan kesehatan masyarakat Dongko."
    },
    {
        id: 4,
        name: "Lapangan Dongko Culture",
        category: "lapangan",
        lat: -8.1700,
        lng: 111.5720,
        icon: "fa-futbol",
        color: "#2D4A3E",
        desc: "Area ruang publik terbuka untuk olahraga dan acara kebudayaan."
    },
    {
        id: 5,
        name: "Pasar Dongko",
        category: "pasar",
        lat: -8.1880,
        lng: 111.5750,
        icon: "fa-store",
        color: "#f4a261",
        desc: "Pusat kegiatan ekonomi dan perdagangan tradisional warga sejak 1919."
    },
    {
        id: 6,
        name: "Koramil Dongko",
        category: "pemerintahan",
        lat: -8.2020,
        lng: 111.5720,
        icon: "fa-shield-halved",
        color: "#457b9d",
        desc: "Komando Rayon Militer Desa Dongko."
    },
    {
        id: 7,
        name: "Sekolah (SDN Dongko)",
        category: "pendidikan",
        lat: -8.1900,
        lng: 111.5650,
        icon: "fa-school",
        color: "#1d3557",
        desc: "Fasilitas pendidikan dasar di wilayah Dongko."
    },
    {
        id: 8,
        name: "Masjid Baiturrahman",
        category: "ibadah",
        lat: -8.1860,
        lng: 111.5730,
        icon: "fa-mosque",
        color: "#2a9d8f",
        desc: "Tempat ibadah utama umat muslim di sekitar pusat desa."
    }
];

// Batas Desa (Bentuk disesuaikan dengan gambar reklame: bentuk menyerupai kepala menghadap kiri)
const villageBoundary = [
    [-8.165, 111.570], // Top
    [-8.168, 111.578], // Top Right
    [-8.175, 111.582], // Right bulge
    [-8.185, 111.578], // Indent
    [-8.190, 111.585], // Lower Right bulge (near Kantor Kecamatan)
    [-8.205, 111.585], // Bottom Right
    [-8.208, 111.575], // Bottom Mid
    [-8.205, 111.565], // Bottom Left (near Puskesmas)
    [-8.195, 111.555], // Left bulge down
    [-8.180, 111.550], // Left bulge up
    [-8.170, 111.560], // Top Left
];

// Jalan Provinsi (Garis Kuning pada gambar)
const jalanProvinsi = [
    [-8.165, 111.573], // Dari utara
    [-8.180, 111.573], // Lurus ke tengah
    [-8.188, 111.575], // Melewati pasar
    [-8.192, 111.560], // Belok ke barat/kiri
    [-8.205, 111.555]  // Ke arah selatan daya
];

// Initialize Map
let map;
let markers = [];
let userMarker = null;
let userCircle = null;

document.addEventListener('DOMContentLoaded', () => {
    // Pastikan elemen map ada sebelum inisialisasi
    const mapElement = document.getElementById('dongko-map');
    if (!mapElement) return;

    // Init map
    map = L.map('dongko-map', {
        zoomControl: false, // Kita pindahkan ke posisi yang lebih nyaman di mobile
        scrollWheelZoom: false, // Mencegah ter-scroll tak sengaja di desktop
        tap: false // Perbaikan isu tap di beberapa browser mobile
    }).setView(MAP_CENTER, MAP_ZOOM);

    // Reposition zoom control
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Add OpenStreetMap tiles dengan styling ringan via CSS filter nantinya
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Data batas desa: Ardi',
        maxZoom: 18,
    }).addTo(map);

    // Add Village Boundary (Garis Kuning)
    const polygon = L.polygon(villageBoundary, {
        color: '#D4AF37', // Gold/Kuning elegan
        weight: 3,
        opacity: 0.9,
        fillColor: '#D4AF37',
        fillOpacity: 0.05,
        dashArray: '5, 10'
    }).addTo(map);
    
    // Fit bounds to polygon initially
    map.fitBounds(polygon.getBounds());

    // Add Jalan Provinsi (Garis Kuning)
    const road = L.polyline(jalanProvinsi, {
        color: '#f4a261', // Kuning/Orange (Jalan Provinsi)
        weight: 4,
        opacity: 0.9,
        dashArray: '10, 10'
    }).addTo(map);

    // Create custom FontAwesome icon builder
    const createCustomIcon = (iconClass, color) => {
        return L.divIcon({
            className: 'custom-map-marker',
            html: `<div class="marker-pin" style="background-color: ${color}"><i class="fa-solid ${iconClass}"></i></div><div class="marker-shadow"></div>`,
            iconSize: [40, 48],
            iconAnchor: [20, 48],
            popupAnchor: [0, -40]
        });
    };

    // Render markers
    const renderMarkers = (filterCategory = 'semua') => {
        // Clear existing markers
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        locations.forEach(loc => {
            if (filterCategory === 'semua' || loc.category === filterCategory) {
                const marker = L.marker([loc.lat, loc.lng], {
                    icon: createCustomIcon(loc.icon, loc.color)
                }).addTo(map);

                // Buat URL Google Maps untuk petunjuk arah
                const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;

                const popupContent = `
                    <div class="map-popup">
                        <span class="popup-category">${loc.category.toUpperCase()}</span>
                        <h4 class="popup-title">${loc.name}</h4>
                        <p class="popup-desc">${loc.desc}</p>
                        <a href="${gmapsUrl}" target="_blank" class="btn-popup">
                            <i class="fa-solid fa-location-arrow"></i> Petunjuk Arah
                        </a>
                    </div>
                `;
                marker.bindPopup(popupContent);
                markers.push(marker);
            }
        });
    };

    renderMarkers(); // Initial render

    // --- FITUR: FILTER (CHIPS) ---
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            // Remove active class from all
            filterChips.forEach(c => c.classList.remove('active'));
            // Add active class to clicked
            e.target.classList.add('active');
            
            const category = e.target.getAttribute('data-filter');
            renderMarkers(category);
        });
    });

    // --- FITUR: SEARCH ---
    const searchInput = document.getElementById('map-search-input');
    const searchResults = document.getElementById('map-search-results');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        searchResults.innerHTML = '';
        
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const filtered = locations.filter(loc => loc.name.toLowerCase().includes(query) || loc.category.toLowerCase().includes(query));
        
        if (filtered.length > 0) {
            searchResults.style.display = 'block';
            filtered.forEach(loc => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `<i class="fa-solid ${loc.icon}" style="color:${loc.color}"></i> <span>${loc.name}</span>`;
                div.addEventListener('click', () => {
                    map.setView([loc.lat, loc.lng], 16);
                    renderMarkers('semua'); // reset filter
                    
                    // Reset UI
                    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                    document.querySelector('.filter-chip[data-filter="semua"]').classList.add('active');
                    
                    searchInput.value = '';
                    searchResults.style.display = 'none';
                    
                    // Trigger popup (find the specific marker)
                    const targetMarker = markers.find(m => m.getLatLng().lat === loc.lat && m.getLatLng().lng === loc.lng);
                    if (targetMarker) targetMarker.openPopup();
                });
                searchResults.appendChild(div);
            });
        } else {
            searchResults.style.display = 'block';
            searchResults.innerHTML = '<div class="search-result-item">Tidak ditemukan</div>';
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.map-search-container')) {
            searchResults.style.display = 'none';
        }
    });

    // --- FITUR: LOKASI SAYA ---
    const locateBtn = document.getElementById('btn-locate');
    locateBtn.addEventListener('click', () => {
        locateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mencari...';
        
        map.locate({setView: true, maxZoom: 16});
    });

    map.on('locationfound', (e) => {
        const radius = e.accuracy / 2;

        if (userMarker) {
            map.removeLayer(userMarker);
            map.removeLayer(userCircle);
        }

        userMarker = L.marker(e.latlng, {
            icon: L.divIcon({
                className: 'custom-map-marker',
                html: `<div class="marker-pin user-pin" style="background-color:#1d3557"><i class="fa-solid fa-street-view"></i></div><div class="marker-shadow"></div>`,
                iconSize: [40, 48],
                iconAnchor: [20, 48],
                popupAnchor: [0, -40]
            })
        }).addTo(map).bindPopup("<div class='map-popup'><h4 class='popup-title'>Lokasi Anda Saat Ini</h4><p class='popup-desc'>Akurasi: "+Math.round(radius)+" meter.</p></div>").openPopup();

        userCircle = L.circle(e.latlng, radius, {
            color: '#1d3557',
            fillColor: '#457b9d',
            fillOpacity: 0.2
        }).addTo(map);

        locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Lokasi Saya';
    });

    map.on('locationerror', (e) => {
        alert("Lokasi tidak dapat diakses. Silakan izinkan akses lokasi pada browser Anda.");
        locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Lokasi Saya';
    });
});
