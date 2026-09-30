/*
 * Sternenpfötchen – Welten, Level, Story & Belohnungen.
 * Legende: # Hecke  . Wiese  ~ Wasser  _ Eis  o Nest  ^ Pilz-Schalter  | Holztor
 *          @ Luma  & Nox  $ Sternchen  * Sternchen im Nest  b Stein  (Leerzeichen = Nichts)
 * par = Mindestzahl an Zügen (per Solver ermittelt, prüfen mit: node tools/verify.js).
 */
(function (root) {
  'use strict';
  const lv = (name, par, map, tip) => ({ name, par, map, tip });

  const worlds = [
    {
      id: 'moos',
      name: 'Moosgarten',
      theme: 'moos',
      friend: 'frieda',
      tagline: 'Sternchen schieben – ganz in Ruhe',
      color1: '#eaf8d8',
      color2: '#c9eab0',
      constellation: { name: 'Das Mondkätzchen', pts: [[0.18,0.1],[0.34,0.38],[0.5,0.32],[0.66,0.38],[0.82,0.1],[0.86,0.62],[0.5,0.9],[0.14,0.62]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]] },
      intro: [
        ['frieda', 'Oh! Ein Mondkätzchen! Ich bin Frieda. Ich bin langsam, aber ich sehe alles.'],
        ['frieda', 'Die Sternchen sind überall ins Moos gepurzelt. Schieb sie in ihre Nester, dann schweben sie heim.'],
        ['luma', 'Das klingt einfach!'],
        ['frieda', 'Hihi. Warte ab. Und denk dran: Nichts hier ist eilig.']
      ],
      outro: [
        ['frieda', 'Schau mal nach oben! Da leuchtet ein Sternbild – ein kleines Kätzchen, genau wie du!'],
        ['luma', 'Danke, Frieda! Hinter dem Moos glitzert Wasser …'],
        ['frieda', 'Der Seerosenteich. Grüß mir Fridolin! Und … er erzählt gern Witze. Schlechte.']
      ],
      levels: [
        lv('Erste Schritte', 3, [
          '  #####',
          '###...#',
          '#@.$.o#',
          '###...#',
          '  #####'
        ], [
          ['frieda', 'Wische übers Spielfeld, tippe neben Luma oder nutze die Pfeiltasten. Läufst du gegen ein Sternchen, schiebst du es vor dir her.'],
          ['frieda', 'Bring das Sternchen in sein Nest!']
        ]),
        lv('Um die Ecke', 6, [
          '######',
          '#@...#',
          '#.$..#',
          '#....#',
          '###o.#',
          '  ####'
        ], [
          ['frieda', 'Sternchen lassen sich nur schieben, nicht ziehen. Stell dich also immer auf die andere Seite.']
        ]),
        lv('Moospolster', 9, [
          '#####',
          '#..o###',
          '#.$...#',
          '#..@..#',
          '#..#$##',
          '#..#o#',
          '######'
        ], [
          ['frieda', 'Psst … ein Sternchen in einer Ecke kommt nie wieder heraus. Aber keine Sorge: Mit ↶ nimmst du jeden Zug zurück.']
        ]),
        lv('Kleeblattweg', 18, [
          '  ####',
          '  #..###',
          '###.@..#',
          '#o.##..#',
          '#.$..#.#',
          '#.o.$..#',
          '########'
        ], [
          ['frieda', 'Für drei Sterne ★★★ brauchst du den kürzesten Weg. Die Zahl oben rechts verrät dir, wie viele Züge das sind.']
        ]),
        lv('Schneckenhaus', 19, [
          '#####',
          '#@.o###',
          '#.#.$.#',
          '#..$..#',
          '###...#',
          '  #..o#',
          '  #####'
        ]),
        lv('Gänseblümchen', 29, [
          '######',
          '#....#',
          '#.$$.#',
          '#..#o#',
          '#..#.#',
          '##@.o#',
          ' #####'
        ]),
        lv('Farnversteck', 29, [
          '  #####',
          '###o..#',
          '#..#..#',
          '#.$$$.#',
          '#..#@.#',
          '#...oo#',
          '#######'
        ]),
        lv('Friedas Rätsel', 30, [
          '######',
          '#.oo.#',
          '#..#$##',
          '#...o.#',
          '#.$$..#',
          '#@....#',
          '#######'
        ])
      ]
    },
    {
      id: 'teich',
      name: 'Seerosenteich',
      theme: 'teich',
      friend: 'fridolin',
      tagline: 'Steine ins Wasser – Trittsteine bauen',
      color1: '#e2f6f3',
      color2: '#b7e4dc',
      constellation: { name: 'Der Froschkönig', pts: [[0.5,0.08],[0.3,0.3],[0.7,0.3],[0.12,0.55],[0.5,0.6],[0.88,0.55],[0.25,0.9],[0.75,0.9]], edges: [[1,0],[0,2],[1,3],[2,5],[3,4],[4,5],[3,6],[5,7]] },
      intro: [
        ['fridolin', 'Quak! Du willst übers Wasser? Kätzchen mögen doch kein nasses Fell!'],
        ['luma', 'Stimmt … aber die Sternchen sind da drüben!'],
        ['fridolin', 'Kein Problem. Schieb einen Stein ins Wasser – plopp! – und du hast einen Trittstein.'],
        ['fridolin', 'Was sagt ein Frosch, wenn er ein Sternchen sieht? … Quaaak-tastisch! Hehe.']
      ],
      outro: [
        ['fridolin', 'Da oben – ein Frosch mit Krone! Das muss ich sein. Quak!'],
        ['fridolin', 'Weiter hinten wird es frostig. Pass auf, dass du nicht ausrutschst!']
      ],
      levels: [
        lv('Plitsch, Platsch', 7, [
          ' #######',
          '##..~..#',
          '#@.b~$.#',
          '##..~.o#',
          ' #######'
        ], [
          ['fridolin', 'Schieb den Stein ins Wasser – plopp! – und schon ist da ein Trittstein.'],
          ['fridolin', 'Sternchen schwimmen übrigens nicht. Die lassen sich nicht ins Wasser schieben.']
        ]),
        lv('Seerosenbucht', 11, [
          '#######',
          '#..~..#',
          '#..~#$#',
          '#@b~.o#',
          '#..#..#',
          '####..#',
          '   ####'
        ], [
          ['fridolin', 'Steine sind kostbar hier am Teich. Überleg gut, welchen du wo versenkst!']
        ]),
        lv('Froschkonzert', 13, [
          '#######',
          '#..##b#',
          '#..~..#',
          '#..~$.#',
          '#@b~b.#',
          '#..~..#',
          '#..~.o#',
          '#######'
        ]),
        lv('Libellenpfad', 22, [
          ' ######',
          ' #.o$.#',
          '##~##~#',
          '#..ob.#',
          '#b.#$@#',
          '#.....#',
          '#######'
        ]),
        lv('Schilfinsel', 26, [
          ' ######',
          '##@...#',
          '#~.$o.#',
          '#.b##b#',
          '#..~$.#',
          '#..o~.#',
          '#######'
        ]),
        lv('Kaulquappenkreis', 28, [
          '  #####',
          '###o..##',
          '#@~..~.#',
          '#.b.$~.#',
          '#.~.b.~#',
          '#....#b#',
          '########'
        ]),
        lv('Mondspiegelung', 29, [
          ' ######',
          ' #..~.#',
          '##.$$.#',
          '#..b.~#',
          '#~.@..#',
          '#.~.o~#',
          '#..o.##',
          '######'
        ]),
        lv('Fridolins Rätsel', 34, [
          '  #######',
          '###..o.o#',
          '#@..~...#',
          '#..b.#.##',
          '#..$$...#',
          '#~.....~#',
          '#########'
        ])
      ]
    },
    {
      id: 'frost',
      name: 'Frostwiese',
      theme: 'frost',
      friend: 'flocke',
      tagline: 'Rutschiges Eis – wo bleibt alles stehen?',
      color1: '#f1f8fd',
      color2: '#cfe5f6',
      constellation: { name: 'Die Schneeflocke', pts: [[0.5,0.5],[0.5,0.06],[0.88,0.28],[0.88,0.72],[0.5,0.94],[0.12,0.72],[0.12,0.28],[0.5,0.26]], edges: [[0,7],[7,1],[0,2],[0,3],[0,4],[0,5],[0,6]] },
      intro: [
        ['flocke', 'Huiii! Vorsicht, Eis! Wer darauf läuft, rutscht, bis er irgendwo anstößt.'],
        ['flocke', 'Auch Sternchen rutschen. Das ist lustig … aber knifflig!'],
        ['luma', 'Dann muss ich mir genau überlegen, wo alles stehen bleibt.'],
        ['flocke', 'Genau! Und wenn dir kalt wird: Mein Schal ist dein Schal.']
      ],
      outro: [
        ['flocke', 'Die Schneeflocke leuchtet! Sie sieht aus, als würde sie tanzen.'],
        ['flocke', 'Im Pilzwald wohnt Hilde. Sie ist sehr klug. Und sehr stachelig.']
      ],
      levels: [
        lv('Rutschpartie', 5, [
          '#########',
          '#@$____o#',
          '#.______#',
          '#.$____o#',
          '#########'
        ], [
          ['flocke', 'Huiii! Auf dem Eis rutscht alles, bis es gegen etwas stößt – Sternchen und du auch!']
        ]),
        lv('Glitzerfrost', 14, [
          '#######',
          '#.____#',
          '#.##__#',
          '#.__$##',
          '##.___#',
          ' #.o.@#',
          ' ######'
        ], [
          ['flocke', 'Ein Hindernis zum Anhalten ist Gold wert. Manchmal ist das ein anderes Sternchen … oder du selbst!']
        ]),
        lv('Eiszapfenweg', 18, [
          ' ######',
          '##_.__#',
          '#__.__#',
          '#@__#_#',
          '#.#_$.#',
          '#.__o.#',
          '#######'
        ]),
        lv('Schneeflöckchen', 16, [
          '#######',
          '#..#..#',
          '#..@.o#',
          '#o.___#',
          '#.$$__#',
          '#___###',
          '#####'
        ]),
        lv('Pirouette', 30, [
          '######',
          '#o...#',
          '#.#$$##',
          '#o@___#',
          '##..#.#',
          ' #....#',
          ' ######'
        ]),
        lv('Kaltes Näschen', 26, [
          '#####',
          '#___##',
          '#_#__#',
          '#____##',
          '#o@$#o#',
          '#.$...#',
          '#o..$.#',
          '#######'
        ]),
        lv('Polarlicht', 36, [
          '  ######',
          '  #....#',
          '###$o.o#',
          '#...__.#',
          '#..@__$#',
          '#o.$__.#',
          '########'
        ]),
        lv('Flockes Rätsel', 44, [
          ' ########',
          ' #.___..#',
          '##$___..#',
          '#.._____#',
          '#..$.#o.#',
          '#o#.$o.##',
          '###...@#',
          '  ######'
        ])
      ]
    },
    {
      id: 'pilz',
      name: 'Pilzwald',
      theme: 'pilz',
      friend: 'hilde',
      tagline: 'Pilz-Schalter öffnen Holztore',
      color1: '#f6f0e0',
      color2: '#e3d5b4',
      constellation: { name: 'Der Glückspilz', pts: [[0.1,0.5],[0.3,0.16],[0.7,0.16],[0.9,0.5],[0.38,0.5],[0.62,0.5],[0.38,0.9],[0.62,0.9]], edges: [[0,1],[1,2],[2,3],[3,5],[5,4],[4,0],[4,6],[6,7],[7,5]] },
      intro: [
        ['hilde', 'Guten Abend, Kleines. Siehst du die Holztore? Die öffnen sich nur, solange ein Pilz gedrückt wird.'],
        ['hilde', 'Stell dich drauf – oder schieb etwas Schweres darauf. Ein Stein, ein Sternchen …'],
        ['luma', 'Aber wenn ich wieder heruntergehe, ist das Tor zu?'],
        ['hilde', 'Ganz genau. Da hilft nur Köpfchen. Und davon hast du eine Menge, das sehe ich.']
      ],
      outro: [
        ['hilde', 'Der Glückspilz strahlt am Himmel. Du bist fast am Ziel.'],
        ['hilde', 'Die letzten Sternchen sind hoch in die Wolken geflogen. Dort … wartet jemand auf dich.']
      ],
      levels: [
        lv('Pilz-Zauber', 6, [
          '#######',
          '#@.b.^#',
          '###|###',
          '#..$..#',
          '#..o..#',
          '#######'
        ], [
          ['hilde', 'Die Holztore öffnen sich, solange etwas auf einem Pilz steht. Ein Stein ist schön schwer!']
        ]),
        lv('Holztor', 12, [
          '  ####',
          '  #..#',
          '  #@^#',
          ' ###|##',
          '##..o.#',
          '#.....#',
          '#..$..#',
          '#...^.#',
          '#######'
        ], [
          ['hilde', 'Gehst du vom Pilz herunter, schließt sich das Tor wieder. Außer, es steht gerade jemand mittendrin.']
        ]),
        lv('Moosiger Pfad', 16, [
          '#######',
          '#.b..o#',
          '#...$##',
          '#....#',
          '###|##',
          '##..@##',
          '#.^^b.#',
          '#.....#',
          '#######'
        ]),
        lv('Fliegenpilzring', 20, [
          ' ######',
          ' #o#..#',
          '##@#..#',
          '#.$|..#',
          '#..#$.#',
          '#.^#^.#',
          '#..#o.#',
          '#######'
        ]),
        lv('Eulenruf', 24, [
          '   ####',
          '   #..#',
          '####.b#',
          '#o.#..#',
          '#..##^#',
          '#$.|@.#',
          '#..#..#',
          '#..#..#',
          '#######'
        ]),
        lv('Wurzelwerk', 32, [
          '########',
          '#...#.o#',
          '#.__..$#',
          '######|#',
          '#o@.#._#',
          '#.$.#..#',
          '##....##',
          '#...^..#',
          '#....^.#',
          '########'
        ]),
        lv('Laternenschein', 34, [
          '   ####',
          '   #.o#',
          '####b^#',
          '#..|$.#',
          '#..#o$#',
          '#b.#..#',
          '##.#..#',
          '#..|..#',
          '#..#.@#',
          '#######'
        ]),
        lv('Hildes Rätsel', 39, [
          ' ########',
          '##^.#o..#',
          '#b$.#.b.#',
          '#...#..@#',
          '#...#...#',
          '#...|..^#',
          '#.$o#..##',
          '########'
        ])
      ]
    },
    {
      id: 'wolken',
      name: 'Wolkenhöhe',
      theme: 'wolken',
      friend: 'nox',
      tagline: 'Nox spiegelt jeden deiner Schritte',
      color1: '#f6efff',
      color2: '#dccdf7',
      constellation: { name: 'Das Herz', pts: [[0.5,0.32],[0.3,0.1],[0.08,0.26],[0.14,0.54],[0.5,0.92],[0.86,0.54],[0.92,0.26],[0.7,0.1]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]] },
      intro: [
        ['nox', 'Hallo, Luma. Ich bin Nox – dein Traumschatten.'],
        ['luma', 'Du siehst aus wie ich! Nur … andersherum.'],
        ['nox', 'Hier oben bewege ich mich wie dein Spiegelbild. Links ist für mich rechts.'],
        ['nox', 'Allein komme ich nicht zu den Sternchen. Aber zusammen …?'],
        ['luma', '… schaffen wir das!']
      ],
      outro: [
        ['nox', 'Das war das letzte Sternchen. Danke, dass du mich mitgenommen hast.'],
        ['luma', 'Ohne dich hätte ich das nie geschafft, Nox.']
      ],
      levels: [
        lv('Spiegelbild', 3, [
          '############',
          '#o.$.@&.$.o#',
          '############'
        ], [
          ['nox', 'Ich bewege mich wie dein Spiegelbild: Gehst du nach links, gehe ich nach rechts.'],
          ['nox', 'Hoch und runter laufen wir gleich. Und ich kann auch Sternchen schieben!']
        ]),
        lv('Wolkentanz', 7, [
          '##########',
          '#o.$.@&..#',
          '#........#',
          '#.....$.o#',
          '##########'
        ], [
          ['nox', 'Wenn mir etwas im Weg steht, bleibe ich einfach stehen. Das kannst du nutzen, um uns neu auszurichten!']
        ]),
        lv('Zuckerwatte', 13, [
          '#######',
          '#&.#..#',
          '##..@.#',
          ' ##$o.#',
          '  #...#',
          '  #####'
        ]),
        lv('Regenbogenbrücke', 12, [
          '########',
          '#o...@.#',
          '#$.....#',
          '#&#$.#.#',
          '###.o..#',
          '  ######'
        ]),
        lv('Traumschatten', 15, [
          '######',
          '#.&..#',
          '#...$##',
          '#..o$o#',
          '#..@..#',
          '#######'
        ]),
        lv('Himmelsleiter', 17, [
          '######',
          '#....#',
          '#..$$##',
          '#.....#',
          '#.#...#',
          '#..@..#',
          '#o#&o.#',
          '#######'
        ]),
        lv('Mondsichel', 21, [
          '#########',
          '#...@...#',
          '#.#....o#',
          '#&......#',
          '#.$...$.#',
          '#..o#####',
          '#####'
        ]),
        lv('Zusammen nach Hause', 31, [
          '#######',
          '#...#&#',
          '#..$$@#',
          '#.#...#',
          '#.....#',
          '##....#',
          ' #o.o.#',
          ' ######'
        ])
      ]
    }
  ];

  const data = {
    worlds,
    "unlockNeed": 6,
    "speakers": {
      "luma": {
        "name": "Luma"
      },
      "mond": {
        "name": "Mama Mond"
      },
      "frieda": {
        "name": "Frieda Schnecke"
      },
      "fridolin": {
        "name": "Fridolin Frosch"
      },
      "flocke": {
        "name": "Flocke"
      },
      "hilde": {
        "name": "Hilde Igel"
      },
      "nox": {
        "name": "Nox"
      },
      "stern": {
        "name": "Sternchen"
      },
      "erzaehler": {
        "name": ""
      }
    },
    "prolog": [
      [
        "erzaehler",
        "Hoch über den Wolken, auf einem runden, warmen Mond, wohnt ein kleines Kätzchen namens Luma."
      ],
      [
        "mond",
        "Luma, mein Mondkätzchen … Zeit zum Schlafen."
      ],
      [
        "luma",
        "Nur noch ein bisschen mit meinem Sternenknäuel spielen, Mama Mond!"
      ],
      [
        "erzaehler",
        "Hops! Das Knäuel rollt über den Mondrand – und zieht alle kleinen Sternchen mit sich hinab in den Traumgarten."
      ],
      [
        "mond",
        "Oh je! Die Sternchen sind noch so klein. Allein finden sie nicht nach Hause."
      ],
      [
        "luma",
        "Das war meine Schuld. Ich hole sie zurück! Versprochen!"
      ],
      [
        "mond",
        "Schieb sie sanft in ihre Sternennester. Von dort schweben sie wieder zu mir herauf."
      ],
      [
        "mond",
        "Aber denk gut nach, mein Schatz. Sternchen lassen sich nur schieben – nie ziehen."
      ]
    ],
    "finale": [
      [
        "mond",
        "Luma! Der Himmel ist wieder voller Lichter!"
      ],
      [
        "luma",
        "Mama Mond! Alle Sternchen sind zu Hause. Und schau, wen ich mitgebracht habe!"
      ],
      [
        "nox",
        "Hallo … ich bin Nox. Darf ich bleiben?"
      ],
      [
        "mond",
        "Natürlich. Jeder Traum braucht einen Schatten, der ihn behütet."
      ],
      [
        "stern",
        "Danke, Luma! Danke, Nox! ✨"
      ],
      [
        "erzaehler",
        "Und wenn du nachts zu den Sternen schaust und einer blinzelt – dann winken dir Luma und Nox zu."
      ],
      [
        "erzaehler",
        "Ende ♥  … aber für jedes perfekte Level warten noch Sterne auf dich!"
      ]
    ],
    "wardrobe": {
      "hat": [
        {
          "id": null,
          "name": "Nichts"
        },
        {
          "id": "schleife",
          "name": "Schleife",
          "stars": 3
        },
        {
          "id": "blumen",
          "name": "Blumenkranz",
          "stars": 12
        },
        {
          "id": "muetze",
          "name": "Bommelmütze",
          "stars": 30
        },
        {
          "id": "kopfhoerer",
          "name": "Kopfhörer",
          "stars": 50
        },
        {
          "id": "zauberhut",
          "name": "Zauberhut",
          "stars": 70
        },
        {
          "id": "krone",
          "name": "Sternenkrone",
          "stars": 110
        }
      ],
      "neck": [
        {
          "id": null,
          "name": "Nichts"
        },
        {
          "id": "glocke",
          "name": "Glöckchen",
          "stars": 20
        },
        {
          "id": "schal",
          "name": "Flockes Schal",
          "stars": 40
        },
        {
          "id": "umhang",
          "name": "Sternenumhang",
          "stars": 90
        }
      ],
      "fur": [
        {
          "id": "creme",
          "name": "Vanille"
        },
        {
          "id": "grau",
          "name": "Nebelgrau",
          "world": 0
        },
        {
          "id": "minze",
          "name": "Minze",
          "world": 1
        },
        {
          "id": "pfirsich",
          "name": "Pfirsich",
          "world": 2
        },
        {
          "id": "lavendel",
          "name": "Lavendel",
          "world": 3
        },
        {
          "id": "nacht",
          "name": "Mitternacht",
          "world": 4
        }
      ]
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.SPData = data;
})(typeof self !== 'undefined' ? self : this);
