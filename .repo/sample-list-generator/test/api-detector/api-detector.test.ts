import { describe, it, beforeEach } from 'mocha';
import assert from 'assert';
import sinon from 'sinon';
import {
  getApiType,
  extractApiCalls,
  getApiItem
} from '../../src/libs/api-detector';

describe('API Detector', function () {
  beforeEach(function () {
    sinon.reset();
  });

  describe('extractApiCalls()', function () {
    it('should return correct api list for sample file (normal)', async function () {
      const file = `
        let a = 1;
        let b = chrome.action.getBadgeText();
        let c = chrome.action.setBadgeText(a);

        chrome.action.onClicked.addListener(function (tab) {
          console.log('clicked');
        });

        alert(chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT)
      `;
      const result = await extractApiCalls(file);
      assert.deepEqual(result, [
        {
          namespace: 'action',
          propertyName: 'getBadgeText',
          type: 'method'
        },
        {
          namespace: 'action',
          propertyName: 'setBadgeText',
          type: 'method'
        },
        {
          namespace: 'action',
          propertyName: 'onClicked',
          type: 'event'
        },
        {
          namespace: 'contextMenus',
          propertyName: 'ACTION_MENU_TOP_LEVEL_LIMIT',
          type: 'property'
        }
      ]);
    });

    it('should return correct api list for sample file (storage)', async function () {
      const file = `
        let b = await chrome.storage.local.get();
        let c = await chrome.storage.sync.get();
        let d = await chrome.storage.managed.get();
        let e = await chrome.storage.session.get();
        let f = await chrome.storage.onChanged.addListener();
      `;
      const result = await extractApiCalls(file);
      assert.deepEqual(result, [
        {
          namespace: 'storage',
          propertyName: 'local',
          type: 'property'
        },
        {
          namespace: 'storage',
          propertyName: 'sync',
          type: 'property'
        },
        {
          namespace: 'storage',
          propertyName: 'managed',
          type: 'property'
        },
        {
          namespace: 'storage',
          propertyName: 'session',
          type: 'property'
        },
        {
          namespace: 'storage',
          propertyName: 'onChanged',
          type: 'event'
        }
      ]);
    });

    it('should return correct api list for sample file (async)', async function () {
      const file = `
        let a = 1;
        let b = await chrome.action.getBadgeText();
        await chrome.action.setBadgeText(a);
      `;
      const result = await extractApiCalls(file);
      assert.deepEqual(result, [
        {
          namespace: 'action',
          propertyName: 'getBadgeText',
          type: 'method'
        },
        {
          namespace: 'action',
          propertyName: 'setBadgeText',
          type: 'method'
        }
      ]);
    });

    it('should return correct api list for sample file (special case)', async function () {
      const file = `
        let a = 1;
        let b = await chrome.system.cpu.getInfo();
        chrome.devtools.network.onRequestFinished.addListener(
          function(request) {
            if (request.response.bodySize > 40*1024) {
              chrome.devtools.inspectedWindow.eval(
                  'console.log("Large image: " + unescape("' +
                  escape(request.request.url) + '"))');
            }
          }
        );
      `;

      const result = await extractApiCalls(file);
      assert.deepEqual(result, [
        {
          namespace: 'system.cpu',
          propertyName: 'getInfo',
          type: 'method'
        },
        {
          namespace: 'devtools.network',
          propertyName: 'onRequestFinished',
          type: 'event'
        },
        {
          namespace: 'devtools.inspectedWindow',
          propertyName: 'eval',
          type: 'method'
        }
      ]);
    });
  });

  describe('getApiType()', function () {
    it('should return correct type of api in normal case', function () {
      let apiType = getApiType('action', 'getBadgeText');
      assert.equal(apiType, 'method');
    });

    it('should return correct type of api in special case', function () {
      let apiType = getApiType('devtools.network', 'onNavigated');
      assert.equal(apiType, 'event');
    });

    it('should return unknown when api not found', function () {
      let apiType = getApiType('action', '123');
      assert.equal(apiType, 'unknown');
    });
  });

  describe('getApiItem()', function () {
    it('should return correct api item', function () {
      let apiItem = getApiItem(['action', 'getBadgeText']);
      assert.deepEqual(apiItem, {
        namespace: 'action',
        propertyName: 'getBadgeText'
      });
    });

    it('should return correct api item (storage)', function () {
      let apiItem = getApiItem(['storage', 'sync', 'get']);
      assert.deepEqual(apiItem, {
        namespace: 'storage',
        propertyName: 'sync'
      });

      apiItem = getApiItem(['storage', 'sync', 'onChanged']);
      assert.deepEqual(apiItem, {
        namespace: 'storage',
        propertyName: 'sync'
      });

      apiItem = getApiItem(['storage', 'onChanged']);
      assert.deepEqual(apiItem, {
        namespace: 'storage',
        propertyName: 'onChanged'
      });
    });

    it('should return correct api item (special case)', function () {
      let apiItem = getApiItem([
        'devtools',
        'network',
        'onRequestFinished',
        'addListener'
      ]);
      assert.deepEqual(apiItem, {
        namespace: 'devtools.network',
        propertyName: 'onRequestFinished'
      });
    });
  });
});
