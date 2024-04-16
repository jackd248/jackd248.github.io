import {Controller} from "@hotwired/stimulus"
import Map from "../Components/Map"
import Geo from "../Components/Geo"
import Gpx from "../Components/Gpx"

export default class extends Controller<HTMLElement> {
    static targets = ["startButton", "stopButton", "timer"]
    interval = null
    seconds = 0

    // @ts-ignore
    async connect() {
        this.showTime()
        const position = await Geo.getGeoPosition();
        Map.setPosition(position);
        this.startButtonTarget.disabled = false
    }

    start() {
        console.log('🏁 start tracking')
        this.startButtonTarget.disabled = true
        this.stopButtonTarget.disabled = false

        this.startTimer()
    }

    stop() {
        console.log('🛑 stop tracking')
        this.startButtonTarget.disabled = false
        this.stopButtonTarget.disabled = true

        clearInterval(this.interval)
        this.interval = null
        Gpx.downloadGpx()
    }

    startTimer() {
        console.log('🕒 start timer')
        if (this.interval === null) {
            // @ts-ignore
            this.interval = setInterval(async () => {
                this.seconds++
                this.showTime()
                const position = await Geo.getGeoPosition();
                Map.addMarker(position);
            }, 1000)
        }
    }

    showTime() {
        const hours = Math.floor(this.seconds / 3600)
        const minutes = Math.floor((this.seconds % 3600) / 60)
        const seconds = this.seconds % 60

        this.timerTarget.textContent = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`
    }

    pad(value) {
        return value.toString().padStart(2, '0')
    }
}
