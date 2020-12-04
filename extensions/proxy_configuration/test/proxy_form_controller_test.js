// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Stub out the `chrome.proxy`, `chrome.i18n`, and `chrome.extension` APIs
chrome = chrome || {
  proxy: {
    settings: {
      get: function() {},
      clear: function() {},
      set: function() {}
    }
  },
  i18n: {
    getMessage: function(x) { return x; }
  },
  extension: {
    sendRequest: function() {},
    isAllowedIncognitoAccess: function(funk) {
      funk(true);
    }
  }
};

var fixture = document.getElementById('fixture');
var baselineHTML = fixture.innerHTML;
var groupIDs = [ProxyFormController.ProxyTypes.DIRECT,
                ProxyFormController.ProxyTypes.SYSTEM,
                ProxyFormController.ProxyTypes.PAC,
                ProxyFormController.ProxyTypes.FIXED];

var mockFunctionFactory = function(returnValue, logging) {
  var called = [];
  returnValue = returnValue || null;

  var funky = function() {
    called.push(arguments);
    if (arguments[1] && typeof(arguments[1]) === 'function') {
      var funk = arguments[1];
      funk(returnValue);
    }
    return returnValue;
  };
  funky.getCallList = function() { return called; };
  funky.getValue = function() { return returnValue; };
  return funky;
};

