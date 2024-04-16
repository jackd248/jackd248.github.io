import { Application } from 'stimulus';

import TrackController from "./controllers/track";
// import "@hotwired/turbo"
const app = Application.start();

console.log('🚀 app loaded');
app.register('track', TrackController);
