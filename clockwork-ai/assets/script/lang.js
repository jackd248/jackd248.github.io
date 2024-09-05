// https://codepen.io/erikkjon88/pen/MGWzwV

let arrLang = {
    "de-de": {
        "intro-1": `Einfaches <em>DIY</em> Projekt um <a href="https://chat.openai.com/" target="_blank">KI</a> generierte`,
        "poems": "Gedichte",
        "intro-2": "basierend auf der aktuellen Uhrzeit",
        "intro-3": `auf einem <a href="https://www.waveshare.com/epaper" target="_blank">E-Ink Display</a> mit <a href="https://www.raspberrypi.com/products/raspberry-pi-zero/" target="_blank">Raspberry Pi Zero</a> zu rendern`,
        "installation": "Das gesamte Projekt Log sowie weitere Installationsanleitungen finden sich auf",
        "standalone": `Des Weiteren findest Du hier noch eine <a href="https://jackd248.github.io/clockwork-ai/standalone.html" target="_blank">Standalone Webansicht</a> sowie ein <a href="https://codepen.io/knrd/pen/qBzQeGd" target="_blank">Codepen Beispiel</a> für die eigene Nutzung einiger deutschen Gedichte.`,
    },
    "en-gb": {
        "intro-1": `Simple <em>DIY</em> project to render an <a href="https://chat.openai.com/" target="_blank">AI</a> generated`,
        "poems": "poems",
        "intro-2": "based on the current time",
        "intro-3": `on an <a href="https://www.waveshare.com/epaper" target="_blank">e-ink display</a> managed by a <a href="https://www.raspberrypi.com/products/raspberry-pi-zero/" target="_blank">raspberry pi zero</a>`,
        "installation": "See full project log and installation instructions on",
        "standalone": `You can also find a <a href="https://jackd248.github.io/clockwork-ai/standalone.html" target="_blank">standalone web view</a> and a <a href="https://codepen.io/knrd/pen/qBzQeGd" target="_blank">codepen</a> example for your own use of some German poems here.`,
    }
  };


// get/set the selected language
document.querySelector('.translate').addEventListener('click', function(event) {
    event.preventDefault();
    let targetLang = event.target.getAttribute('data-target-langid');
    let currentLang = event.target.getAttribute('data-current-langid');
    let targetLabel = event.target.getAttribute('data-target-langlabel');
    let currentLabel = event.target.textContent;
    document.querySelectorAll('.lang').forEach(function(element) {
        var key = element.getAttribute('data-langkey');
        if(arrLang[targetLang] && arrLang[targetLang][key]) {
            element.innerHTML = arrLang[targetLang][key];
        }
    });

    event.target.setAttribute('data-target-langid', currentLang);
    event.target.setAttribute('data-current-langid', targetLang);
    event.target.setAttribute('data-target-langlabel', currentLabel);
    event.target.innerHTML = targetLabel;
});