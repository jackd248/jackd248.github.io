# Konzept: Quiz-Lernplattform (`homework/quiz`)

Erstes Set: **Afrika – Staaten & Hauptstädte**, Tastatureingabe, mobil optimiert,
im Stil von `homework/math`.

> Sprachhinweis: Dieses Konzept ist deutsch, weil der Lernstoff deutsch ist.
> Code, JSON-Keys und spätere README/Docs bleiben englisch (House Style).

---

## 1. Ziel & Scope

**In Scope (v1)**

- Ein datengetriebener Quiz-Runner, der ein JSON-Set lädt und abfragt
- Zwei Modi: Land → Hauptstadt, Hauptstadt → Land (+ gemischt)
- Freitexteingabe per Tastatur, tolerante Antwortprüfung
- Zusatzinfos (Fläche, Einwohner, Bev.dichte, Region) als Infokarte **nach** der Antwort
- Übersichtsseite, auf der später weitere Sets ohne Code-Änderung erscheinen

**Bewusst nicht in Scope (v1)**

- Kein Build-Step, kein Framework, kein Backend — plain HTML/CSS/JS wie bisher
- Kein Login, kein Sync — alles `localStorage`
- Kein Umbau des Mathe-Quiz (siehe §9)

---

## 2. Verortung im Repo

```
homework/
  index.html                  # Hub: Kacheln aller Quizze (inkl. math)
  math/                       # bleibt unverändert
  quiz/
    index.html                # Set- und Modusauswahl
    play.html                 # Runner (?set=africa&mode=capital)
    assets/
      script/
        engine.js             # Fragefolge, Prüfung, Leben, Timer
        normalize.js          # Antwortnormalisierung + Levenshtein
        progress.js           # localStorage: Highscore, Streak, Item-Statistik
        darkmode.js           # 1:1 aus math/
      style/style.css         # aus math/ übernommen + Ergänzungen
      media/
        africa.svg            # Kartenumriss, 29 KB, 51 Länderpfade (id="c-ng")
      data/
        sets.json             # Registry: [{id, title, icon, file}]
        africa.json           # erstes Set (liegt bereits vor)
  tools/
    build-africa-map.py       # regeneriert africa.svg aus Public-Domain-GeoJSON
```

Ein neues Quiz = **eine JSON-Datei + ein Eintrag in `sets.json`**. Das ist das
eigentliche Plattform-Versprechen; alles andere ist Beiwerk.

---

## 3. Datenmodell

`schemaVersion` als Vertrag, wie bei den anderen maschinenlesbaren Artefakten.

```json
{
  "schemaVersion": "1.0",
  "id": "africa",
  "title": "Afrika – Staaten & Hauptstädte",
  "icon": "🌍",
  "language": "de",
  "modes": [
    { "id": "capital", "label": "Land → Hauptstadt", "prompt": "name", "answer": "capital" },
    { "id": "country", "label": "Hauptstadt → Land", "prompt": "capital", "answer": "name" }
  ],
  "groups": [{ "id": "north", "label": "Nordafrika" }],
  "facts": [
    { "key": "areaKm2", "label": "Fläche", "unit": "km²" },
    { "key": "populationMio", "label": "Einwohner", "unit": "Mio" }
  ],
  "items": [
    {
      "id": "eg",
      "group": "north",
      "name": "Ägypten",
      "capital": "Kairo",
      "aliases": { "name": [], "capital": [] },
      "facts": { "areaKm2": 1002000, "populationMio": 120.1 }
    }
  ]
}
```

Wichtig: Ein Modus verweist nur auf **Feldnamen**. Damit trägt dasselbe Schema
später auch Vokabeln (`de`/`en`), Elemente (`symbol`/`element`) oder Flaggen —
ohne Engine-Änderung.

---

## 4. Antwortprüfung

Der kritische Teil bei Freitext. Reihenfolge:

1. **Normalisieren** (beide Seiten): trim, Kleinschreibung, Mehrfach-Leerzeichen,
   Unicode-NFD + Diakritika entfernen (`Côte` → `cote`), Apostrophe/Bindestriche/Punkte
   entfernen (`N'Djamena` → `ndjamena`), Umlaut-Faltung (`ä→a`, `ö→o`, `ü→u`, `ß→ss`) —
   damit `Aegypten`, `Ägypten` und `agypten` alle passen.
2. **Aliase** prüfen (`Elfenbeinküste` für Côte d'Ivoire, `Daressalam` für Dodoma,
   `DR Kongo` für Dem. Rep. Kongo).
