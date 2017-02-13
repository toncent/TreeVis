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
      *  Rechte Seite: 90% der Breite des Kreises, aber maximal 1,3em
      *  Linke Seite: TODO

 * text wrapping (wrapText())
    *  der ausführliche Text, der in den Knoten auf der linken Seite angezeigt wird passt meist nicht auf eine Zeile, bzw. wäre dann unlesbar. Daher muss entschieden werden, an welchen Stellen Zeilenumbrüche stattfinden sollen
    *  der Text wird daher in seine einzelnen Worte aufgeteilt und es wird ein Wort nach dem anderen in die erste Zeile geschrieben, bis die Länge der Zeile die Maximallänge überschreitet
    *  wurde die maxmiale Zeilenlänge überschritten, dann wird das letzte Wort wieder gelöscht und zurück in die Wortliste geschrieben (Zeile kann jetzt nicht mehr zu lang sein)
    *  sind noch Wörter übrig, dann wird eine neue Zeile erstellt und der Vorgang wiederholt, bis alle Wörter eingefügt wurden

# Designentscheidungen
 * (30/08/2016) Nachdem ich anfangs mit einem Canvas gearbeitet habe wechsle ich nun dazu den Baum durch ein SVG-Element anzuzeigen. Ich glaube, dass sich damit Animationen leichter realisieren lassen und dass nur wenige Knoten auf einmal auf dem Bildschirm zu sehen sein werden, wodurch der Performance Nachteil gegenüber einem Canvas nicht ins Gewicht fällt

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

# Fragen an Ärzte
 * Ist es besser auf der Linken seite das neueste ganz oben anzuzeigen oder es von oben nach unten anzuordnen und das neueste in die Mitte des Bildschirms zu scrollen

# Stuff
 * Testen auf Telefon: (treeVis.html) wo platziert man den leftcontainer/rightcontainer anzeigen button am besten?

#Quellen
 * w3css
 * d3
 * getCookie und setCookie in cookies.js kopiert von http://www.w3schools.com/js/js_cookies.asp

#TODO
 * Nachladen von Knoten, wenn Ende erreicht wird
 * Senden von eingetragenen Ergebnissen
 * Text size für Überschriften auf der linken Seite

#Generelle Fragen
 * müssen Quellenangaben gemacht werden für functions, die durch Internetbeispiele inspiriert sind (text wrapping, text size)?