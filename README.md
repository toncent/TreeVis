# TreeVis Funktionen
 * login.html
    *  Anmeldung mit Nutzername + Passwort
 * patients.html
    *  Auswahl eines Patienten
    *  Auswahl eines Entscheidungsbaums
      *  Wird ein Entscheidungsbaum, aber kein Patient ausgewählt, dann startet die Baumansicht ohne Patientendaten (könnte für Einarbeitung neuer Ärzte verwendet werden)
 * treeVis.html
    *  Anzeige ist Unterteilt in linke und rechte Seite
    *  Rechte Seite 
      *  Visualisiert aktuellen Entscheidungsbaum
      *  Zu sehen ist immer der zuletzt gewählte Knoten in der Mitte und dessen direkte Nachfolger drum herum
      *  Alle Knoten sind vereinfacht dargestellt (nur der Name, nicht die ausführliche Beschreibung)
      *  Durch Antippen der Knoten kann man durch den Baum navigieren
        *  Antippen des mittleren Knotens führt zurück zum vorherigen Knoten im aktuellen Pfad (auf der linken Seite zu sehen)
        *  Antippen eines der anderen Knoten macht diesen Knoten zum neuen mittleren Knoten und zeigt dessen Nachfolger an
        *  Durch gedrückt halten eines Knotens kann ein Menü aufgerufen werden, in dem sich ein Knoten als "Positiv", "Negativ" oder "Unbekannt" markieren lässt
          * Markierte Knoten werden farbig umrandet
        *  Alle Veränderungen des Baumes werden durch passende Animationen verständlicher gemacht (siehe Designentscheidungen)
    *  Linke Seite 
      *  Enthält eine Übersicht über den gewählten Pfad mit detailierter Ansicht der einzelnen Knoten (Überschrift und Beschreibung)
      *  Durch antippen der Knoten kann direkt zu dem jeweiligen Knoten auf der rechten Seite gesprungen werden
      *  Knoten sind Farbig umrandet wenn sie als "Positiv", "Negativ" oder "Unbekannt" markiert wurden
      *  Wenn auf der rechten Seite Schritte rückwärts gemacht werde, dann werden auf der linken Seite die Knoten, die sich nun nicht mehr im Pfad befinden ausgegraut.
        *  Die ausgegrauten Knoten verschwinden erst, wenn der Nutzer einen anderen Pfad einschlägt
        *  So kann der Nutzer Schritte zurück machen, falls er noch andere Möglichkeiten ansehen möchte, ist aber sofort wieder in der Lage zu seinem alten pfad zurückzuspringen
    *  Responsive Design
      *  Auf Kleineren Bildschirmen passt sich die Anzeige an, sodass nur noch die Visualisierung des Baumes zu sehen ist
      *  Die detailierte Übersicht kann durch antippen einer Schaltfläche ein- und ausgeklappt werden.

# Algorithmen
 * tree layout (calculateCoordinates())
    *  um die Positionen der Knoten auf dem Bildschirm festzulegen wird die tree() Funktion von d3 verwendet, die jedem Knoten generische Koordinaten zuweist
    *  die von d3 zugewiesenen Koordinaten werden dann als Polarkoordinaten interpretiert und abhängig von der Bildschirmgröße skaliert
      *  dabei wird sichergestellt, dass der aktuelle Wurzelknoten sich immer genau in der Mitte befindet
    *  es entsteht eine Kreisförmige Anordnung der Knoten

 * Berechnung von Textgrößen (calculateTextSize())
    *  Es soll vermieden werden, dass Überschriftstexte (Beschriftung der Kreise rechts und Überschrift der Rechtecke links) ihre beinhaltenden Elemente überschreiten. Dazu macht man sich die Tatsache zu Nutze, dass die Breite eines Textes proportional zu seiner Schriftgröße wächst
    *  Die Schriftgröße wird zunächst auf 1em gesetzt und es wird berechnet, wie breit der text ist
    *  jetzt kann die Breite des Textes mit der Breite des ihn umgebenden Elements verglichen werden und die Textbreite durch eine einfache skalierung der Textgröße auf das gewünschte Maß gebracht werden
      * Textgröße: 90% der Breite des Elements, aber maximal 1,3em

 * text wrapping (wrapText())
    *  der ausführliche Text, der in den Knoten auf der linken Seite angezeigt wird passt meist nicht auf eine Zeile, bzw. wäre dann unlesbar. Daher muss entschieden werden, an welchen Stellen Zeilenumbrüche stattfinden sollen
    *  der Text wird daher in seine einzelnen Worte aufgeteilt und es wird ein Wort nach dem anderen in die erste Zeile geschrieben, bis die Länge der Zeile die Maximallänge überschreitet
    *  wurde die maxmiale Zeilenlänge überschritten, dann wird das letzte Wort wieder gelöscht und zurück in die Wortliste geschrieben (Zeile kann jetzt nicht mehr zu lang sein)
    *  sind noch Wörter übrig, dann wird eine neue Zeile erstellt und der Vorgang wiederholt, bis alle Wörter eingefügt wurden

