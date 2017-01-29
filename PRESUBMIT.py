# Copyright 2013 Google Inc. All rights reserved.
# Use of this source code is governed by the Apache license that can be
# found in the LICENSE file.

"""Presubmit checks for tavern fork of pub subtree."""

import subprocess
import sys
from git_cl import Changelist
import tempfile
import os


def CheckChangeOnUpload(input_api, output_api):
  """Checks that the main dart2js target has been run"""
  results = []

  results += input_api.canned_checks.CheckLongLines(
      input_api, output_api, 80)
  results += input_api.canned_checks.CheckChangeHasNoCrAndHasOnlyOneEol(
      input_api, output_api)
  results += input_api.canned_checks.CheckChangeTodoHasOwner(
      input_api, output_api)
  results += input_api.canned_checks.CheckChangeHasNoStrayWhitespace(
      input_api, output_api)
  results += input_api.canned_checks.CheckChangeHasNoTabs(
      input_api, output_api)

  return results

def _WriteTemporaryFile(data):
  f = tempfile.NamedTemporaryFile('w')
  f.write(data)
  f.flush()
  os.fsync(f)
  return f


def _CheckLocalBranchMatchesPatchset(input_api, output_api):
  issue = input_api.change.issue
  cl = Changelist(issue=issue)
  patch_set = cl.GetMostRecentPatchset()

  patch_set_diff = cl.GetPatchSetDiff(issue, patch_set)
  local_diff = subprocess.check_output(['git', 'diff', 'origin/master'])

  with _WriteTemporaryFile(patch_set_diff) as patch_set_diff_file:
    with _WriteTemporaryFile(local_diff) as local_diff_file:
      diff_diff = subprocess.check_output(
          ['interdiff', patch_set_diff_file.name, local_diff_file.name])

  if diff_diff:
    return [output_api.PresubmitError(
        'Local branch does not match patch set %s for issue %s. '
        'Revert or upload new changes to branch to resolve.\n\n%s' %
        (patch_set, issue, diff_diff))]
  return []

def CheckChangeOnCommit(input_api, output_api):
  """Checks that the CL got an lgtm, and sets the current branch's remote to
  'origin' so that 'git cl push' pushes to the Github repo."""
  results = []
  checks = input_api.canned_checks

  results.extend(checks.CheckChangeWasUploaded(input_api, output_api))
  if not results:
    results.extend(_CheckLocalBranchMatchesPatchset(input_api, output_api))

  if not results:
    results.extend(checks.CheckOwners(input_api, output_api))

  if not results:
    branch = subprocess.check_output(
        ['git', 'rev-parse', '--abbrev-ref', 'HEAD']).strip()
    remote = subprocess.check_output(
        ['git', 'config', 'branch.%s.remote' % branch]).strip()
    if (remote != 'origin'):
      set_remote = raw_input(
          'Remote (%s) should be set to \'origin\', set it now [y|n]?' % remote)
      if (set_remote.startswith('y')):
        subprocess.check_output(
            ['git', 'config', 'branch.%s.remote' % branch, 'origin'])
      else:
        results.append(output_api.PresubmitError(
            'Remote must be set to \'origin\' to push to Github.'))

  return results
