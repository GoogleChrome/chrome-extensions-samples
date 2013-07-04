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

"""Client for discovery based APIs

A client library for Google's discovery based APIs.
"""

__author__ = 'jcgregorio@google.com (Joe Gregorio)'
__all__ = [
    'build',
    'build_from_document'
    'fix_method_name',
    'key2param'
    ]

import copy
import httplib2
import logging
import os
import random
import re
import uritemplate
import urllib
import urlparse
import mimeparse
import mimetypes

try:
    from urlparse import parse_qsl
except ImportError:
    from cgi import parse_qsl

from apiclient.errors import HttpError
from apiclient.errors import InvalidJsonError
from apiclient.errors import MediaUploadSizeError
from apiclient.errors import UnacceptableMimeTypeError
from apiclient.errors import UnknownApiNameOrVersion
from apiclient.errors import UnknownLinkType
from apiclient.http import HttpRequest
from apiclient.http import MediaFileUpload
from apiclient.http import MediaUpload
from apiclient.model import JsonModel
from apiclient.model import MediaModel
from apiclient.model import RawModel
from apiclient.schema import Schemas
from email.mime.multipart import MIMEMultipart
from email.mime.nonmultipart import MIMENonMultipart
from oauth2client.util import positional
from oauth2client.anyjson import simplejson

logger = logging.getLogger(__name__)

URITEMPLATE = re.compile('{[^}]*}')
VARNAME = re.compile('[a-zA-Z0-9_-]+')
DISCOVERY_URI = ('https://www.googleapis.com/discovery/v1/apis/'
  '{api}/{apiVersion}/rest')
DEFAULT_METHOD_DOC = 'A description of how to use this function'

# Parameters accepted by the stack, but not visible via discovery.
STACK_QUERY_PARAMETERS = ['trace', 'pp', 'userip', 'strict']

# Python reserved words.
RESERVED_WORDS = ['and', 'assert', 'break', 'class', 'continue', 'def', 'del',
                  'elif', 'else', 'except', 'exec', 'finally', 'for', 'from',
                  'global', 'if', 'import', 'in', 'is', 'lambda', 'not', 'or',
                  'pass', 'print', 'raise', 'return', 'try', 'while', 'body']


def fix_method_name(name):
  """Fix method names to avoid reserved word conflicts.

  Args:
    name: string, method name.

  Returns:
    The name with a '_' prefixed if the name is a reserved word.
  """
  if name in RESERVED_WORDS:
    return name + '_'
  else:
    return name


def _add_query_parameter(url, name, value):
  """Adds a query parameter to a url.

  Replaces the current value if it already exists in the URL.

  Args:
    url: string, url to add the query parameter to.
    name: string, query parameter name.
    value: string, query parameter value.

  Returns:
    Updated query parameter. Does not update the url if value is None.
  """
  if value is None:
    return url
  else:
    parsed = list(urlparse.urlparse(url))
    q = dict(parse_qsl(parsed[4]))
    q[name] = value
    parsed[4] = urllib.urlencode(q)
    return urlparse.urlunparse(parsed)


def key2param(key):
  """Converts key names into parameter names.

  For example, converting "max-results" -> "max_results"

  Args:
    key: string, the method key name.

  Returns:
    A safe method name based on the key name.
  """
  result = []
  key = list(key)
  if not key[0].isalpha():
    result.append('x')
  for c in key:
    if c.isalnum():
      result.append(c)
    else:
      result.append('_')

  return ''.join(result)


