console.log('Hej 👋');
fetchPosition();

const map = L.map('map');
const mapLink = '<a href="http://www.esri.com/">Esri</a>';
const wholink = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
L.tileLayer(
    'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; ' + mapLink + ', ' + wholink,
        maxZoom: 18,
    }).addTo(map);
var marker;

navigator.geolocation.getCurrentPosition(userGeolocation, error);

setInterval(() => {
    fetchPosition();
}, 10000);

async function fetchPosition() {
    const response = await fetch("http://api.open-notify.org/iss-now.json");
    const result = await response.json();

    if (result.message === 'success') {
        console.log('Find position 🛰️');
        console.log(result);
        drawElement(result.iss_position.latitude, result.iss_position.longitude);
    }
}

function drawElement(lat, long) {
    if (marker) {
        // remove previous marker
        map.removeLayer(marker);
        // draw flight line
        new L.Polyline([marker._latlng,new L.LatLng(lat, long)], {
            color: 'red',
            weight: 3,
            opacity: 0.3,
            smoothFactor: 1
        }).addTo(map);
    } else {
        // adjust view
        map.setView([lat, long], 5);
    }

    const issIcon = L.icon({
        iconUrl: 'assets/media/iss.png',
        iconSize: [100, 60]
    });

    let Difference_In_Days =
        Math.round
        ((new Date() - new Date("11/20/1998")) / (1000 * 3600 * 24));
    marker = L.marker([lat, long], {icon: issIcon}).addTo(map).bindPopup(
        '<h3>International Space Station (ISS)</h3>' +
        '<table>' +
        '<tr>' +
        '<td><strong>Operating days</strong></td>' +
        '<td>' + Difference_In_Days + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td><strong>Speed</strong></td>' +
        '<td>7,66 km/s</td>' +
        '</tr>' +
        '<tr>' +
        '<td><strong>Height</strong></td>' +
        '<td>408km</td>' +
        '</tr>' +
        '</table>' +
        '<a href="https://en.wikipedia.org/wiki/International_Space_Station">wikipedia</a>'
    );
}

function userGeolocation(pos) {
    const crd = pos.coords;

    L.circle([crd.latitude, crd.longitude], {
        radius : 1000000,
        color  : '#FFECB3',
        opacity: 0.75,
    }).addTo(map).bindPopup('Possible viewing area from the ground');
}

function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}