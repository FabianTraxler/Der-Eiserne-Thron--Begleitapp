# -*- coding: utf-8 -*-

# time is used to get the current time
import time
from game import Game
from GoT_socket import GoT_Socket



if __name__ == '__main__':
    # Soketverbing starten auf Port 9191 
    socket = GoT_Socket('9191')
    # Spielvariante festlegen
    game1 = Game('normal','2', socket)