# ✨ Sternenpfötchen – Lumas Reise durch den Traumgarten

Ein gemütliches Knobelspiel zum Wohlfühlen – aber mit Köpfchen.

**▶ Jetzt spielen: https://ratteos51.github.io/sternenpfoetchen/**

Das Mondkätzchen **Luma** hat beim Spielen alle kleinen Sternchen vom Himmel gestoßen.
Jetzt purzeln sie schläfrig durch den Traumgarten. Luma schiebt sie behutsam in ihre
Sternennester, damit sie zu Mama Mond zurückschweben können – und trifft unterwegs
Freunde, die ihr neue Kniffe beibringen.

## Spielprinzip

Rundenbasiertes Schiebe-Rätsel auf einem Raster (Sokoban-Familie), aber jede Welt
bringt eine neue Mechanik, die das Denken verändert:

| Welt | Freund | Mechanik |
|---|---|---|
| 1. Moosgarten | Frieda Schnecke | Sternchen schieben – nie ziehen. Ecken sind gefährlich. |
| 2. Seerosenteich | Fridolin Frosch | Steine ins Wasser schieben → Trittsteine. Sternchen schwimmen nicht. |
| 3. Frostwiese | Flocke | Eis: Luma **und** Sternchen rutschen, bis sie anstoßen. |
| 4. Pilzwald | Hilde Igel | Pilz-Schalter öffnen Holztore – nur solange etwas darauf steht. |
| 5. Wolkenhöhe | Nox | Traumschatten Nox läuft **spiegelverkehrt** mit (links ↔ rechts) und schiebt mit. |

**40 Level**, alle per Solver geprüft: Jedes ist lösbar, und die angezeigte Zielzahl (★★★) ist die
echte Mindestzahl an Zügen.

## Belohnungen

- **1–3 Sterne pro Level** – ★★★ für den kürzesten Weg.
- **Sternbilder**: Jedes gelöste Level entzündet einen Stern im Sternbild der Welt
  (Mondkätzchen, Froschkönig, Schneeflocke, Glückspilz, Herz).
- **Der Himmel füllt sich**: Auf dem Titelbildschirm leuchten mehr Sterne, je mehr Sternchen heimgekehrt sind.
- **Garderobe**: Mützen, Kronen, Schals & Umhang (für gesammelte Sterne) und Fellfarben (für abgeschlossene Welten).
- **Sternbuch** mit Statistik und allen Freunden.
- Story mit Prolog, Welt-Szenen und Finale.

## Wohlfühl-Komfort

- Unbegrenztes **Rückgängig** (↶) und Neustart – Rückgängig kostet keine Züge.
- **Pfötchen-Tipp** 🐾: Ein eingebauter Solver zeigt den nächsten sinnvollen Schritt
  (in dem Versuch gibt es dann höchstens ★★) und erkennt Sackgassen.
- Sanfte Warnung, wenn ein Sternchen in einer Ecke feststeckt.
- Spieluhr-Musik und Klänge, komplett synthetisiert (WebAudio), einzeln abschaltbar.
- Steuerung: Wischen, neben Luma tippen, Steuerkreuz oder Tastatur (Pfeile/WASD, **Z** zurück, **R** neu, **H** Tipp).
- Hoch- und Querformat, Handy, Tablet und Desktop. Fortschritt wird lokal gespeichert.

## Starten

Reines HTML/CSS/JavaScript, **kein Build-Schritt, keine Abhängigkeiten**.

- Einfach `index.html` im Browser öffnen, **oder**
- lokal ausliefern (nötig für Offline-Modus/Installation): `npm start` → http://localhost:8080

### Als App installieren (PWA)

Mit `manifest.webmanifest` und Service Worker (`sw.js`) ist das Spiel eine installierbare
Progressive Web App und läuft danach komplett offline. Auf HTTPS hosten (z. B. GitHub Pages,
Netlify), dann im Browser „Zum Startbildschirm hinzufügen“ bzw. „App installieren“.

> Nach Änderungen an Dateien in `sw.js` die `VERSION` erhöhen, damit Spieler das Update erhalten.

### Später als native App (App Store / Play Store)

Der Ordner ist direkt als Web-Inhalt für [Capacitor](https://capacitorjs.com/) geeignet:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Sternenpfötchen" de.example.sternenpfoetchen --web-dir .
npx cap add android   # bzw. ios
npx cap open android  # in Android Studio bauen
```

(Empfehlung: vorher Spieldateien nach `www/` kopieren und `--web-dir www` nutzen, damit
`node_modules` nicht mitgepackt wird.) Safe-Area-Ränder für Notch/Home-Indikator sind im CSS schon berücksichtigt.

## Projektaufbau

```
index.html            Oberfläche (alle Bildschirme)
css/style.css         Gestaltung inkl. Querformat & Safe-Areas
js/engine.js          Spielregeln, Züge, Sieg, Solver (Breitensuche) – DOM-frei, auch in Node nutzbar
js/levels.js          Welten, Level, Story-Texte, Sternbilder, Garderobe
js/sprites.js         Alle Figuren & Objekte, prozedural mit Canvas gezeichnet (keine Bilddateien)
js/render.js          Spielfeld-Renderer, Animationen, Partikel, Welt-Themes
js/audio.js           Synthetisierte Klänge & Spieluhr-Musik
js/main.js            Bildschirme, Eingabe, Fortschritt, Belohnungen, Story
tools/verify.js       Prüft alle Level (lösbar, par korrekt, Mechanik genutzt)
tools/generate.js     Level-Generator: erzeugt & bewertet Kandidaten je Welt
tools/make-icons.js   Rendert die App-Icons aus den Sprites (Playwright)
```

### Level bearbeiten

Level sind Textkarten in `js/levels.js`:

```
#  Hecke    .  Wiese     ~  Wasser    _  Eis     o  Nest
^  Pilz     |  Holztor   @  Luma      &  Nox     $  Sternchen
*  Sternchen im Nest     b  Stein     (Leerzeichen = Nichts)
```

Danach `npm run verify` – das prüft Lösbarkeit und Mechanik; mit `node tools/verify.js --write`
werden die par-Werte automatisch korrigiert.
Neue Kandidaten erzeugen: `node tools/generate.js <welt 1-5> [versuche] [seed]` → `tools/out/`.

## Lizenzen

Code, Grafik, Musik und Texte sind eigens für dieses Spiel erstellt.
Schrift: [Nunito](https://fonts.google.com/specimen/Nunito) (SIL Open Font License), lokal eingebunden in `fonts/`.
