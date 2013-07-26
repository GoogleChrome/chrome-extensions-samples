#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

# pylint: disable-msg=C6310

"""Channel Tic Tac Toe

This module demonstrates the App Engine Channel API by implementing a
simple tic-tac-toe game.
"""

import datetime
import logging
import os
import random
import re
import uuid
import sys
from django.utils import simplejson
from google.appengine.api import channel
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app


class Game(db.Model):
  """All the data we store for a game"""
  userX = db.StringProperty()
  userO = db.StringProperty()
  board = db.StringProperty()
  moveX = db.BooleanProperty()
  winner = db.StringProperty()
  winning_board = db.StringProperty()
  

class Wins():
  x_win_patterns = ['XXX......',
                    '...XXX...',
                    '......XXX',
                    'X..X..X..',
                    '.X..X..X.',
                    '..X..X..X',
                    'X...X...X',
                    '..X.X.X..']

  o_win_patterns = map(lambda s: s.replace('X','O'), x_win_patterns)
  
  x_wins = map(lambda s: re.compile(s), x_win_patterns)
  o_wins = map(lambda s: re.compile(s), o_win_patterns)


class GameUpdater():
  game = None

  def __init__(self, game):
    self.game = game

  def get_game_message(self):
    gameUpdate = {
      'board': self.game.board,
      'userX': self.game.userX,
      'userO': '' if not self.game.userO else self.game.userO,
      'moveX': self.game.moveX,
      'winner': self.game.winner,
      'winningBoard': self.game.winning_board
    }
    return simplejson.dumps(gameUpdate)

  def send_update(self):
    message = self.get_game_message()
    channel.send_message(self.game.userX + self.game.key().id_or_name(), message)
    if self.game.userO:
      channel.send_message(self.game.userO + self.game.key().id_or_name(), message)

  def check_win(self):
    if self.game.moveX:
      # O just moved, check for O wins
      wins = Wins().o_wins
      potential_winner = self.game.userO
    else:
      # X just moved, check for X wins
      wins = Wins().x_wins
      potential_winner = self.game.userX
      
    for win in wins:
      if win.match(self.game.board):
        self.game.winner = potential_winner
        self.game.winning_board = win.pattern
        return

  def make_move(self, position, user):
    if position >= 0 and user == self.game.userX or user == self.game.userO:
      if self.game.moveX == (user == self.game.userX):
        boardList = list(self.game.board)
        if (boardList[position] == ' '):
          boardList[position] = 'X' if self.game.moveX else 'O'
          self.game.board = "".join(boardList)
          self.game.moveX = not self.game.moveX
          self.check_win()
          self.game.put()
          self.send_update()
          return


class GameFromRequest():
  game = None;
  user = None;

  def __init__(self, request):
    self.user = request.get('u')
    game_key = request.get('g')
    if game_key:
      self.game = Game.get_by_key_name(game_key)

  def get_game_data(self):
    return ( self.game, self.user )


class MovePage(webapp.RequestHandler):
  def post(self):
    (game, user) = GameFromRequest(self.request).get_game_data()
    if game and user:
      id = int(self.request.get('i'))
      GameUpdater(game).make_move(id, user)


class OpenedPage(webapp.RequestHandler):
  def post(self):
    (game, user) = GameFromRequest(self.request).get_game_data()
    GameUpdater(game).send_update()


class MainPage(webapp.RequestHandler):
  """The main UI page, renders the 'index.html' template."""

  def get(self):
    """Renders the main page. When this page is shown, we create a new
    channel to push asynchronous updates to the client."""
    game_key = self.request.get('g')
    game = None
    user = None
    if game_key:
      game = Game.get_by_key_name(game_key)
      if game: 
        user = game.userO
        if not user:
          user = uuid.uuid4().hex
          game.userO = user
          game.put()

    if not game:
      game_key = uuid.uuid4().hex
      user = uuid.uuid4().hex
      game = Game(key_name = game_key,
                  moveX = True,
                  userX = user,
                  complete = False,
                  board = '         ')
      game.put()


    game_link = 'http://localhost:8080/?g=' + game_key

    if game:
      token = channel.create_channel(user + game_key)
      values = {'token': token,
                'me': user,
                'game_key': game_key,
                'game_link': game_link,
                'initial_message': GameUpdater(game).get_game_message()
               }
      self.response.out.write(simplejson.dumps(values))
    else:
      self.response.out.write(simplejson.dumps({'error': 'No such game'}))


application = webapp.WSGIApplication([
    ('/', MainPage),
    ('/opened', OpenedPage),
    ('/move', MovePage)], debug=True)


def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
