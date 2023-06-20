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
npm run prefetch
```

### Run the generator

```bash
npm start
```

## Types

```ts
type TApiTypeResult = 'event' | 'method' | 'property' | 'type' | 'unknown';

interface IApiItem {
  type: TApiTypeResult;
  catagory: string;
  name: string;
}

interface ISampleItem {
  type: 'API_SAMPLE' | 'FUNCTIONAL_SAMPLE';
  name: string;
  title: string;
  description: string;
  repo_link: string;
  apis: IApiItem[];
  permissions: string[];
}

// the type of extension-samples.json file is ISampleItem[]
```

## Example

```json
// extension-samples.json

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
        "catagory": "runtime",
        "name": "onInstalled"
      },
      {
        "type": "event",
        "catagory": "action",
        "name": "onClicked"
      },
      {
        "type": "event",
        "catagory": "alarms",
        "name": "onAlarm"
      },
      {
        "type": "type",
        "catagory": "runtime",
        "name": "OnInstalledReason"
      },
      {
        "type": "method",
        "catagory": "alarms",
        "name": "create"
      },
      {
        "type": "method",
        "catagory": "tabs",
        "name": "create"
      },
      {
        "type": "method",
        "catagory": "alarms",
        "name": "clear"
      },
      {
        "type": "method",
        "catagory": "alarms",
        "name": "clearAll"
      },
      {
        "type": "method",
        "catagory": "alarms",
        "name": "getAll"
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
        "catagory": "runtime",
        "name": "onInstalled"
      },
      {
        "type": "property",
        "catagory": "storage",
        "name": "sync"
      },
      {
        "type": "method",
        "catagory": "tabs",
        "name": "query"
      },
      {
        "type": "method",
        "catagory": "scripting",
        "name": "executeScript"
      }
    ]
  }
]
```
