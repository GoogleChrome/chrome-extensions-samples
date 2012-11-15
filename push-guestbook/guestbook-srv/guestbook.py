#!/usr/bin/env python
import cgi
import collections
import datetime
import httplib2
import logging
import os
import random
import simplejson
import webapp2

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext.webapp import template

from oauth2client.appengine import StorageByKeyName, CredentialsModel
from oauth2client.client import flow_from_clientsecrets, AccessTokenRefreshError

CLIENTSECRETS_LOCATION = 'client_secrets.json'
REDIRECT_URI = 'http://localhost:8080/oauth2callback'
SCOPES = [ 'https://www.googleapis.com/auth/chromewebstore' ]

logger = logging.getLogger(__name__)

class AdminCredentialsModel(CredentialsModel):
  pass

def send_messages(post_data):
  storage = StorageByKeyName(AdminCredentialsModel, 'theadminaccount', 'credentials')
  credentials = storage.get()
  logger.warning("Credentials: %r" % credentials.to_json())
  if credentials:
    try:
      api_http = credentials.authorize(httplib2.Http())
      for data in post_data:
        resp, content = api_http.request('https://www.googleapis.com/chromewebstore/v1.1/notifications',
                         'POST',
                         body=simplejson.dumps(data),
                         headers={'Content-Type': 'application/json'})
    except AccessTokenRefreshError:
      logger.warning("Unable to refresh the Push Messaging access token!")


class Greeting(db.Model):
  author = db.UserProperty()
  content = db.StringProperty(multiline=True)
  date = db.DateTimeProperty(auto_now_add=True)

class Follower(db.Model):
  channelId = db.StringProperty()
  verified = db.BooleanProperty()
  verifier = db.IntegerProperty()

class MainPage(webapp2.RequestHandler):
  def get(self):
    greetings = Greeting.all().order('-date').fetch(10)

    if users.get_current_user():
      url = users.create_logout_url(self.request.uri)
      url_linktext = 'Logout'
    else:
      url = users.create_login_url(self.request.uri)
      url_linktext = 'Login'

    template_values = {
      'greetings': greetings,
      'url': url,
      'url_linktext': url_linktext
    }

    template_path = os.path.join(os.path.dirname(__file__), 'index.html')
    self.response.out.write(template.render(template_path, template_values))
    return

class Guestbook(webapp2.RequestHandler):
  def post(self):
    greeting = Greeting()

    if users.get_current_user():
      greeting.author = users.get_current_user()

    greeting.content = self.request.get('content')
    greeting.put()

    followers = Follower.all().filter('verified =', True)
    #followers = Follower.all()
    channel_ids = [f.channelId for f in followers if f.channelId]
    post_data = [{
        'channelId': channelId,
        'subchannelId': 0,
        'payload':greeting.content
      } for channelId in channel_ids]
    send_messages(post_data)

    self.redirect('/')

class Monitor(webapp2.RequestHandler):
  def send_verification_message(self, follower):
    post_data = {
      "channelId": follower.channelId,
      "subchannelId": 1,
      "payload": follower.verifier
    }
    send_messages([post_data])

  def post(self):
    args = simplejson.loads(self.request.body)
    channelId = args.get('channelId')
    verifier = args.get('verifier')
    if channelId is not None:
      follower = Follower.get_or_insert(channelId,
                                        channelId=channelId,
                                        verifier=random.randrange(100000),
                                        verified=False)
      if verifier is not None and int(verifier) == follower.verifier:
        follower.verified=True
        follower.put()
      elif follower.verified == False:
        self.send_verification_message(follower)
      response = { 'status': 'ok' }
      response['lastMessage'] = Greeting.all().order('-date').fetch(1)[0].content
      self.response.out.write(simplejson.dumps(response))
      return
    self.response.out.write(simplejson.dumps(dict(status='err')))

class StartPushOAuth(webapp2.RequestHandler):
  def get(self):
    flow = flow_from_clientsecrets(CLIENTSECRETS_LOCATION,
                                   scope=' '.join(SCOPES),
                                   redirect_uri=REDIRECT_URI)
    # The following parameters are required to always receive a refresh
    # token when you authorize the service.
    flow.params['access_type'] = 'offline'
    flow.params['approval_prompt'] = 'force'

    auth_uri = flow.step1_get_authorize_url()
    self.redirect(str(auth_uri))

class OAuth2Redirect(webapp2.RequestHandler):
  def get(self):
    flow = flow_from_clientsecrets(CLIENTSECRETS_LOCATION,
                                   scope=' '.join(SCOPES),
                                   redirect_uri=REDIRECT_URI)
    flow.params['access_type'] = 'offline'
    credentials = flow.step2_exchange(self.request.get('code'))
    storage = StorageByKeyName(AdminCredentialsModel, 'theadminaccount', 'credentials')
    storage.put(credentials)
    self.redirect('/')

app = webapp2.WSGIApplication([
  ('/', MainPage),
  ('/sign', Guestbook),
  ('/monitor', Monitor),
  ('/startpush', StartPushOAuth),
  ('/oauth2callback', OAuth2Redirect)
], debug=True)
