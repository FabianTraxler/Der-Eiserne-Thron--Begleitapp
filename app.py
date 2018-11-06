# -*- coding: utf-8 -*-

# time is used to get the current time
import time
from game import Game
from socket import GoT_Socket
# die selbst defineirten Funktionen importieren
from funktionen import *


if __name__ == '__main__':
    # Soketverbing starten auf Port 9191 
    socket = GoT_Socket('9191')
    # Spielvariante festlegen
    spielvariante = ''
    while spielvariante not in ['normal','mission']:
        spielvariante = input('Welche Spielvariante wird gespielt? (normal / mission) >>> ').lower()
    # Spieleranzhal festlegen -- in Zukunft selbes wie Spielvariante
    spielerAnzahl = ''
    while spielerAnzahl not in spiel['Spiel_Config']['spielbareHauser'][spielvariante]:
        spielerAnzahl = input('Wie viele Spieler? >>> ')
    game1 = Game('normal','2', socket)