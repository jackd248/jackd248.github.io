class Geo {
    protected positions = []

    constructor() {
    }

    /*
     * Restructure to use an observer, e.g. https://stackoverflow.com/a/47598837
     */
    public async getGeoPosition() {
        // @ts-ignore
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    this.positions.push(position)
                    resolve(position)
                }, error => {
                    console.error("error: " + error.message)
                    reject(false)
                }, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            } else {
                console.log("Geolocation is not supported by this browser.")
                reject(false)
            }
        });
    }

    public getRecordedPositions() {
        return this.positions
    }
}

export default new Geo()