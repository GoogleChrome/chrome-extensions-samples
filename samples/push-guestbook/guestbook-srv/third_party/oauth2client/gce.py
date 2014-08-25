# Copyright (C) 2012 Google Inc.
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

"""Utilities for Google Compute Engine

Utilities for making it easier to use OAuth 2.0 on Google Compute Engine.
"""

__author__ = 'jcgregorio@google.com (Joe Gregorio)'

import httplib2
import logging
import uritemplate

from oauth2client import util
from oauth2client.anyjson import simplejson
from oauth2client.client import AccessTokenRefreshError
from oauth2client.client import AssertionCredentials

logger = logging.getLogger(__name__)

# URI Template for the endpoint that returns access_tokens.
META = ('http://metadata.google.internal/0.1/meta-data/service-accounts/'
        'default/acquire{?scope}')


class AppAssertionCredentials(AssertionCredentials):
  """Credentials object for Compute Engine Assertion Grants

  This object will allow a Compute Engine instance to identify itself to
  Google and other OAuth 2.0 servers that can verify assertions. It can be used
  for the purpose of accessing data stored under an account assigned to the
  Compute Engine instance itself.

  This credential does not require a flow to instantiate because it represents
  a two legged flow, and therefore has all of the required information to
  generate and refresh its own access tokens.
  """

  @util.positional(2)
  def __init__(self, scope, **kwargs):
    """Constructor for AppAssertionCredentials

    Args:
      scope: string or list of strings, scope(s) of the credentials being
        requested.
    """
    if type(scope) is list:
      scope = ' '.join(scope)
    self.scope = scope

    super(AppAssertionCredentials, self).__init__(
        'ignored' # assertion_type is ignore in this subclass.
        )

  @classmethod
  def from_json(cls, json):
    data = simplejson.loads(json)
    return AppAssertionCredentials(data['scope'])

  def _refresh(self, http_request):
    """Refreshes the access_token.

    Skip all the storage hoops and just refresh using the API.

    Args:
      http_request: callable, a callable that matches the method signature of
        httplib2.Http.request, used to make the refresh request.

    Raises:
      AccessTokenRefreshError: When the refresh fails.
    """
    uri = uritemplate.expand(META, {'scope': self.scope})
    response, content = http_request(uri)
    if response.status == 200:
      try:
        d = simplejson.loads(content)
      except StandardError, e:
        raise AccessTokenRefreshError(str(e))
      self.access_token = d['accessToken']
    else:
      raise AccessTokenRefreshError(content)