# Designentscheidungen
 * Einsatz von D3 zur Visualisierung der Daten
 
 * (30/08/2016) Nachdem ich anfangs mit einem Canvas gearbeitet habe wechsle ich nun dazu den Baum durch ein SVG-Element anzuzeigen. Ich glaube, dass sich damit Animationen leichter realisieren lassen und dass nur wenige Knoten auf einmal auf dem Bildschirm zu sehen sein werden, wodurch der Performance Nachteil gegenüber einem Canvas nicht ins Gewicht fällt
 
 * Kreisförmige Anordnung von Knoten mit hilfe von Polarkoordinaten.
 
 * (28.9.2016) Zoom und Drag Events auf dem großen Haupt-Baum werden ignoriert, weil sie keine Erleichterung in der Benutzung bewirken, sondern eher das Gegenteil. Meist wird der Baum nur verschoben, wenn man eigentlich einen Knoten antippen wollte und Zoomen ist überflüssig, weil die Knoten von Anfang an groß genug dargestellt werden.

 * (07.11.2016) Knoten erhalten ein left-objekt, in dem relevante daten für die anzeige auf der linken seite gespeichert werden.

 * (09.11.2016) Knoten auf der rechten Seite haben eine konstante Größe und überlappender Text wird abgeschnitten. Kompletter Text kann dann auf der linken Seite eingesehen werden

 * (21.11.2016) Der aktuelle Wurzelknoten wird auf der linken Seite immer so groß dargestellt, dass sein gesamter Text angezeigt werden kann, während bei allen anderen Knoten zu langer Text gekürzt wird.

 * (29.11.2016) Alle Knoten werden auf der linken Seite so groß dargestellt, dass ihr gesamter Text angezeigt werden kann. Wenn nicht mehr genug Knoten auf den Bildschirm passen kann gescrollt werden. Die Anwendung soll dadurch weniger überladen mit Funktionen werden.

 * (06.12.2016) Knoten rechts werden als Kreise angezeigt und beinhalten nur den Namen des Knotens.

 * (06.12.2016) PopUpMenu rechts wird als donutchart um den angetippten kreis angezeigt

 * (??.??.2016) Das Verständnis wie man durch den Baum navigiert soll durch den Einsatz von Animationen verbessert werden.
    *  Animationen sollen für den Nutzer intuitiv darstellen, was ein bestimmter input bewirkt
    *  Vorwärtsanimation: Alle Knoten außer der angetippte (und damit neue Mittelknoten) verschwinden -> der neue Mittelknoten bewegt sich in die Mitte -> Dessen Nachfolger fahren heraus
      *  Ziel: Nutzer soll intuitiv verstehen, dass er einen Schritt nach vorne gemacht hat
    *  Rückwärtsanimation: Äußere Knoten verschwinden -> angetippter mittlerer Knoten bewegt sich nach außen -> Vorgängerknoten und dessen andere Nachfolger erscheinen
      *  Ziel: Nutzer soll intuitiv verstehen, dass er einen Schritt zurück gemacht hat

