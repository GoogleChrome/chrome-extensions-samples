# Copyright (C) 2010 Google Inc.
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

"""Command-line tools for authenticating via OAuth 2.0

Do the OAuth 2.0 Web Server dance for a command line application. Stores the
generated credentials in a common file that is used by other example apps in
the same directory.
"""

__author__ = 'jcgregorio@google.com (Joe Gregorio)'
__all__ = ['run']


import BaseHTTPServer
import gflags
import socket
import sys
import webbrowser

from oauth2client.client import FlowExchangeError
from oauth2client.client import OOB_CALLBACK_URN
from oauth2client import util

try:
  from urlparse import parse_qsl
except ImportError:
  from cgi import parse_qsl


FLAGS = gflags.FLAGS

gflags.DEFINE_boolean('auth_local_webserver', True,
                      ('Run a local web server to handle redirects during '
                       'OAuth authorization.'))

gflags.DEFINE_string('auth_host_name', 'localhost',
                     ('Host name to use when running a local web server to '
                      'handle redirects during OAuth authorization.'))

gflags.DEFINE_multi_int('auth_host_port', [8080, 8090],
                        ('Port to use when running a local web server to '
                         'handle redirects during OAuth authorization.'))


class ClientRedirectServer(BaseHTTPServer.HTTPServer):
  """A server to handle OAuth 2.0 redirects back to localhost.

  Waits for a single request and parses the query parameters
  into query_params and then stops serving.
  """
  query_params = {}


class ClientRedirectHandler(BaseHTTPServer.BaseHTTPRequestHandler):
  """A handler for OAuth 2.0 redirects back to localhost.

  Waits for a single request and parses the query parameters
  into the servers query_params and then stops serving.
  """

  def do_GET(s):
    """Handle a GET request.

    Parses the query parameters and prints a message
    if the flow has completed. Note that we can't detect
    if an error occurred.
    """
    s.send_response(200)
    s.send_header("Content-type", "text/html")
    s.end_headers()
    query = s.path.split('?', 1)[-1]
    query = dict(parse_qsl(query))
    s.server.query_params = query
    s.wfile.write("<html><head><title>Authentication Status</title></head>")
    s.wfile.write("<body><p>The authentication flow has completed.</p>")
    s.wfile.write("</body></html>")

  def log_message(self, format, *args):
    """Do not log messages to stdout while running as command line program."""
    pass


@util.positional(2)
def run(flow, storage, http=None):
  """Core code for a command-line application.

  Args:
    flow: Flow, an OAuth 2.0 Flow to step through.
    storage: Storage, a Storage to store the credential in.
    http: An instance of httplib2.Http.request
         or something that acts like it.

  Returns:
    Credentials, the obtained credential.
  """
  if FLAGS.auth_local_webserver:
    success = False
    port_number = 0
    for port in FLAGS.auth_host_port:
      port_number = port
      try:
        httpd = ClientRedirectServer((FLAGS.auth_host_name, port),
                                     ClientRedirectHandler)
      except socket.error, e:
        pass
      else:
        success = True
        break
    FLAGS.auth_local_webserver = success
    if not success:
      print 'Failed to start a local webserver listening on either port 8080'
      print 'or port 9090. Please check your firewall settings and locally'
      print 'running programs that may be blocking or using those ports.'
      print
      print 'Falling back to --noauth_local_webserver and continuing with',
      print 'authorization.'
      print

  if FLAGS.auth_local_webserver:
    oauth_callback = 'http://%s:%s/' % (FLAGS.auth_host_name, port_number)
  else:
    oauth_callback = OOB_CALLBACK_URN
  flow.redirect_uri = oauth_callback
  authorize_url = flow.step1_get_authorize_url()

  if FLAGS.auth_local_webserver:
    webbrowser.open(authorize_url, new=1, autoraise=True)
    print 'Your browser has been opened to visit:'
    print
    print '    ' + authorize_url
    print
    print 'If your browser is on a different machine then exit and re-run this'
    print 'application with the command-line parameter '
    print
    print '  --noauth_local_webserver'
    print
  else:
    print 'Go to the following link in your browser:'
    print
    print '    ' + authorize_url
    print

  code = None
  if FLAGS.auth_local_webserver:
    httpd.handle_request()
    if 'error' in httpd.query_params:
      sys.exit('Authentication request was rejected.')
    if 'code' in httpd.query_params:
      code = httpd.query_params['code']
    else:
      print 'Failed to find "code" in the query parameters of the redirect.'
      sys.exit('Try running with --noauth_local_webserver.')
  else:
    code = raw_input('Enter verification code: ').strip()

  try:
    credential = flow.step2_exchange(code, http=http)
  except FlowExchangeError, e:
    sys.exit('Authentication has failed: %s' % e)

  storage.put(credential)
  credential.set_store(storage)
  print 'Authentication successful.'

  return credential