3. **Tippfehler-Toleranz**: Levenshtein-Distanz ≤ 1 (ab 8 Zeichen ≤ 2) →
   Zustand *„fast richtig"* (gelb): korrekte Schreibweise wird angezeigt,
   kein Leben verloren, Eingabe darf korrigiert werden. Für ein Kind der
   Unterschied zwischen „lernt" und „gibt auf".
4. Sonst falsch → rot, Leben −1, Eingabe bleibt stehen.

---

## 5. Mobile-Details (die, die sonst wehtun)

- `inputmode="text"`, `autocomplete="off"`, `autocorrect="off"`,
  `autocapitalize="off"`, `spellcheck="false"` — iOS-Autokorrektur würde
  „Nouakchott" sonst zuverlässig zerstören.
- `enterkeyhint="go"`, Enter = Absenden (wie im Mathe-Quiz).
- Eingabefeld ≥ 16px, sonst zoomt iOS beim Fokus.
- Layout auf `100dvh` statt des `--vh`-Hacks — die Tastatur schiebt sonst das Layout.
- Fokus zwischen den Fragen **nicht** verlieren, damit die Tastatur offen bleibt.
- Antwort-Schriftgrad kleiner als im Mathe-Quiz: „Zentralafrikanische Republik"
  passt nicht in 20vh. Vorschlag: fluid via `clamp()`.

---

## 6. Lernlogik

- **Runde = 15 Items** (31 Länder am Stück sind mobil zu lang), 3 ❤️ Leben,
  Fortschrittsbalken aus Emojis, Zeitmessung, Flash grün/rot — alles wie gehabt.
- **Gewichtete Auswahl statt reinem Zufall**: pro Item werden Treffer/Fehler in
  `localStorage` gezählt; Items mit Fehlern kommen häufiger. Kein volles Leitner-System,
  nur ein Gewicht — der Lerneffekt pro Zeile Code ist hier am höchsten.
- Highscore und Daily Streak **pro Set und Modus** (Key: `quiz:<set>:<mode>`),
  sonst konkurrieren Afrika und Mathe um denselben Rekord.
- Optional: Filter auf eine Region, um gezielt „Ostafrika" zu üben.

---

## 7. Gamification

Empfehlung: **drei** Mechaniken, nicht zehn. Diese drei greifen ineinander und
kosten zusammen vielleicht 60 Zeilen.

### 7.1 Antwort-Streak (Combo)

Zähler der aufeinanderfolgenden richtigen Antworten, sichtbar neben den Leben.
Bei Falsch: zurück auf 0. Meilensteine bei 5 / 10 / 15 mit kurzem Flash und
Emoji-Wechsel (✨ → 🔥 → ⚡). Das ist die stärkste Einzelmechanik pro Zeile Code,
weil sie *während* der Runde spürbar ist, nicht erst am Ende.

Punkte, falls gewünscht, direkt daran hängen: `punkte += 10 + streak * 2`.
Der beste Streak einer Runde wandert in den Highscore — dann konkurriert man
nicht nur über Zeit.

### 7.2 Zeit — ja, aber als Rundenzeit

