import Geo from "./Geo"
class Gpx {

    constructor() {
    }

    public downloadGpx(): void {
        const gpxData = this.createGpx()
        const blob = new Blob([gpxData], {type: 'application/gpx+xml'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'geolocation-tracking.gpx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        document.getElementById('result').innerHTML = new Option(gpxData).innerHTML;
    }

    private createGpx() {
        const gpxHeader: string = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX-Generator" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Geolocation Tracking</name><trkseg>`;
        const gpxFooter = `</trkseg></trk></gpx>`;

        const gpxBody = Geo.getRecordedPositions().map(({coords: {latitude, longitude}, timestamp}) =>
            `<trkpt lat="${latitude}" lon="${longitude}"><time>${timestamp}</time></trkpt>`
        ).join('');

        return `${gpxHeader}${gpxBody}${gpxFooter}`;
    }
}

export default new Gpx()