var proxyform = new Test.Unit.Runner({
  setup: function() {
    fixture.innerHTML = baselineHTML;
    this.controller_ = new ProxyFormController('proxyForm');
    this.clickEvent_ = document.createEvent('MouseEvents');
    this.clickEvent_.initMouseEvent('click', true, true, window,
        0, 0, 0, 0, 0, false, false, false, false, 0, null);
    // Reset mock functions.
    chrome.proxy = {
      settings: {
        get: mockFunctionFactory({
               value: {mode: 'system' },
               levelOfControl: 'controllable_by_this_extension' }),
        clear: mockFunctionFactory({
                 value: {mode: 'system' },
                 levelOfControl: 'controllable_by_this_extension' }),
        set: mockFunctionFactory({
               value: {mode: 'system' },
               levelOfControl: 'controllable_by_this_extension' })
      }
    };
  },

  teardown: function() {
    fixture.removeChild(fixture.childNodes[0]);
    delete(this.controller_);
  },

  // Clicking on various bits of the interface should set correct classes,
  // and select correct radio buttons.
  testActivationClicks: function() {
    var self = this;
    var i;
    groupIDs.forEach(function(id) {
      var group = document.getElementById(id);
      var all = group.querySelectorAll('*');
      for (i = 0; i < all.length; i++) {
        group.classList.remove('active');
        all[i].dispatchEvent(self.clickEvent_);
        self.assert(group.classList.contains('active'));
      }
    });
  },

  // Elements inside an active group should not be disabled, and vice versa
  testDisabledElements: function() {
    var self = this;
    var i, j;
    groupIDs.forEach(function(id) {
      var group = document.getElementById(id);
      var all = group.querySelectorAll('*');
      // First, check that activating a group enables its form elements
      for (i = 0; i < all.length; i++) {
        group.classList.remove('active');
        var inputs = group.querySelectorAll('input:not([type="radio"]),select');
        for (j = 0; j < inputs.length; j++) {
          inputs[j].setAttribute('disabled', 'disabled');
        }
        all[i].dispatchEvent(self.clickEvent_);
        for (j = 0; j < inputs.length; j++) {
          self.assert(!inputs[j].hasAttribute('disabled'));
        }
      }
    });
  },

  // Clicking the "Use single proxy" checkbox should set the correct
  // classes on the form.
  testSingleProxyToggle: function() {
    var group = document.getElementById(
        ProxyFormController.ProxyTypes.FIXED);
    var checkbox = document.getElementById('singleProxyForEverything');
    var section = checkbox.parentNode.parentNode;
    // Checkbox only works in active group, `testActivationClicks` tests
    // the inactive click behavior.
    group.classList.add('active');

    checkbox.checked = false;
    checkbox.dispatchEvent(this.clickEvent_);
    this.assert(section.classList.contains('single'));
    checkbox.dispatchEvent(this.clickEvent_);
    this.assert(!section.classList.contains('single'));
  },

  // On instantiation, ProxyFormController should read the current state
  // from `chrome.proxy.settings.get`, and react accordingly.
  // Let's see if that happens with the next four sets of assertions.
  testSetupFormSystem: function() {
    chrome.proxy.settings.get = mockFunctionFactory({
      value: {mode: 'system'},
      levelOfControl: 'controllable_by_this_extension'
    });

    fixture.innerHTML = baselineHTML;
    this.controller_ = new ProxyFormController('proxyForm');
    // Wait for async calls to fire
    this.wait(100, function() {
      this.assertEqual(
          6,
          chrome.proxy.settings.get.getCallList().length);
      this.assert(
          document.getElementById(ProxyFormController.ProxyTypes.SYSTEM)
              .classList.contains('active'));
    });
  },

  testSetupFormDirect: function() {
    chrome.proxy.settings.get =
        mockFunctionFactory({value: {mode: 'direct'},
             levelOfControl: 'controllable_by_this_extension'}, true);

    fixture.innerHTML = baselineHTML;
    this.controller_ = new ProxyFormController('proxyForm');
    // Wait for async calls to fire
    this.wait(100, function() {
      this.assertEqual(
          2,
          chrome.proxy.settings.get.getCallList().length);
      this.assert(
          document.getElementById(ProxyFormController.ProxyTypes.DIRECT)
              .classList.contains('active'));
    });
  },

  testSetupFormPac: function() {
    chrome.proxy.settings.get =
        mockFunctionFactory({value: {mode: 'pac_script' },
             levelOfControl: 'controllable_by_this_extension'});

    fixture.innerHTML = baselineHTML;
    this.controller_ = new ProxyFormController('proxyForm');
    // Wait for async calls to fire
    this.wait(100, function() {
      this.assertEqual(
          2,
          chrome.proxy.settings.get.getCallList().length);
      this.assert(
          document.getElementById(ProxyFormController.ProxyTypes.PAC)
              .classList.contains('active'));
    });
  },

  testSetupFormFixed: function() {
    chrome.proxy.settings.get =
        mockFunctionFactory({value: {mode: 'fixed_servers' },
             levelOfControl: 'controllable_by_this_extension'});

    fixture.innerHTML = baselineHTML;
    this.controller_ = new ProxyFormController('proxyForm');
    // Wait for async calls to fire
    this.wait(100, function() {
      this.assertEqual(
          2,
          chrome.proxy.settings.get.getCallList().length);
      this.assert(
          document.getElementById(ProxyFormController.ProxyTypes.FIXED)
              .classList.contains('active'));
    });
  },

  // Test that `recalcFormValues_` correctly sets DOM field values when
  // given a `ProxyConfig` structure
  testRecalcFormValuesGroups: function() {
    // Test `AUTO` normalization to `PAC`
    this.controller_.recalcFormValues_({
      mode: ProxyFormController.ProxyTypes.AUTO,
      rules: {},
      pacScript: ''
    });
    this.assert(
        document.getElementById(ProxyFormController.ProxyTypes.PAC)
            .classList.contains('active'));

    // DIRECT
    this.controller_.recalcFormValues_({
      mode: ProxyFormController.ProxyTypes.DIRECT,
      rules: {},
      pacScript: ''
    });
    this.assert(
        document.getElementById(ProxyFormController.ProxyTypes.DIRECT)
            .classList.contains('active'));

    // FIXED
    this.controller_.recalcFormValues_({
      mode: ProxyFormController.ProxyTypes.FIXED,
      rules: {},
      pacScript: ''
    });
    this.assert(
        document.getElementById(ProxyFormController.ProxyTypes.FIXED)
            .classList.contains('active'));

    // PAC
    this.controller_.recalcFormValues_({
      mode: ProxyFormController.ProxyTypes.PAC,
      rules: {},
      pacScript: ''
    });
    this.assert(
        document.getElementById(ProxyFormController.ProxyTypes.PAC)
          .classList.contains('active'));

    // SYSTEM
    this.controller_.recalcFormValues_({
      mode: ProxyFormController.ProxyTypes.SYSTEM,
      rules: {},
      pacScript: ''
    });
    this.assert(
        document.getElementById(ProxyFormController.ProxyTypes.SYSTEM)
          .classList.contains('active'));
  },

  testRecalcFormValuesFixedSingle: function() {
    this.controller_.recalcFormValues_({
      mode: ProxyFormController.ProxyTypes.FIXED,
      rules: {
         singleProxy: {
           scheme: 'socks5',
           host: 'singleproxy.example.com',
           port: '1234'
        }
      }
    });
    var single = this.controller_.singleProxy;
    this.assertEqual('socks5', single.scheme);
    this.assertEqual('singleproxy.example.com', single.host);
    this.assertEqual(1234, single.port);
  },

  testRecalcFormValuesPacScript: function() {
    this.controller_.recalcFormValues_({
      mode: ProxyFormController.ProxyTypes.PAC,
      rules: {},
      pacScript: {url: 'http://example.com/this/is/a/pac.script'}
    });
    this.assertEqual(
        'http://example.com/this/is/a/pac.script',
        document.getElementById('autoconfigURL').value);
  },

  testRecalcFormValuesSingle: function() {
    this.controller_.recalcFormValues_({
       mode: ProxyFormController.ProxyTypes.FIXED,
       rules: {
         singleProxy: {
           scheme: 'https',
           host: 'example.com',
           port: 80
        }
      }
    });
    // Single!
    this.assert(
      document.querySelector('#' + ProxyFormController.ProxyTypes.FIXED +
          ' > section').classList.contains('single'));

    var single = this.controller_.singleProxy;
    this.assertEqual('https', single.scheme);
    this.assertEqual('example.com', single.host);
    this.assertEqual(80, single.port);
  },

  testRecalcFormValuesMultiple: function() {
    this.controller_.recalcFormValues_({
       mode: ProxyFormController.ProxyTypes.FIXED,
       rules: {
         proxyForHttp: {
           scheme: 'http',
           host: 'http.example.com',
           port: 1
        },
         proxyForHttps: {
           scheme: 'https',
           host: 'https.example.com',
           port: 2
        },
         proxyForFtp: {
           scheme: 'socks4',
           host: 'socks4.example.com',
           port: 3
        },
         fallbackProxy: {
           scheme: 'socks5',
           host: 'socks5.example.com',
           port: 4
        }
      }
    });
    // Not Single!
    this.assert(
      !document.querySelector('#' + ProxyFormController.ProxyTypes.FIXED
          + ' > section').classList.contains('single'));
    var server = this.controller_.singleProxy;
    this.assertNull(server);

    server = this.controller_.httpProxy;
    this.assertEqual('http', server.scheme);
    this.assertEqual('http.example.com', server.host);
    this.assertEqual(1, server.port);

    server = this.controller_.httpsProxy;
    this.assertEqual('https', server.scheme);
    this.assertEqual('https.example.com', server.host);
    this.assertEqual(2, server.port);

    server = this.controller_.ftpProxy;
    this.assertEqual('socks4', server.scheme);
    this.assertEqual('socks4.example.com', server.host);
    this.assertEqual(3, server.port);

    server = this.controller_.fallbackProxy;
    this.assertEqual('socks5', server.scheme);
    this.assertEqual('socks5.example.com', server.host);
    this.assertEqual(4, server.port);
  },

  testBypassList: function() {
    this.controller_.bypassList = ['1.example.com',
                                   '2.example.com',
                                   '3.example.com'];
    this.assertEnumEqual(
        document.getElementById('bypassList').value,
        '1.example.com, 2.example.com, 3.example.com');
    this.assertEnumEqual(
        this.controller_.bypassList,
        ['1.example.com', '2.example.com', '3.example.com']);
  },

  // Test that "system" rules are correctly generated
  testProxyRulesGenerationSystem: function() {
    this.controller_.changeActive_(
        document.getElementById(ProxyFormController.ProxyTypes.SYSTEM));

    this.assertHashEqual(
        {mode: 'system'},
        this.controller_.generateProxyConfig_());
  },

  // Test that "direct" rules are correctly generated
  testProxyRulesGenerationDirect: function() {
    this.controller_.changeActive_(
        document.getElementById(ProxyFormController.ProxyTypes.DIRECT));

    this.assertHashEqual(
        {mode: 'direct'},
        this.controller_.generateProxyConfig_());
  },

  // Test that auto detection rules are correctly generated when "automatic"
  // is selected, and no PAC file URL is given
  testProxyRulesGenerationAuto: function() {
    this.controller_.changeActive_(
        document.getElementById(ProxyFormController.ProxyTypes.PAC));

    this.assertHashEqual(
        {mode: 'auto_detect'},
        this.controller_.generateProxyConfig_());
  },

  // Test that PAC URL rules are correctly generated when "automatic"
  // is selected, and a PAC file URL is given
  testProxyRulesGenerationPacURL: function() {
    this.controller_.changeActive_(
        document.getElementById(ProxyFormController.ProxyTypes.PAC));
    this.controller_.pacURL = 'http://example.com/pac.pac';
    var result = this.controller_.generateProxyConfig_();
    this.assertEqual('pac_script', result.mode);
    this.assertEqual('http://example.com/pac.pac', result.pacScript.url);
  },

  // Manual PAC definitions
  testProxyRulesGenerationPacData: function() {
    var pacData = 'function FindProxyForURL(url,host) { return "DIRECT"; }';
    this.controller_.changeActive_(
        document.getElementById(ProxyFormController.ProxyTypes.PAC));
    this.controller_.manualPac = pacData;
    var result = this.controller_.generateProxyConfig_();
    this.assertEqual('pac_script', result.mode);
    this.assertEqual(pacData, result.pacScript.data);
  },

  // PAC URLs override manual PAC definitions
  testProxyRulesGenerationPacURLOverridesData: function() {
    this.controller_.changeActive_(
        document.getElementById(ProxyFormController.ProxyTypes.PAC));
    this.controller_.pacURL = 'http://example.com/pac.pac';
    this.controller_.manualPac =
        'function FindProxyForURL(url,host) { return "DIRECT"; }';
    var result = this.controller_.generateProxyConfig_();
    this.assertEqual('pac_script', result.mode);
    this.assertEqual('http://example.com/pac.pac', result.pacScript.url);
  },

  // Test that fixed, manual servers are correctly transformed into a
  // `ProxyRules` structure.
  testProxyRulesGenerationSingle: function() {
    this.controller_.changeActive_(
        document.getElementById(ProxyFormController.ProxyTypes.FIXED));

    this.controller_.singleProxy = {
      scheme: 'http',
      host: 'example.com',
      port: '80'
    };

    var result = this.controller_.generateProxyConfig_();
    this.assertEqual('fixed_servers', result.mode);
    this.assertEqual('http', result.rules.singleProxy.scheme);
    this.assertEqual('example.com', result.rules.singleProxy.host);
    this.assertEqual(80, result.rules.singleProxy.port);
    this.assertEqual(undefined, result.rules.proxyForHttp);
    this.assertEqual(undefined, result.rules.proxyForHttps);
    this.assertEqual(undefined, result.rules.proxyForFtp);
    this.assertEqual(undefined, result.rules.fallbackProxy);
  },

  // Test that proxy configuration rules are correctly generated
  // for separate manually entered servers.
  testProxyRulesGenerationSeparate: function() {
    this.controller_.changeActive_(
        document.getElementById(ProxyFormController.ProxyTypes.FIXED));

    this.controller_.singleProxy = false;
    this.controller_.httpProxy = {
      scheme: 'http',
      host: 'http.example.com',
      port: 80
    };
    this.controller_.httpsProxy = {
      scheme: 'https',
      host: 'https.example.com',
      port: 443
    };
    this.controller_.ftpProxy = {
      scheme: 'socks4',
      host: 'ftp.example.com',
      port: 80
    };
    this.controller_.fallbackProxy = {
      scheme: 'socks5',
      host: 'fallback.example.com',
      port: 80
    };

    var result = this.controller_.generateProxyConfig_();
    this.assertEqual('fixed_servers', result.mode);
    this.assertEqual(undefined, result.rules.singleProxy);
    this.assertEqual('http', result.rules.proxyForHttp.scheme);
    this.assertEqual('http.example.com', result.rules.proxyForHttp.host);
    this.assertEqual('80', result.rules.proxyForHttp.port);
    this.assertEqual('https', result.rules.proxyForHttps.scheme);
    this.assertEqual('https.example.com', result.rules.proxyForHttps.host);
    this.assertEqual('443', result.rules.proxyForHttps.port);
    this.assertEqual('socks4', result.rules.proxyForFtp.scheme);
    this.assertEqual('ftp.example.com', result.rules.proxyForFtp.host);
    this.assertEqual('80', result.rules.proxyForFtp.port);
    this.assertEqual('socks5', result.rules.fallbackProxy.scheme);
    this.assertEqual('fallback.example.com', result.rules.fallbackProxy.host);
    this.assertEqual('80', result.rules.fallbackProxy.port);
  }
}, { testLog: 'proxyformcontrollerlog' });

var c = new ProxyFormController('proxyForm');
