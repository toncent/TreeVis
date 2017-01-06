# TreeVis 

# Designentscheidungen
 - (30/08/2016) Nachdem ich anfangs mit einem Canvas gearbeitet habe wechsle ich nun dazu den Baum durch ein SVG-Element anzuzeigen. Ich glaube, dass sich damit Animationen leichter realisieren lassen und dass nur wenige Knoten auf einmal auf dem Bildschirm zu sehen sein werden, wodurch der Performance Nachteil gegenüber einem Canvas nicht ins Gewicht fällt

 - (28.9.2016) Zoom und Drag Events auf dem großen Haupt-Baum werden ignoriert, weil sie keine Erleichterung in der Benutzung bewirken, sondern eher das Gegenteil. Meist wird der Baum nur verschoben, wenn man eigentlich einen Knoten antippen wollte und Zoomen ist überflüssig, weil die Knoten von Anfang an groß genug dargestellt werden.

 - (07.11.2016) Knoten erhalten ein left-objekt, in dem relevante daten für die anzeige auf der linken seite gespeichert werden.

 - (09.11.2016) Knoten auf der rechten Seite haben eine konstante Größe und überlappender Text wird abgeschnitten. Kompletter Text kann dann auf der linken Seite eingesehen werden

 - (21.11.2016) Der aktuelle Wurzelknoten wird auf der linken Seite immer so groß dargestellt, dass sein gesamter Text angezeigt werden kann, während bei allen anderen Knoten zu langer Text gekürzt wird.

 - (29.11.2016) Alle Knoten werden auf der linken Seite so groß dargestellt, dass ihr gesamter Text angezeigt werden kann. Wenn nicht mehr genug Knoten auf den Bildschirm passen kann gescrollt werden. Die Anwendung soll dadurch weniger überladen mit Funktionen werden.

 - (06.12.2016) Knoten rechts werden als Kreise angezeigt und beinhalten nur den Namen des Knotens.

 # Fragen an Ärzte
 - Ist es besser auf der Linken seite das neueste ganz oben anzuzeigen oder es von oben nach unten anzuordnen und das neueste in die Mitte des Bildschirms zu scrollen

 #Quellen
 - getCookie function in patients.js kopiert von http://www.w3schools.com/js/js_cookies.asp
