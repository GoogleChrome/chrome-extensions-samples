#!/usr/bin/env python
#
# Copyright 2010 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""Common utility library."""

__author__ = ['rafek@google.com (Rafe Kaplan)',
              'guido@google.com (Guido van Rossum)',
]
__all__ = [
  'positional',
]

import gflags
import inspect
import logging

logger = logging.getLogger(__name__)

FLAGS = gflags.FLAGS

gflags.DEFINE_enum('positional_parameters_enforcement', 'WARNING',
    ['EXCEPTION', 'WARNING', 'IGNORE'],
    'The action when an oauth2client.util.positional declaration is violated.')


def positional(max_positional_args):
  """A decorator to declare that only the first N arguments my be positional.

  This decorator makes it easy to support Python 3 style key-word only
  parameters.  For example, in Python 3 it is possible to write:

    def fn(pos1, *, kwonly1=None, kwonly1=None):
      ...

  All named parameters after * must be a keyword:

    fn(10, 'kw1', 'kw2')  # Raises exception.
    fn(10, kwonly1='kw1')  # Ok.

  Example:
    To define a function like above, do:

      @positional(1)
      def fn(pos1, kwonly1=None, kwonly2=None):
        ...

    If no default value is provided to a keyword argument, it becomes a required
    keyword argument:

      @positional(0)
      def fn(required_kw):
        ...

    This must be called with the keyword parameter:

      fn()  # Raises exception.
      fn(10)  # Raises exception.
      fn(required_kw=10)  # Ok.

    When defining instance or class methods always remember to account for
    'self' and 'cls':

      class MyClass(object):

        @positional(2)
        def my_method(self, pos1, kwonly1=None):
          ...

        @classmethod
        @positional(2)
        def my_method(cls, pos1, kwonly1=None):
          ...

  The positional decorator behavior is controlled by the
  --positional_parameters_enforcement flag. The flag may be set to 'EXCEPTION',
  'WARNING' or 'IGNORE' to raise an exception, log a warning, or do nothing,
  respectively, if a declaration is violated.

  Args:
    max_positional_arguments: Maximum number of positional arguments.  All
      parameters after the this index must be keyword only.

  Returns:
    A decorator that prevents using arguments after max_positional_args from
    being used as positional parameters.

  Raises:
    TypeError if a key-word only argument is provided as a positional parameter,
    but only if the --positional_parameters_enforcement flag is set to
    'EXCEPTION'.
  """
  def positional_decorator(wrapped):
    def positional_wrapper(*args, **kwargs):
      if len(args) > max_positional_args:
        plural_s = ''
        if max_positional_args != 1:
          plural_s = 's'
        message = '%s() takes at most %d positional argument%s (%d given)' % (
            wrapped.__name__, max_positional_args, plural_s, len(args))
        if FLAGS.positional_parameters_enforcement == 'EXCEPTION':
          raise TypeError(message)
        elif FLAGS.positional_parameters_enforcement == 'WARNING':
          logger.warning(message)
        else: # IGNORE
          pass
      return wrapped(*args, **kwargs)
    return positional_wrapper

  if isinstance(max_positional_args, (int, long)):
    return positional_decorator
  else:
    args, _, _, defaults = inspect.getargspec(max_positional_args)
    return positional(len(args) - len(defaults))(max_positional_args)
