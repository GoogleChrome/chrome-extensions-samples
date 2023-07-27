# Sample List Generator

## Overview

It's a script that generates `./extension-samples.json` with the list of all the samples available. Currently, this JSON will be provided to [developer.chrome.com](https://developer.chrome.com) for generating a list page containing all the samples. This allows developers to quickly find the sample they want to reference.

## How to use

### Install dependencies

```bash
npm install
```

### Run prefetch script (optional)

The prefetch script will generate a list of all the available extension apis on [developer.chrome.com](https://developer.chrome.com/docs/extensions/reference) and save it to `./extension-apis.json`.

The file `./extension-apis.json` will be committed so you don't need to run this script unless you want to update the list.

```bash
npm run prepare-chrome-types
```

### Run the generator

```bash
npm start
```

### Run the tests

```bash
npm test
```

## Types

```ts
type ApiTypeResult = 'event' | 'method' | 'property' | 'type' | 'unknown';

interface ApiItem {
  type: ApiTypeResult;
  namespace: string;
  propertyName: string;
}

interface SampleItem {
  type: 'API_SAMPLE' | 'FUNCTIONAL_SAMPLE';
  name: string;
  title: string;
  description: string;
  repo_link: string;
  apis: ApiItem[];
  permissions: string[];
}

// the type of extension-samples.json file is SampleItem[]
```

## Example

Here is an example of the generated `extension-samples.json` file:

```json
[
  {
    "type": "API_SAMPLE",
    "name": "alarms",
    "title": "Alarms API Demo",
    "description": "",
    "repo_link": "https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples/alarms",
    "permissions": ["alarms"],
    "apis": [
      {
        "type": "event",
        "namespace": "runtime",
        "propertyName": "onInstalled"
      },
      {
        "type": "event",
        "namespace": "action",
        "propertyName": "onClicked"
      },
      {
        "type": "event",
        "namespace": "alarms",
        "propertyName": "onAlarm"
      },
      {
        "type": "type",
        "namespace": "runtime",
        "propertyName": "OnInstalledReason"
      },
      {
        "type": "method",
        "namespace": "alarms",
        "propertyName": "create"
      },
      {
        "type": "method",
        "namespace": "tabs",
        "propertyName": "create"
      },
      {
        "type": "method",
        "namespace": "alarms",
        "propertyName": "clear"
      },
      {
        "type": "method",
        "namespace": "alarms",
        "propertyName": "clearAll"
      },
      {
        "type": "method",
        "namespace": "alarms",
        "propertyName": "getAll"
      }
    ]
  },
  {
    "type": "FUNCTIONAL_SAMPLE",
    "name": "tutorial.getting-started",
    "title": "Getting Started Example",
    "description": "Build an Extension!",
    "repo_link": "https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/tutorial.getting-started",
    "permissions": ["storage", "activeTab", "scripting"],
    "apis": [
      {
        "type": "event",
        "namespace": "runtime",
        "propertyName": "onInstalled"
      },
      {
        "type": "property",
        "namespace": "storage",
        "propertyName": "sync"
      },
      {
        "type": "method",
        "namespace": "tabs",
        "propertyName": "query"
      },
      {
        "type": "method",
        "namespace": "scripting",
        "propertyName": "executeScript"
      }
    ]
  }
]
```
