// https://codepen.io/erikkjon88/pen/MGWzwV

let arrLang = {
    "de-de": {
        "intro-1": "Einfaches DIY Projekt um KI generierte",
        "poems": "Gedicht",
        "intro-2": "basierend auf der aktuellen Uhrzeit",
        "intro-3": "auf einem E-Ink Display mit Raspberry Pi Zero zu rendern",
        "installation": "Das gesamte Projekt Log sowie weitere Installationsanleitungen finden sich auf",
    },
    "en-gb": {
        "intro-1": "Simple DIY project to render an AI generated",
        "poems": "poems",
        "intro-2": "based on the current time",
        "intro-3": "on an e-ink display managed by a raspberry pi zero",
        "installation": "See full project log and installation instructions on",
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
            element.textContent = arrLang[targetLang][key];
        }
    });

    event.target.setAttribute('data-target-langid', currentLang);
    event.target.setAttribute('data-current-langid', targetLang);
    event.target.setAttribute('data-target-langlabel', currentLabel);
    event.target.textContent = targetLabel;
});