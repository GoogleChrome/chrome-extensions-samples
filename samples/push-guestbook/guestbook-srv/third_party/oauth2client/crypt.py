#!/usr/bin/python2.4
# -*- coding: utf-8 -*-
#
# Copyright (C) 2011 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import base64
import hashlib
import logging
import time

from OpenSSL import crypto
from anyjson import simplejson


logger = logging.getLogger(__name__)

CLOCK_SKEW_SECS = 300  # 5 minutes in seconds
AUTH_TOKEN_LIFETIME_SECS = 300  # 5 minutes in seconds
MAX_TOKEN_LIFETIME_SECS = 86400  # 1 day in seconds


class AppIdentityError(Exception):
  pass


class Verifier(object):
  """Verifies the signature on a message."""

  def __init__(self, pubkey):
    """Constructor.

    Args:
      pubkey, OpenSSL.crypto.PKey, The public key to verify with.
    """
    self._pubkey = pubkey

  def verify(self, message, signature):
    """Verifies a message against a signature.

    Args:
      message: string, The message to verify.
      signature: string, The signature on the message.

    Returns:
      True if message was singed by the private key associated with the public
      key that this object was constructed with.
    """
    try:
      crypto.verify(self._pubkey, signature, message, 'sha256')
      return True
    except:
      return False

  @staticmethod
  def from_string(key_pem, is_x509_cert):
    """Construct a Verified instance from a string.

    Args:
      key_pem: string, public key in PEM format.
      is_x509_cert: bool, True if key_pem is an X509 cert, otherwise it is
        expected to be an RSA key in PEM format.

    Returns:
      Verifier instance.

    Raises:
      OpenSSL.crypto.Error if the key_pem can't be parsed.
    """
    if is_x509_cert:
      pubkey = crypto.load_certificate(crypto.FILETYPE_PEM, key_pem)
    else:
      pubkey = crypto.load_privatekey(crypto.FILETYPE_PEM, key_pem)
    return Verifier(pubkey)


class Signer(object):
  """Signs messages with a private key."""

  def __init__(self, pkey):
    """Constructor.

    Args:
      pkey, OpenSSL.crypto.PKey, The private key to sign with.
    """
    self._key = pkey

  def sign(self, message):
    """Signs a message.

    Args:
      message: string, Message to be signed.

    Returns:
      string, The signature of the message for the given key.
    """
    return crypto.sign(self._key, message, 'sha256')

  @staticmethod
  def from_string(key, password='notasecret'):
    """Construct a Signer instance from a string.

    Args:
      key: string, private key in P12 format.
      password: string, password for the private key file.

    Returns:
      Signer instance.

    Raises:
      OpenSSL.crypto.Error if the key can't be parsed.
    """
    pkey = crypto.load_pkcs12(key, password).get_privatekey()
    return Signer(pkey)


def _urlsafe_b64encode(raw_bytes):
  return base64.urlsafe_b64encode(raw_bytes).rstrip('=')


def _urlsafe_b64decode(b64string):
  # Guard against unicode strings, which base64 can't handle.
  b64string = b64string.encode('ascii')
  padded = b64string + '=' * (4 - len(b64string) % 4)
  return base64.urlsafe_b64decode(padded)


def _json_encode(data):
  return simplejson.dumps(data, separators = (',', ':'))


def make_signed_jwt(signer, payload):
  """Make a signed JWT.

  See http://self-issued.info/docs/draft-jones-json-web-token.html.

  Args:
    signer: crypt.Signer, Cryptographic signer.
    payload: dict, Dictionary of data to convert to JSON and then sign.

  Returns:
    string, The JWT for the payload.
  """
  header = {'typ': 'JWT', 'alg': 'RS256'}

  segments = [
          _urlsafe_b64encode(_json_encode(header)),
          _urlsafe_b64encode(_json_encode(payload)),
  ]
  signing_input = '.'.join(segments)

  signature = signer.sign(signing_input)
  segments.append(_urlsafe_b64encode(signature))

  logger.debug(str(segments))

  return '.'.join(segments)


def verify_signed_jwt_with_certs(jwt, certs, audience):
  """Verify a JWT against public certs.

  See http://self-issued.info/docs/draft-jones-json-web-token.html.

  Args:
    jwt: string, A JWT.
    certs: dict, Dictionary where values of public keys in PEM format.
    audience: string, The audience, 'aud', that this JWT should contain. If
      None then the JWT's 'aud' parameter is not verified.

  Returns:
    dict, The deserialized JSON payload in the JWT.

  Raises:
    AppIdentityError if any checks are failed.
  """
  segments = jwt.split('.')

  if (len(segments) != 3):
    raise AppIdentityError(
      'Wrong number of segments in token: %s' % jwt)
  signed = '%s.%s' % (segments[0], segments[1])

  signature = _urlsafe_b64decode(segments[2])

  # Parse token.
  json_body = _urlsafe_b64decode(segments[1])
  try:
    parsed = simplejson.loads(json_body)
  except:
    raise AppIdentityError('Can\'t parse token: %s' % json_body)

  # Check signature.
  verified = False
  for (keyname, pem) in certs.items():
    verifier = Verifier.from_string(pem, True)
    if (verifier.verify(signed, signature)):
      verified = True
      break
  if not verified:
    raise AppIdentityError('Invalid token signature: %s' % jwt)

  # Check creation timestamp.
  iat = parsed.get('iat')
  if iat is None:
    raise AppIdentityError('No iat field in token: %s' % json_body)
  earliest = iat - CLOCK_SKEW_SECS

  # Check expiration timestamp.
  now = long(time.time())
  exp = parsed.get('exp')
  if exp is None:
    raise AppIdentityError('No exp field in token: %s' % json_body)
  if exp >= now + MAX_TOKEN_LIFETIME_SECS:
    raise AppIdentityError(
      'exp field too far in future: %s' % json_body)
  latest = exp + CLOCK_SKEW_SECS

  if now < earliest:
    raise AppIdentityError('Token used too early, %d < %d: %s' %
      (now, earliest, json_body))
  if now > latest:
    raise AppIdentityError('Token used too late, %d > %d: %s' %
      (now, latest, json_body))

  # Check audience.
  if audience is not None:
    aud = parsed.get('aud')
    if aud is None:
      raise AppIdentityError('No aud field in token: %s' % json_body)
    if aud != audience:
      raise AppIdentityError('Wrong recipient, %s != %s: %s' %
          (aud, audience, json_body))

  return parsed
