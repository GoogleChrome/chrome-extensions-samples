import { describe, it, afterEach } from 'mocha';
import assert from 'assert';
import sinon from 'sinon';
import { ReflectionKind } from 'typedoc';
import {
  fetchChromeTypes,
  toExtensionApiMap
} from '../../src/prepare-chrome-types';

describe('Prepare Chrome Types', function () {
  describe('fetchChromeTypes()', function () {
    const originalBucket = process.env.STORAGE_BUCKET;

    afterEach(function () {
      sinon.restore();
      if (originalBucket === undefined) {
        delete process.env.STORAGE_BUCKET;
      } else {
        process.env.STORAGE_BUCKET = originalBucket;
      }
    });

    it('should throw when STORAGE_BUCKET is not set', async function () {
      delete process.env.STORAGE_BUCKET;
      await assert.rejects(fetchChromeTypes(), {
        message: 'The STORAGE_BUCKET environment variable must be set.'
      });
    });

    it('should request the types from the configured bucket', async function () {
      process.env.STORAGE_BUCKET = 'a-bucket';
      const fetchStub = sinon
        .stub(globalThis, 'fetch')
        .resolves(new Response('{}'));

      await fetchChromeTypes();

      assert.equal(fetchStub.callCount, 1);
      assert.equal(
        fetchStub.firstCall.args[0],
        'https://storage.googleapis.com/download/storage/v1/b/a-bucket/o/chrome-types.json?alt=media'
      );
    });

    it('should return the parsed response body', async function () {
      process.env.STORAGE_BUCKET = 'a-bucket';
      sinon
        .stub(globalThis, 'fetch')
        .resolves(new Response('{"action":{"_type":{"properties":[]}}}'));

      const result = await fetchChromeTypes();

      assert.deepEqual(result, { action: { _type: { properties: [] } } });
    });
  });

  describe('toExtensionApiMap()', function () {
    it('should sort properties, methods, events and types', function () {
      const result = toExtensionApiMap({
        action: {
          _type: {
            properties: [
              { name: 'aProperty', kind: ReflectionKind.Property },
              { name: 'aMethod', kind: ReflectionKind.Method, signatures: [] },
              {
                name: 'onClicked',
                kind: ReflectionKind.Property,
                type: { type: 'reference', name: 'events.Event' }
              },
              { name: 'ATypeName', kind: ReflectionKind.TypeAlias }
            ]
          }
        }
      });

      assert.deepEqual(result, {
        action: {
          properties: ['aProperty'],
          methods: ['aMethod'],
          types: ['ATypeName'],
          events: ['onClicked']
        }
      });
    });

    it('should treat every known event reference name as an event', function () {
      const result = toExtensionApiMap({
        events: {
          _type: {
            properties: [
              {
                name: 'custom',
                kind: ReflectionKind.Property,
                type: { type: 'reference', name: 'CustomChromeEvent' }
              },
              {
                name: 'namespaced',
                kind: ReflectionKind.Property,
                type: { type: 'reference', name: 'events.Event' }
              },
              {
                name: 'bare',
                kind: ReflectionKind.Property,
                type: { type: 'reference', name: 'Event' }
              },
              {
                name: 'notAnEvent',
                kind: ReflectionKind.Property,
                type: { type: 'reference', name: 'SomethingElse' }
              }
            ]
          }
        }
      });

      assert.deepEqual(result.events, {
        properties: ['notAnEvent'],
        methods: [],
        types: [],
        events: ['custom', 'namespaced', 'bare']
      });
    });

    it('should classify a property that also has signatures as a method', function () {
      const result = toExtensionApiMap({
        action: {
          _type: {
            properties: [
              {
                name: 'both',
                kind: ReflectionKind.Property,
                type: { type: 'reference', name: 'events.Event' },
                signatures: []
              }
            ]
          }
        }
      });

      assert.deepEqual(result.action, {
        properties: [],
        methods: ['both'],
        types: [],
        events: []
      });
    });

    it('should handle multiple namespaces and an empty input', function () {
      assert.deepEqual(toExtensionApiMap({}), {});

      const result = toExtensionApiMap({
        action: {
          _type: {
            properties: [{ name: 'a', kind: ReflectionKind.Property }]
          }
        },
        storage: {
          _type: {
            properties: [{ name: 'b', kind: ReflectionKind.Method, signatures: [] }]
          }
        }
      });

      assert.deepEqual(Object.keys(result), ['action', 'storage']);
      assert.deepEqual(result.action.properties, ['a']);
      assert.deepEqual(result.storage.methods, ['b']);
    });
  });
});
