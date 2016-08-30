# TreeVis
 - Funktionen bisher
  - script.js generiert einen zufälligen Baum und zeichnet ihn auf ein canvas.
  - Es kann rein und rausgezoomt werden

# Designentscheidungen
 - (30/08/2016) Nachdem ich anfangs mit einem Canvas gearbeitet habe wechsle ich nun dazu den Baum durch ein SVG-Element anzuzeigen. Ich glaube, dass sich damit Animationen leichter realisieren lassen und dass nur wenige Knoten auf einmal auf dem bildschirm zu sehen sein werden, wodurch der Performance Nachteil gegenüber einem Canvas nicht ins Gewicht fällt
