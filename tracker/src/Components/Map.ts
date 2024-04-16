import L from "leaflet";

class Map {
    protected map = null
    protected marker = null

    constructor() {
    }


    public setPosition(position: GeolocationPosition|boolean) {
        if (this.map === null) {
            this.initMap()
        }

        if (!position) {
            console.error('❌ position not found')
            return
        }
        console.log('📍 set position')
        this.map.setView([position.coords.latitude, position.coords.longitude], 18)
    }

    public addMarker(position: GeolocationPosition) {
        if (this.marker) {
            // remove previous marker
            this.map.removeLayer(this.marker);
            // draw flight line
            new L.Polyline([this.marker._latlng, new L.LatLng(position.coords.latitude, position.coords.longitude)], {
                color: 'red',
                weight: 3,
                opacity: 0.3,
                smoothFactor: 1
            }).addTo(this.map);
        } else {
            this.map.setView([position.coords.latitude, position.coords.longitude], 18);
        }

        console.log('📍 add marker', position.coords.latitude, position.coords.longitude)
        this.marker = L.marker([position.coords.latitude, position.coords.longitude]).addTo(this.map)
    }

    private initMap() {
        console.log('🗺 init map')
        this.map = L.map('map').setView([12.9716, 77.5946], 11)

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map)
    }
}

export default new Map()