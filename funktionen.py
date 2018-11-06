# -*- coding: utf-8 -*-

from flask_socketio import emit
from Server import spiel, spielbareHauser
# Funktion um eine Nachricht an Clients zu senden

# Funktion um den Status aller Spieler upzudaten
def updateStatusAlle(status):
    global spiel
    for haus in spielbareHauser:
        spiel['Spieler'][haus]['Status'] = status

# Funktion die einen Timer erstellt der dann an die Spieler gesendet werden kann