@positional(2)
def build(serviceName,
          version,
          http=None,
          discoveryServiceUrl=DISCOVERY_URI,
          developerKey=None,
          model=None,
          requestBuilder=HttpRequest):
  """Construct a Resource for interacting with an API.

  Construct a Resource object for interacting with an API. The serviceName and
  version are the names from the Discovery service.

  Args:
    serviceName: string, name of the service.
    version: string, the version of the service.
    http: httplib2.Http, An instance of httplib2.Http or something that acts
      like it that HTTP requests will be made through.
    discoveryServiceUrl: string, a URI Template that points to the location of
      the discovery service. It should have two parameters {api} and
      {apiVersion} that when filled in produce an absolute URI to the discovery
      document for that service.
    developerKey: string, key obtained from
      https://code.google.com/apis/console.
    model: apiclient.Model, converts to and from the wire format.
    requestBuilder: apiclient.http.HttpRequest, encapsulator for an HTTP
      request.

  Returns:
    A Resource object with methods for interacting with the service.
  """
  params = {
      'api': serviceName,
      'apiVersion': version
      }

  if http is None:
    http = httplib2.Http()

  requested_url = uritemplate.expand(discoveryServiceUrl, params)

  # REMOTE_ADDR is defined by the CGI spec [RFC3875] as the environment
  # variable that contains the network address of the client sending the
  # request. If it exists then add that to the request for the discovery
  # document to avoid exceeding the quota on discovery requests.
  if 'REMOTE_ADDR' in os.environ:
    requested_url = _add_query_parameter(requested_url, 'userIp',
                                         os.environ['REMOTE_ADDR'])
  logger.info('URL being requested: %s' % requested_url)

  resp, content = http.request(requested_url)

  if resp.status == 404:
    raise UnknownApiNameOrVersion("name: %s  version: %s" % (serviceName,
                                                            version))
  if resp.status >= 400:
    raise HttpError(resp, content, uri=requested_url)

  try:
    service = simplejson.loads(content)
  except ValueError, e:
    logger.error('Failed to parse as JSON: ' + content)
    raise InvalidJsonError()

  return build_from_document(content, base=discoveryServiceUrl, http=http,
      developerKey=developerKey, model=model, requestBuilder=requestBuilder)


@positional(1)
def build_from_document(
    service,
    base=None,
    future=None,
    http=None,
    developerKey=None,
    model=None,
    requestBuilder=HttpRequest):
  """Create a Resource for interacting with an API.

  Same as `build()`, but constructs the Resource object from a discovery
  document that is it given, as opposed to retrieving one over HTTP.

  Args:
    service: string, discovery document.
    base: string, base URI for all HTTP requests, usually the discovery URI.
      This parameter is no longer used as rootUrl and servicePath are included
      within the discovery document. (deprecated)
    future: string, discovery document with future capabilities (deprecated).
    http: httplib2.Http, An instance of httplib2.Http or something that acts
      like it that HTTP requests will be made through.
    developerKey: string, Key for controlling API usage, generated
      from the API Console.
    model: Model class instance that serializes and de-serializes requests and
      responses.
    requestBuilder: Takes an http request and packages it up to be executed.

  Returns:
    A Resource object with methods for interacting with the service.
  """

  # future is no longer used.
  future = {}

  service = simplejson.loads(service)
  base = urlparse.urljoin(service['rootUrl'], service['servicePath'])
  schema = Schemas(service)

  if model is None:
    features = service.get('features', [])
    model = JsonModel('dataWrapper' in features)
  resource = _createResource(http, base, model, requestBuilder, developerKey,
                       service, service, schema)

  return resource


def _cast(value, schema_type):
  """Convert value to a string based on JSON Schema type.

  See http://tools.ietf.org/html/draft-zyp-json-schema-03 for more details on
  JSON Schema.

  Args:
    value: any, the value to convert
    schema_type: string, the type that value should be interpreted as

  Returns:
    A string representation of 'value' based on the schema_type.
  """
  if schema_type == 'string':
    if type(value) == type('') or type(value) == type(u''):
      return value
    else:
      return str(value)
  elif schema_type == 'integer':
    return str(int(value))
  elif schema_type == 'number':
    return str(float(value))
  elif schema_type == 'boolean':
    return str(bool(value)).lower()
  else:
    if type(value) == type('') or type(value) == type(u''):
      return value
    else:
      return str(value)


MULTIPLIERS = {
    "KB": 2 ** 10,
    "MB": 2 ** 20,
    "GB": 2 ** 30,
    "TB": 2 ** 40,
    }


