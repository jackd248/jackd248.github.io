console.log('Hej 👋');
const collectionEndpoint = "https://raw.githubusercontent.com/jackd248/clockwork-ai--collection/main/data/"

updateTime();
setInterval(() => {
    updateTime();
}, 60000);


function updateTime() {
    let time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    let hour = time.split(":")[0]
    readJsonFile(collectionEndpoint + time.split(":")[0] + "/" + time.replace(":", "") + ".json", function(text){
        let data = JSON.parse(text);
        let poem = data[Math.floor(Math.random() * data.length)];
        if (poem.split(" ").length > 25) {
            document.getElementById('preview').style.fontSize = '12px';
        } else {
            document.getElementById('preview').style.fontSize = '18px';
        }
        blink(poem);
    });
    document.getElementById('preview-clock').innerText = time;
    document.getElementById('clock').innerText = time;
}

function readJsonFile(file, callback) {
    const rawFile = new XMLHttpRequest();

    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === XMLHttpRequest.DONE && rawFile.status === 200) {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

function blink(text) {
    document.getElementById('preview').classList.add('refresh');
    setTimeout(() => {
        document.getElementById('preview').innerText = text;
    }, 500);
    setTimeout(() => {
        document.getElementById('preview').classList.remove('refresh');
    }, 1000);
}