# Fragebogen
* Overall, I am satisfied  with how easy it is to use this system.
* It is simple to use this system.
* I can effectively  complete my work using this system.
* I am able to complete my work quickly using this system.
* I am able to efficiently  complete my work using this system.
* I feel comfortable  using this system.
* It was easy to learn to use this system.
* I believe I became productive quickly using this system.
* The system gives error messages that clearly tell me how  to fix problems.
* Whenever I make a mistake using the system, I recover easily and quickly.
* The  information  (such  as  on-line  help,  on-screen  messages,  and  other
documentation) provided with this system  is clear.
* It is easy to find  the information  I need.
* The information  provided with the system  is easy to understand.
* The information  is effective  in helping me complete my work.
* The organization  of information  on the system screens is clear.

* Das Layout wirkt zu gedrängt. 
* Das Layout ist gut zu erfassen.
* Das Layout erscheint angenehm gegliedert. 
* Die Seite erscheint zu uneinheitlich.
* Auf der Seite passt alles zusammen.
* Die Seitengestaltung ist uninteressant. 
* Das Layout ist originell. 
* Die Gestaltung wirkt einfallslos. 
* Das Layout wirkt dynamisch. 
* Das Layout ist angenehm vielseitig. 
* Die farbliche Gesamtgestaltung wirkt attraktiv. 
* Die Farben passen nicht zueinander. 
* Der Farbeinsatz ist nicht gelungen.
* Die Farben haben eine angenehme Wirkung. 
* Das Layout ist professionell. 
* Das Layout ist nicht zeitgemäß. 
* Die Seite erscheint mit Sorgfalt gemacht. 
* Das Layout wirkt konzeptlos.


* Ich kann mir sehr gut vorstellen, das System regelmäßig zu nutzen.
* Ich empfinde das System als unnötig komplex.
* Ich empfinde das System als einfach zu nutzen.
* Ich denke, dass ich technischen Support brauchen würde, um das System zu nutzen.
* Ich finde, dass die verschiedenen Funktionen des Systems gut integriert sind.
* Ich finde, dass es im System zu viele Inkonsistenzen gibt.
* Ich kann mir vorstellen, dass die meisten Leute das System schnell zu beherrschen lernen.
* Ich empfinde die Bedienung als sehr umständlich.
* Ich habe mich bei der Nutzung des Systems sehr sicher gefühlt.
* Ich musste eine Menge Dinge lernen, bevor ich mit dem System arbeiten konnte.

Die Software...
* ist unkompliziert zu bedienen.
* bietet alle Funktionen, die anfallenden Aufgaben effizient zu bewältigen.
* bietet gute Möglichkeiten, sich häufig wiederholende Bearbeitungsvorgänge zu automatisieren.
* erfordert keine überflüssigen Eingaben.
* ist gut auf die Anforderungen der Arbeit zugeschnitten.
* bietet einen guten Überblick über ihr Funktionsangebot.
* verwendet gut verständliche Begriffe, Bezeichnungen, Abkürzungen oder Symbole in Masken und Menüs.
* liefert in zureichendem Masse Informationen darüber, welche Eingaben zulässig oder nötig sind.
* bietet auf Verlangen situationsspezifische Erklärungen, die konkret weiterhelfen.
* bietet von sich aus situationsspezifische Erklärungen, die konkret weiterhelfen.
* http://www.ergo-online.de/site.aspx?url=html/software/verfahren_zur_beurteilung_der/fragebogen_isonorm_online.htm

# Background
* Erklärung von Polarkoordinaten
* Übliche Begriffe bei Arbeit mit Bäumen/Graphen (Knoten, Wurzel, Kante ...)
* Begriffe Entscheidungsbaum einführen
* D3
* Umwandeln von Entscheidungsgraph in Baum

# Stuff
 * Testen auf Telefon: (treeVis.html) wo platziert man den leftcontainer/rightcontainer anzeigen button am besten?

#Quellen
 * w3css
 * d3
 * getCookie und setCookie in cookies.js kopiert von http://www.w3schools.com/js/js_cookies.asp

#TODO
 * Nachladen von Knoten, wenn Ende erreicht wird
 * Senden von eingetragenen Ergebnissen
 * Bild mit Vergleich zwischen kreisförmiger Anordnung von Knoten vs horizontal