def _media_size_to_long(maxSize):
  """Convert a string media size, such as 10GB or 3TB into an integer.

  Args:
    maxSize: string, size as a string, such as 2MB or 7GB.

  Returns:
    The size as an integer value.
  """
  if len(maxSize) < 2:
    return 0
  units = maxSize[-2:].upper()
  multiplier = MULTIPLIERS.get(units, 0)
  if multiplier:
    return int(maxSize[:-2]) * multiplier
  else:
    return int(maxSize)


def _createResource(http, baseUrl, model, requestBuilder,
                   developerKey, resourceDesc, rootDesc, schema):
  """Build a Resource from the API description.

  Args:
    http: httplib2.Http, Object to make http requests with.
    baseUrl: string, base URL for the API. All requests are relative to this
      URI.
    model: apiclient.Model, converts to and from the wire format.
    requestBuilder: class or callable that instantiates an
      apiclient.HttpRequest object.
    developerKey: string, key obtained from
      https://code.google.com/apis/console
    resourceDesc: object, section of deserialized discovery document that
      describes a resource. Note that the top level discovery document
      is considered a resource.
    rootDesc: object, the entire deserialized discovery document.
    schema: object, mapping of schema names to schema descriptions.

  Returns:
    An instance of Resource with all the methods attached for interacting with
    that resource.
  """

  class Resource(object):
    """A class for interacting with a resource."""

    def __init__(self):
      self._http = http
      self._baseUrl = baseUrl
      self._model = model
      self._developerKey = developerKey
      self._requestBuilder = requestBuilder

  def createMethod(theclass, methodName, methodDesc, rootDesc):
    """Creates a method for attaching to a Resource.

    Args:
      theclass: type, the class to attach methods to.
      methodName: string, name of the method to use.
      methodDesc: object, fragment of deserialized discovery document that
        describes the method.
      rootDesc: object, the entire deserialized discovery document.
    """
    methodName = fix_method_name(methodName)
    pathUrl = methodDesc['path']
    httpMethod = methodDesc['httpMethod']
    methodId = methodDesc['id']

    mediaPathUrl = None
    accept = []
    maxSize = 0
    if 'mediaUpload' in methodDesc:
      mediaUpload = methodDesc['mediaUpload']
      mediaPathUrl = (rootDesc['rootUrl'] + 'upload/' + rootDesc['servicePath']
                      + pathUrl)
      accept = mediaUpload['accept']
      maxSize = _media_size_to_long(mediaUpload.get('maxSize', ''))

    if 'parameters' not in methodDesc:
      methodDesc['parameters'] = {}

    # Add in the parameters common to all methods.
    for name, desc in rootDesc.get('parameters', {}).iteritems():
      methodDesc['parameters'][name] = desc

    # Add in undocumented query parameters.
    for name in STACK_QUERY_PARAMETERS:
      methodDesc['parameters'][name] = {
          'type': 'string',
          'location': 'query'
          }

    if httpMethod in ['PUT', 'POST', 'PATCH'] and 'request' in methodDesc:
      methodDesc['parameters']['body'] = {
          'description': 'The request body.',
          'type': 'object',
          'required': True,
          }
      if 'request' in methodDesc:
        methodDesc['parameters']['body'].update(methodDesc['request'])
      else:
        methodDesc['parameters']['body']['type'] = 'object'
    if 'mediaUpload' in methodDesc:
      methodDesc['parameters']['media_body'] = {
          'description':
            'The filename of the media request body, or an instance of a '
            'MediaUpload object.',
          'type': 'string',
          'required': False,
          }
      if 'body' in methodDesc['parameters']:
        methodDesc['parameters']['body']['required'] = False

    argmap = {} # Map from method parameter name to query parameter name
    required_params = [] # Required parameters
    repeated_params = [] # Repeated parameters
    pattern_params = {}  # Parameters that must match a regex
    query_params = [] # Parameters that will be used in the query string
    path_params = {} # Parameters that will be used in the base URL
    param_type = {} # The type of the parameter
    enum_params = {} # Allowable enumeration values for each parameter


    if 'parameters' in methodDesc:
      for arg, desc in methodDesc['parameters'].iteritems():
        param = key2param(arg)
        argmap[param] = arg

        if desc.get('pattern', ''):
          pattern_params[param] = desc['pattern']
        if desc.get('enum', ''):
          enum_params[param] = desc['enum']
        if desc.get('required', False):
          required_params.append(param)
        if desc.get('repeated', False):
          repeated_params.append(param)
        if desc.get('location') == 'query':
          query_params.append(param)
        if desc.get('location') == 'path':
          path_params[param] = param
        param_type[param] = desc.get('type', 'string')

    for match in URITEMPLATE.finditer(pathUrl):
      for namematch in VARNAME.finditer(match.group(0)):
        name = key2param(namematch.group(0))
        path_params[name] = name
        if name in query_params:
          query_params.remove(name)

    def method(self, **kwargs):
      # Don't bother with doc string, it will be over-written by createMethod.

      for name in kwargs.iterkeys():
        if name not in argmap:
          raise TypeError('Got an unexpected keyword argument "%s"' % name)

      # Remove args that have a value of None.
      keys = kwargs.keys()
      for name in keys:
        if kwargs[name] is None:
          del kwargs[name]

      for name in required_params:
        if name not in kwargs:
          raise TypeError('Missing required parameter "%s"' % name)

      for name, regex in pattern_params.iteritems():
        if name in kwargs:
          if isinstance(kwargs[name], basestring):
            pvalues = [kwargs[name]]
          else:
            pvalues = kwargs[name]
          for pvalue in pvalues:
            if re.match(regex, pvalue) is None:
              raise TypeError(
                  'Parameter "%s" value "%s" does not match the pattern "%s"' %
                  (name, pvalue, regex))

      for name, enums in enum_params.iteritems():
        if name in kwargs:
          # We need to handle the case of a repeated enum
          # name differently, since we want to handle both
          # arg='value' and arg=['value1', 'value2']
          if (name in repeated_params and
              not isinstance(kwargs[name], basestring)):
            values = kwargs[name]
          else:
            values = [kwargs[name]]
          for value in values:
            if value not in enums:
              raise TypeError(
                  'Parameter "%s" value "%s" is not an allowed value in "%s"' %
                  (name, value, str(enums)))

      actual_query_params = {}
      actual_path_params = {}
      for key, value in kwargs.iteritems():
        to_type = param_type.get(key, 'string')
        # For repeated parameters we cast each member of the list.
        if key in repeated_params and type(value) == type([]):
          cast_value = [_cast(x, to_type) for x in value]
        else:
          cast_value = _cast(value, to_type)
        if key in query_params:
          actual_query_params[argmap[key]] = cast_value
        if key in path_params:
          actual_path_params[argmap[key]] = cast_value
      body_value = kwargs.get('body', None)
      media_filename = kwargs.get('media_body', None)

      if self._developerKey:
        actual_query_params['key'] = self._developerKey

      model = self._model
      if methodName.endswith('_media'):
        model = MediaModel()
      elif 'response' not in methodDesc:
        model = RawModel()

      headers = {}
      headers, params, query, body = model.request(headers,
          actual_path_params, actual_query_params, body_value)

      expanded_url = uritemplate.expand(pathUrl, params)
      url = urlparse.urljoin(self._baseUrl, expanded_url + query)

      resumable = None
      multipart_boundary = ''

      if media_filename:
        # Ensure we end up with a valid MediaUpload object.
        if isinstance(media_filename, basestring):
          (media_mime_type, encoding) = mimetypes.guess_type(media_filename)
          if media_mime_type is None:
            raise UnknownFileType(media_filename)
          if not mimeparse.best_match([media_mime_type], ','.join(accept)):
            raise UnacceptableMimeTypeError(media_mime_type)
          media_upload = MediaFileUpload(media_filename,
                                         mimetype=media_mime_type)
        elif isinstance(media_filename, MediaUpload):
          media_upload = media_filename
        else:
          raise TypeError('media_filename must be str or MediaUpload.')

        # Check the maxSize
        if maxSize > 0 and media_upload.size() > maxSize:
          raise MediaUploadSizeError("Media larger than: %s" % maxSize)

        # Use the media path uri for media uploads
        expanded_url = uritemplate.expand(mediaPathUrl, params)
        url = urlparse.urljoin(self._baseUrl, expanded_url + query)
        if media_upload.resumable():
          url = _add_query_parameter(url, 'uploadType', 'resumable')

        if media_upload.resumable():
          # This is all we need to do for resumable, if the body exists it gets
          # sent in the first request, otherwise an empty body is sent.
          resumable = media_upload
        else:
          # A non-resumable upload
          if body is None:
            # This is a simple media upload
            headers['content-type'] = media_upload.mimetype()
            body = media_upload.getbytes(0, media_upload.size())
            url = _add_query_parameter(url, 'uploadType', 'media')
          else:
            # This is a multipart/related upload.
            msgRoot = MIMEMultipart('related')
            # msgRoot should not write out it's own headers
            setattr(msgRoot, '_write_headers', lambda self: None)

            # attach the body as one part
            msg = MIMENonMultipart(*headers['content-type'].split('/'))
            msg.set_payload(body)
            msgRoot.attach(msg)

            # attach the media as the second part
            msg = MIMENonMultipart(*media_upload.mimetype().split('/'))
            msg['Content-Transfer-Encoding'] = 'binary'

            payload = media_upload.getbytes(0, media_upload.size())
            msg.set_payload(payload)
            msgRoot.attach(msg)
            body = msgRoot.as_string()

            multipart_boundary = msgRoot.get_boundary()
            headers['content-type'] = ('multipart/related; '
                                       'boundary="%s"') % multipart_boundary
            url = _add_query_parameter(url, 'uploadType', 'multipart')

      logger.info('URL being requested: %s' % url)
      return self._requestBuilder(self._http,
                                  model.response,
                                  url,
                                  method=httpMethod,
                                  body=body,
                                  headers=headers,
                                  methodId=methodId,
                                  resumable=resumable)

    docs = [methodDesc.get('description', DEFAULT_METHOD_DOC), '\n\n']
    if len(argmap) > 0:
      docs.append('Args:\n')

    # Skip undocumented params and params common to all methods.
    skip_parameters = rootDesc.get('parameters', {}).keys()
    skip_parameters.extend(STACK_QUERY_PARAMETERS)

    all_args = argmap.keys()
    args_ordered = [key2param(s) for s in methodDesc.get('parameterOrder', [])]

    # Move body to the front of the line.
    if 'body' in all_args:
      args_ordered.append('body')

    for name in all_args:
      if name not in args_ordered:
        args_ordered.append(name)

    for arg in args_ordered:
      if arg in skip_parameters:
        continue

      repeated = ''
      if arg in repeated_params:
        repeated = ' (repeated)'
      required = ''
      if arg in required_params:
        required = ' (required)'
      paramdesc = methodDesc['parameters'][argmap[arg]]
      paramdoc = paramdesc.get('description', 'A parameter')
      if '$ref' in paramdesc:
        docs.append(
            ('  %s: object, %s%s%s\n    The object takes the'
            ' form of:\n\n%s\n\n') % (arg, paramdoc, required, repeated,
              schema.prettyPrintByName(paramdesc['$ref'])))
      else:
        paramtype = paramdesc.get('type', 'string')
        docs.append('  %s: %s, %s%s%s\n' % (arg, paramtype, paramdoc, required,
                                            repeated))
      enum = paramdesc.get('enum', [])
      enumDesc = paramdesc.get('enumDescriptions', [])
      if enum and enumDesc:
        docs.append('    Allowed values\n')
        for (name, desc) in zip(enum, enumDesc):
          docs.append('      %s - %s\n' % (name, desc))
    if 'response' in methodDesc:
      if methodName.endswith('_media'):
        docs.append('\nReturns:\n  The media object as a string.\n\n    ')
      else:
        docs.append('\nReturns:\n  An object of the form:\n\n    ')
        docs.append(schema.prettyPrintSchema(methodDesc['response']))

    setattr(method, '__doc__', ''.join(docs))
    setattr(theclass, methodName, method)

  def createNextMethod(theclass, methodName, methodDesc, rootDesc):
    """Creates any _next methods for attaching to a Resource.

    The _next methods allow for easy iteration through list() responses.

    Args:
      theclass: type, the class to attach methods to.
      methodName: string, name of the method to use.
      methodDesc: object, fragment of deserialized discovery document that
        describes the method.
      rootDesc: object, the entire deserialized discovery document.
    """
    methodName = fix_method_name(methodName)
    methodId = methodDesc['id'] + '.next'

    def methodNext(self, previous_request, previous_response):
      """Retrieves the next page of results.

Args:
  previous_request: The request for the previous page. (required)
  previous_response: The response from the request for the previous page. (required)

Returns:
  A request object that you can call 'execute()' on to request the next
  page. Returns None if there are no more items in the collection.
      """
      # Retrieve nextPageToken from previous_response
      # Use as pageToken in previous_request to create new request.

      if 'nextPageToken' not in previous_response:
        return None

      request = copy.copy(previous_request)

      pageToken = previous_response['nextPageToken']
      parsed = list(urlparse.urlparse(request.uri))
      q = parse_qsl(parsed[4])

      # Find and remove old 'pageToken' value from URI
      newq = [(key, value) for (key, value) in q if key != 'pageToken']
      newq.append(('pageToken', pageToken))
      parsed[4] = urllib.urlencode(newq)
      uri = urlparse.urlunparse(parsed)

      request.uri = uri

      logger.info('URL being requested: %s' % uri)

      return request

    setattr(theclass, methodName, methodNext)

  # Add basic methods to Resource
  if 'methods' in resourceDesc:
    for methodName, methodDesc in resourceDesc['methods'].iteritems():
      createMethod(Resource, methodName, methodDesc, rootDesc)
      # Add in _media methods. The functionality of the attached method will
      # change when it sees that the method name ends in _media.
      if methodDesc.get('supportsMediaDownload', False):
        createMethod(Resource, methodName + '_media', methodDesc, rootDesc)

  # Add in nested resources
  if 'resources' in resourceDesc:

    def createResourceMethod(theclass, methodName, methodDesc, rootDesc):
      """Create a method on the Resource to access a nested Resource.

      Args:
        theclass: type, the class to attach methods to.
        methodName: string, name of the method to use.
        methodDesc: object, fragment of deserialized discovery document that
          describes the method.
        rootDesc: object, the entire deserialized discovery document.
      """
      methodName = fix_method_name(methodName)

      def methodResource(self):
        return _createResource(self._http, self._baseUrl, self._model,
                              self._requestBuilder, self._developerKey,
                              methodDesc, rootDesc, schema)

      setattr(methodResource, '__doc__', 'A collection resource.')
      setattr(methodResource, '__is_resource__', True)
      setattr(theclass, methodName, methodResource)

    for methodName, methodDesc in resourceDesc['resources'].iteritems():
      createResourceMethod(Resource, methodName, methodDesc, rootDesc)

  # Add _next() methods
  # Look for response bodies in schema that contain nextPageToken, and methods
  # that take a pageToken parameter.
  if 'methods' in resourceDesc:
    for methodName, methodDesc in resourceDesc['methods'].iteritems():
      if 'response' in methodDesc:
        responseSchema = methodDesc['response']
        if '$ref' in responseSchema:
          responseSchema = schema.get(responseSchema['$ref'])
        hasNextPageToken = 'nextPageToken' in responseSchema.get('properties',
                                                                 {})
        hasPageToken = 'pageToken' in methodDesc.get('parameters', {})
        if hasNextPageToken and hasPageToken:
          createNextMethod(Resource, methodName + '_next',
                           resourceDesc['methods'][methodName],
                           methodName)

  return Resource()