**Gesamtzeit pro Runde als persönlicher Rekord** (wie im Mathe-Quiz), plus die
Differenz zum letzten Lauf („12 s schneller als gestern"). Das motiviert, ohne
zu bestrafen.

**Kein Countdown pro Frage.** Der Unterschied zum Mathe-Quiz ist entscheidend:
dort tippt man zwei Ziffern, hier „Zentralafrikanische Republik" auf einer
Handytastatur. Ein Timer pro Frage misst dann Tippgeschwindigkeit, nicht Wissen —
und genau das frustriert beim Lernen.

Eine Falle, die aus §8 folgt: **Die Uhr muss stehen, solange die Infokarte mit
der Karte sichtbar ist.** Sonst lernt das Kind sofort, die Karte wegzuklicken,
ohne hinzusehen — und der lehrreichste Teil wird wegoptimiert. Gemessen wird nur
die Zeit zwischen Fragestellung und Antwort.

Optional: Bonuspunkte bei Antwort unter 10 s, aber nie Abzug bei langsamer Antwort.

### 7.3 Mastery-Karte

Der Langzeitmotivator, und er kostet fast nichts, weil `africa.svg` schon liegt:
Jedes Land, das man richtig beantwortet hat, wird auf einer Übersichtskarte
dauerhaft eingefärbt — hell nach dem ersten Treffer, kräftig nach dreimal richtig.
Ziel: **Afrika vollständig einfärben.**

Das ersetzt Badges, Level und Sammelkram durch ein einziges Bild, ist gleichzeitig
die Übersicht über die eigenen Lücken und nutzt exakt die Item-Statistik aus §6,
die für die gewichtete Auswahl ohnehin geführt wird.

### Ins Backlog, nicht in v1

Punkte-Multiplikatoren, Abzeichen, Wochenziele, Bestenliste zwischen Geräten.
Erst wenn die drei oben im echten Gebrauch tragen.

## 8. Ergebnisanzeige: Infokarte mit Verortung

Nach jeder beantworteten Frage: Region, Fläche, Einwohner, Bevölkerungsdichte —
**und eine kleine Karte**, die das Land hervorhebt und die Hauptstadt als Punkt setzt.
Belohnung statt Ablenkung: steht erst da, wenn geantwortet wurde.

Das ist der Teil, der aus dem Abfragen echtes Geografielernen macht — „Mali liegt
im Nordwesten, Bamako ganz im Süden davon" bleibt hängen, „Mali → Bamako" nicht.

**Umsetzung (fertig geprüft):**

- `africa.svg` (29 KB, inline eingebunden) enthält 51 Länderpfade mit `id="c-<iso2>"`.
  Die Item-IDs im Set *sind* die ISO-2-Codes — der Pfad wird ohne Zusatzfeld gefunden:
  `document.getElementById('c-' + item.id)`.
- Hervorhebung ist damit reines CSS: `#c-ml { fill: var(--accent) }`, alle anderen
  Länder bleiben grau. Kein Zeichnen, kein Canvas.
- Die Karte nutzt **plattkarten-Projektion**, die Konstanten stehen als
  `data-lng-min`, `data-lat-max`, `data-scale` im SVG. Der Hauptstadt-Punkt ist
  damit zwei Zeilen:

  ```js
  const x = (lng - lngMin) * scale;
  const y = (latMax - lat) * scale;
  ```
- Die Koordinaten (`coords.capital`, GeoNames-basiert) liegen im Set — alle 32 Einträge
  vollständig.
- Beim Moduswechsel Hauptstadt → Land funktioniert dieselbe Karte unverändert.

**Zwei geprüfte Sonderfälle:**

- *Mauritius* hat im vereinfachten Umriss keinen Pfad (zu klein). Lösung: Für Inseln
  ohne Pfad nur den Punkt setzen, mit Ring-Markierung statt Flächenhervorhebung.
- *Tripolis* und *Brazzaville* liegen bei einem Punkt-in-Polygon-Test knapp außerhalb
  ihres vereinfachten Landesumrisses (Küsten- bzw. Flussgrenzlage). Auf Handygröße
  sind das ein bis zwei Pixel. Falls es stört: höher aufgelöstes GeoJSON im
  Generator, sonst ignorieren.
- *Deutschland* (Referenzzeile) liegt nicht auf der Afrika-Karte — dort die Karte
  einfach weglassen.

Die Karte wird per Skript aus Public-Domain-Quellen erzeugt (`tools/build-africa-map.py`),
nicht händisch gepflegt. Damit ist ein Europa- oder Weltset später derselbe Aufruf mit
anderer Bounding Box.

### Zusatzinfos aus dem Arbeitsblatt

Fläche, Einwohner und Bevölkerungsdichte werden **unverändert vom Arbeitsblatt**
übernommen, inklusive der Inkonsistenzen — das Kind lernt für diese Tabelle.
Begründung und vollständige Prüfung im Anhang.

Bei drei Ländern gehört eine Fußnote in die Infokarte (Yamoussoukro/Abidjan,
Dodoma/Daressalam, Pretoria/Kapstadt/Bloemfontein) — siehe Anhang.

## 9. Was aus dem Mathe-Quiz übernommen wird — und was nicht

Übernehmen: `style.css` (Layout, Dark Mode, Flash-Animationen), `darkmode.js`,
Leben/Streak/Highscore-Muster, Emoji-Buttons, der gesamte Look.

**Nicht** übernehmen: Das Mathe-Quiz wird *nicht* auf die Engine umgestellt.
Es erzeugt Aufgaben algorithmisch, die Quiz-Sets holen sie aus Daten — das sind
zwei verschiedene Item-Quellen. Eine gemeinsame Abstraktion lohnt sich erst,
wenn ein drittes Quiz zeigt, was wirklich geteilt wird. Bis dahin: kopierte CSS
statt einem geteilten Framework. Das kostet ein paar doppelte Zeilen und spart
eine falsche Abstraktion.

---

## 10. Offene Entscheidungen

1. **Ort:** `homework/quiz/` oder eigener Top-Level-Ordner (`learn/`, `quiz/`)?
   `homework/` passt inhaltlich, ist aber schon vom Mathe-Quiz belegt.
2. **UI-Sprache:** Mathe-Quiz ist englisch, Afrika-Inhalt ist deutsch.
   Vorschlag: UI-Strings aus dem Set (`language: "de"`) ziehen.
3. **Rundenlänge** 15 fix, oder wählbar (10 / 20 / alle 31)?
4. **Tippfehler-Toleranz** an oder aus? (Vorschlag: an, aber ohne Punkte-Bonus)
5. **Deutschland als Referenzzeile** mitspielen lassen oder nur in der Infokarte zeigen?
6. **Karte immer sichtbar oder erst nach der Antwort?** Vorschlag: erst danach —
   sonst ist die Karte bei „Hauptstadt → Land" die halbe Lösung.

---

## 11. Backlog (spätere Sets & Modi)

- **Ranking-Modus** aus dem unteren Teil des Arbeitsblatts: größte Länder,
  bevölkerungsreichste, höchste/niedrigste Dichte — als „Was ist größer?"-Duell.
  Braucht kein neues Datenmaterial, nur einen zweiten Runner.
- Flaggen-Quiz (Emoji-Flaggen, kein Bild-Asset nötig)
- Karten-Modus (Land auf SVG-Karte antippen)
- Vokabel-Sets, Hauptstädte Europas, Bundesländer — alles dasselbe Schema

---

## 12. Umsetzungsschritte

1. `africa.json` einchecken (liegt vor, 31 Staaten + Deutschland)
2. `play.html` + `engine.js` als Single-Set-Runner, hartkodiert auf Afrika
3. Antwortnormalisierung + Aliase + Tippfehler-Toleranz
4. Infokarte mit Karte, Leben, Antwort-Streak, Rundenzeit, Highscore
5. Mastery-Karte (nutzt dieselbe SVG, dieselbe Item-Statistik)
6. Erst danach: `sets.json`, Übersichtsseite, Hub — wenn Schritt 1–4 sich im
   echten Einsatz bewährt haben

Schritt 2–4 sind ein Abend. Die Plattform entsteht in Schritt 6, nicht davor.

---

## Anhang: Datenprüfung

Gegen zwei unabhängige Referenzdatensätze geprüft (Ländermetadaten mit ISO-Codes,
GeoNames-Ortskoordinaten) plus eine dritte Bevölkerungsquelle mit Stand 2018.

| Prüfung | Ergebnis |
| --- | --- |
| Hauptstädte (32) | alle bestätigt |
| Flächenangaben (32) | alle im Rahmen der Quellenunterschiede; nur Kenia (−2,0 %) und Sudan (+2,5 %) weichen nennenswert ab — Land- vs. Gesamtfläche |
| Hauptstadt-Koordinaten (32) | vollständig, per Punkt-in-Polygon gegen die Landesgeometrie geprüft |
| Kartenpfade | 31 von 31 Staaten vorhanden, Mauritius fehlt (zu klein im vereinfachten Umriss) |
| Einwohner / Dichte | siehe unten |

**Die Dichte-Abweichungen sind erklärt.** Das Arbeitsblatt ist überwiegend auf
Stand ~2018: Bei 22 von 30 prüfbaren Zeilen ergibt `Dichte × Fläche` exakt die
Bevölkerung von 2018 — die Tabelle ist also in sich stimmig, nur alt.

Bei sechs Zeilen wurde die Einwohnerzahl später aktualisiert, **ohne die Dichte
neu zu berechnen**: Ägypten, Nigeria, Äthiopien, Tansania, Südafrika, Dem. Rep. Kongo.
Ruanda ist der umgekehrte Fall — dort ist die Dichte neu und die Einwohnerzahl alt.

**Empfehlung:** Die Zahlen des Arbeitsblatts **unverändert übernehmen**. Das Kind
lernt für diese Tabelle, und eine App, die andere Werte zeigt als das Blatt, stiftet
Verwirrung statt Klarheit. Die Infokarte kennzeichnet die Quelle („laut Arbeitsblatt,
Stand ~2018"). Wer es genauer will, blendet die berechnete Dichte zusätzlich ein —
das ist dann sogar ein hübscher Nebenlerneffekt.

**Drei Hauptstädte mit Feinheiten**, die in die Infokarte gehören, aber die Wertung
nicht verändern sollten:

- **Yamoussoukro** ist die offizielle Hauptstadt der Côte d'Ivoire, Regierungssitz ist Abidjan.
- **Dodoma** ist offizielle Hauptstadt Tansanias, Daressalam bleibt Wirtschaftszentrum
  und größte Stadt (steht so auch auf dem Blatt).
- **Pretoria** ist Südafrikas Regierungssitz; Kapstadt (Parlament) und Bloemfontein
  (Justiz) sind ebenfalls Hauptstädte. Nur Pretoria/Tshwane zählt als richtige Antwort,
  Kapstadt sollte als „auch richtig, aber gefragt ist der Regierungssitz" behandelt werden.
