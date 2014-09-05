# Copyright 2012 Google Inc. All Rights Reserved.

# pylint: disable-msg=C6409,C6203

"""In-App Payments - Online Store Python Sample"""

# standard library imports
from cgi import escape

import os
import json
import time
import logging

# third-party imports
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import jwt

# application-specific imports
from sellerinfo import SELLER_ID
from sellerinfo import SELLER_SECRET

def postbacks_requestkey(request_name=None):
  return db.Key.from_path('Postbacks', request_name or 'default_queue')

class Postbacks(db.Model):
  jwtPostback = db.TextProperty()
  orderId = db.StringProperty()
  saleType = db.StringProperty()
  price = db.StringProperty()
  currencyCode = db.StringProperty()
  sellerData = db.StringProperty()
  itemName = db.StringProperty()
  recurrenceFrequency = db.StringProperty()
  recurrencePrice = db.StringProperty()


class MainHandler(webapp.RequestHandler):
  """Handles /"""

  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write("Hello, World.")


class GenerateJWTSingleItemHandler(webapp.RequestHandler):
  """Generates a single item JWT - handles /generate"""

  def post(self):
    currTime = int(time.time())
    expTime = currTime + (60 * 60 * 24 * 365)

    jwtInfo = {'iss': SELLER_ID,
                'aud': 'Google',
                'typ': 'google/payments/inapp/item/v1',
                'iat': currTime,
                'exp': expTime,
                'request': {'name': self.request.get('itemName', None),
                            'description': self.request.get('description', None),
                            'price': self.request.get('price', '1.00'),
                            'currencyCode': 'USD',
                            'sellerData': self.request.get('sellerData', None)
                           }
                }
    token = jwt.encode(jwtInfo, SELLER_SECRET)
    result = {'encodedJWT': token}
    result['jwt'] = jwtInfo
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps(result))


class GenerateJWTSubscriptionHandler(webapp.RequestHandler):
  """Generates a subscription JWT - handles /generateSubscription"""

  def post(self):
    currTime = int(time.time())
    expTime = currTime + (60 * 60 * 24 * 365)

    jwtInfo = {'iss': SELLER_ID,
                'aud': 'Google',
                'typ': 'google/payments/inapp/subscription/v1',
                'iat': currTime,
                'exp': expTime,
                'request': {'name': self.request.get('itemName', None),
                            'description': self.request.get('description', None),
                            'sellerData': self.request.get('sellerData', None),
                            'initialPayment': {
                              'price': self.request.get('initialPrice', None),
                              'currencyCode': 'USD',
                              'paymentType': 'prorated'
                              },
                            'recurrence': {
                              'price': self.request.get('recurringPrice', None),
                              'currencyCode': 'USD',
                              'frequency': 'monthly',
                              'startTime': int(time.time() + 2600000)
                              }
                            }
                }
    token = jwt.encode(jwtInfo, SELLER_SECRET)
    result = {'encodedJWT': token}
    result['jwt'] = jwtInfo
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps(result))



class PostbackHandler(webapp.RequestHandler):
  """Handles server postback from Wallet - received at /postback"""

  def post(self):
    """Handles post request."""
    encodedJWT = self.request.get('jwt', None)
    if encodedJWT is not None:
      # jwt.decode won't accept unicode, cast to str
      # http://github.com/progrium/pyjwt/issues/4
      decodedJWT = jwt.decode(str(encodedJWT), SELLER_SECRET)
      logging.info("Postback Handler")
      logging.info("Encoded JWT: " + str(encodedJWT))
      logging.info("Decoded JWT: " + str(decodedJWT))
      # validate the payment request and respond back to Google
      if decodedJWT['iss'] == 'Google' and decodedJWT['aud'] == SELLER_ID:
        if ('response' in decodedJWT and
            'orderId' in decodedJWT['response'] and
            'request' in decodedJWT):
          
          orderId = decodedJWT['response']['orderId']
          requestInfo = decodedJWT['request']
          
          pb = Postbacks(parent=postbacks_requestkey())
          pb.jwtPostback = encodedJWT
          pb.orderId = orderId
          pb.sellerData = requestInfo.get('sellerData')
          pb.itemName = requestInfo.get('name')
          pb.saleType = decodedJWT['typ']

          if (decodedJWT['typ'] == 'google/payments/inapp/item/v1/postback/buy'):
            pb.price = requestInfo['price']
            pb.currencyCode = requestInfo['currencyCode']
          elif (decodedJWT['typ'] == 'google/payments/inapp/subscription/v1/postback/buy'):
            pb.price = requestInfo['initialPayment']['price']
            pb.currencyCode = requestInfo['initialPayment']['currencyCode']
            pb.recurrencePrice = requestInfo['recurrence']['price']
            pb.recurrenceFrequency = requestInfo['recurrence']['frequency']
          
          pb.put()

          # respond back to complete payment
          self.response.out.write(orderId)
      else:
        self.error(404)


class VerifyPurchaseHandler(webapp.RequestHandler):
  """Verifies a purchase was made - received at /verify"""

  def get(self):
    orderId = self.request.get('orderId', None)
    orderQuery = db.GqlQuery('SELECT * from Postbacks where orderId=:1', orderId)
    order = orderQuery.get()
    if order is not None:
      result = {'success': True,
                'orderId': order.orderId,
                'itemName': order.itemName}
    else:
      result = {'success': False}
    self.response.headers['Access-Control-Allow-Origin'] = "*"
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps(result))


application = webapp.WSGIApplication([
    ('/', MainHandler),
    ('/generate', GenerateJWTSingleItemHandler),
    ('/generateSubscription', GenerateJWTSubscriptionHandler),
    ('/verify', VerifyPurchaseHandler),
    ('/postback', PostbackHandler),
], debug=True)


def main():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()
