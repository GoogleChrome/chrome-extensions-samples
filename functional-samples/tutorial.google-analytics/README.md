# Google Analytics 4 example

This example demonstrates how to track extension events in Google Analytics 4 using the Measurement Protocol.

## Overview

The example provides guidance on integrating Google Analytics 4 into a Chrome extension using the Measurement Protocol. It includes instructions on obtaining the necessary `measurement_id` and `api_secret` from Google Analytics, and how to add them to the `google-analytics.js` script. The extension allows users to generate analytics events by clicking a button in the extension popup.

## Implementation Notes

_Add any information that doesn't fit elsewhere in the README._

## Running this extension

1. Clone this repository.
2. Get your `api_secret` and the `measurement_id` as described in the [Measurement Protocol documentation](https://developers.google.com/analytics/devguides/collection/protocol/ga4). Add these in [scripts/google-analytics.js](scripts/google-analytics.js):
   ```
   const MEASUREMENT_ID = '<measurement_id>';
   const API_SECRET = '<api_secret>';
   ```
3. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
4. Click the extension icon to open the extension popup and click the button to generate a few analytics events.
   <img src="https://github-production-user-asset-6210df.s3.amazonaws.com/380472/240995103-87cb61a3-d3f9-44d6-9dfa-0e3bf0c11a1e.png" alt="Extension popup" width="200"/>
5. Check out the [real-time report](https://support.google.com/analytics/answer/1638635) to see how the events surface in Google Analytics.
