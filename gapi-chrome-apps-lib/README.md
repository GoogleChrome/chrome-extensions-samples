# Google API javascript client library loader for Chrome Packaged Apps

Provides the Google API javascript client 'gapi' as
appropriate for hosted websites, or if in a Chrome packaged
app implement a minimal set of functionality that is Content
Security Policy compliant and uses the chrome identity api.

## Status

This library is likely not suitable for use without additional modifications.

## Usage

To be expanded upon, but essentially:
- Add 'identity' permission to manifest.
- Reference this script instead of the apis.google.com online version.
- Call gapi methods as usual.

## Resources

* [JavaScript Client Library Reference](https://developers.google.com/api-client-library/javascript/reference/referencedocs)

