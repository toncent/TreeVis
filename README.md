# TreeVis
 - Funktionen bisher
  - Ein zufälliger Baum wird generiert
  - Der Wurzelknoten und seine Kinder werden als svg gezeichnet
  - Durch antippen/-klicken der Knoten kann durch den Baum navigiert werden
  	- klicken auf eines der Kinder macht es zur neuen Wurzel und zeigt dessen Kinder an
  	- klicken auf die Wurzel zeigt wieder die vorherige Wurzel und ihre Kinder an
  - Die Beschriftung der Knoten wird aus dem data-Objekt des jeweiligen Knotens ausgelesen
  	- es wird zwischen Kurz- und Langform des Textes unterschieden
  	- knoten die nicht den ganzen text anzeigen können mit einem klick/touch ausgeklappt werden

# Designentscheidungen
 - (30/08/2016) Nachdem ich anfangs mit einem Canvas gearbeitet habe wechsle ich nun dazu den Baum durch ein SVG-Element anzuzeigen. Ich glaube, dass sich damit Animationen leichter realisieren lassen und dass nur wenige Knoten auf einmal auf dem Bildschirm zu sehen sein werden, wodurch der Performance Nachteil gegenüber einem Canvas nicht ins Gewicht fällt

 - (28.9.2016) Zoom und Drag Events auf dem großen Haupt-Baum werden ignoriert, weil sie keine Erleichterung in der Benutzung bewirken, sondern eher das Gegenteil. Meist wird der Baum nur verschoben, wenn man eigentlich einen Knoten antippen wollte und Zoomen ist überflüssig, weil die Knoten von Anfang an groß genug dargestellt werden.

 - (07.11.2016) Knoten erhalten ein left-objekt, in dem relevante daten für die anzeige auf der linken seite gespeichert werden.

 - (09.11.2016) Knoten auf der rechten Seite haben eine konstante Größe und überlappender Text wird abgeschnitten. Kompletter Text kann dann auf der rechten Seite eingesehen werden

 - (21.11.2016) Der aktuelle Wurzelknoten wird auf der linken Seite immer so groß dargestellt, dass sein gesamter Text angezeigt werden kann, während bei allen anderen Knoten zu langer Text gekürzt wird.


