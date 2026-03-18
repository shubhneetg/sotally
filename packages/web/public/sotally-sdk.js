/**
 * Sotally SDK — Client-side bridge for apps running in sandboxed iframes.
 * This script is loaded inside every generated app's iframe.
 * It communicates with the parent Sotally platform via postMessage.
 *
 * @version 1.0.0
 */
(function() {
  'use strict';

  const SDK_VERSION = '1.0.0';
  let _initialized = false;
  let _appId = null;
  let _userId = null;
  let _pendingRequests = new Map();
  let _requestCounter = 0;

  // Parent origin validation
  const ALLOWED_ORIGINS = [
    'https://sotally.com',
    'http://localhost:3000',
    'http://localhost',
  ];

  function isAllowedOrigin(origin) {
    return ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith('.sotally.com'));
  }

  function generateRequestId() {
    return 'req-' + (++_requestCounter) + '-' + Date.now();
  }

  function sendToParent(type, payload) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ source: 'sotally-sdk', type, payload }, '*');
    }
  }

  function request(method, args) {
    return new Promise(function(resolve, reject) {
      var id = generateRequestId();
      var timeout = setTimeout(function() {
        _pendingRequests.delete(id);
        reject(new Error('SDK request timed out: ' + method));
      }, 10000);

      _pendingRequests.set(id, { resolve, reject, timeout });

      sendToParent('SDK_CALL', {
        id: id,
        method: method,
        args: args || {},
      });
    });
  }

  // Listen for messages from parent
  window.addEventListener('message', function(event) {
    if (!event.data || event.data.source !== 'sotally-platform') return;

    var msg = event.data;

    if (msg.type === 'SDK_INIT') {
      _appId = msg.payload.appId;
      _userId = msg.payload.userId;
      _initialized = true;
      console.log('[Sotally SDK] Initialized for app:', _appId);
      return;
    }

    if (msg.type === 'SDK_RESPONSE') {
      var pending = _pendingRequests.get(msg.payload.id);
      if (pending) {
        clearTimeout(pending.timeout);
        _pendingRequests.delete(msg.payload.id);
        if (msg.payload.error) {
          pending.reject(new Error(msg.payload.error));
        } else {
          pending.resolve(msg.payload.result);
        }
      }
      return;
    }
  });

  // Public API
  window.Sotally = {
    version: SDK_VERSION,

    isReady: function() {
      return _initialized;
    },

    user: {
      get: function() {
        return request('user.get');
      },
      isAuthenticated: function() {
        return request('user.isAuthenticated');
      },
    },

    data: {
      get: function(key, namespace) {
        return request('data.get', { key: key, namespace: namespace || 'default' });
      },
      set: function(key, value, namespace) {
        return request('data.set', { key: key, value: value, namespace: namespace || 'default' });
      },
      delete: function(key, namespace) {
        return request('data.delete', { key: key, namespace: namespace || 'default' });
      },
      list: function(namespace, prefix) {
        return request('data.list', { namespace: namespace || 'default', prefix: prefix });
      },
    },

    analytics: {
      track: function(event, properties) {
        sendToParent('SDK_EVENT', {
          type: 'analytics.track',
          event: event,
          properties: properties || {},
          timestamp: new Date().toISOString(),
        });
      },
    },

    ui: {
      showToast: function(message, type) {
        sendToParent('SDK_EVENT', {
          type: 'ui.toast',
          message: message,
          toastType: type || 'info',
        });
      },
      resize: function(height) {
        sendToParent('SDK_EVENT', {
          type: 'ui.resize',
          height: height,
        });
      },
    },
  };

  // Notify parent that SDK is ready
  sendToParent('SDK_READY', { version: SDK_VERSION });
})();
