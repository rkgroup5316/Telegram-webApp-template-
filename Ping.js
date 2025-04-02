/**
 * ping.js - v0.2.2
 * Lightweight ping utility for checking endpoint availability
 */
;(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      define([], factory);
    } else if (typeof module === 'object' && module.exports) {
      module.exports = factory();
    } else {
      root.ping = factory();
    }
  }(this, function() {
    
    /**
     * Creates a ping instance.
     * @returns {PingService}
     */
    function Ping() {
      // Default settings
      const defaults = {
        timeout: 5000,
        logFailed: true
      };
      
      /**
       * Pings a URL.
       * @param {Object} options - Configuration options
       * @param {string} options.url - URL to ping
       * @param {number} [options.timeout=5000] - Timeout in milliseconds
       * @param {boolean} [options.logFailed=true] - Whether to log failed pings
       * @param {Function} [options.onSuccess] - Success callback
       * @param {Function} [options.onFail] - Fail callback
       * @param {Function} [options.onError] - Error callback (for exceptions)
       */
      this.ping = function(options) {
        const settings = Object.assign({}, defaults, options);
        
        // Ping methods in order of preference
        const methods = [
          pingFetch,
          pingXhr,
          pingImage
        ];
        
        // Try each method in sequence until one succeeds or all fail
        tryNextMethod(0);
        
        function tryNextMethod(index) {
          if (index >= methods.length) {
            // All methods failed
            if (settings.logFailed) {
              console.warn(`All ping methods failed for URL: ${settings.url}`);
            }
            if (settings.onFail) {
              settings.onFail();
            }
            return;
          }
          
          methods[index](settings, function(success) {
            if (success) {
              if (settings.onSuccess) {
                settings.onSuccess();
              }
            } else {
              // Try next method
              tryNextMethod(index + 1);
            }
          });
        }
      };
      
      /**
       * Ping using fetch API (modern browsers)
       */
      function pingFetch(settings, callback) {
        if (!window.fetch) {
          callback(false);
          return;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), settings.timeout);
        
        fetch(settings.url, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal
        }).then(() => {
          clearTimeout(timeoutId);
          callback(true);
        }).catch((error) => {
          clearTimeout(timeoutId);
          if (settings.logFailed) {
            console.warn(`Fetch ping failed for ${settings.url}:`, error);
          }
          callback(false);
        });
      }
      
      /**
       * Ping using XMLHttpRequest (legacy support)
       */
      function pingXhr(settings, callback) {
        const xhr = new XMLHttpRequest();
        
        // Setup timeout
        xhr.timeout = settings.timeout;
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            callback(true);
          }
        };
        
        xhr.ontimeout = function() {
          if (settings.logFailed) {
            console.warn(`XHR ping timed out for ${settings.url}`);
          }
          callback(false);
        };
        
        xhr.onerror = function() {
          if (settings.logFailed) {
            console.warn(`XHR ping failed for ${settings.url}`);
          }
          callback(false);
        };
        
        try {
          xhr.open('HEAD', settings.url, true);
          xhr.send();
        } catch (error) {
          if (settings.logFailed) {
            console.warn(`XHR ping exception for ${settings.url}:`, error);
          }
          callback(false);
        }
      }
      
      /**
       * Ping using Image (most compatible)
       */
      function pingImage(settings, callback) {
        const img = new Image();
        
        // Handle success
        img.onload = function() {
          callback(true);
        };
        
        // Handle failure
        img.onerror = function() {
          if (settings.logFailed) {
            console.warn(`Image ping failed for ${settings.url}`);
          }
          callback(false);
        };
        
        // Handle timeout
        const timeoutId = setTimeout(function() {
          img.src = '';  // Cancel the request
          if (settings.logFailed) {
            console.warn(`Image ping timed out for ${settings.url}`);
          }
          callback(false);
        }, settings.timeout);
        
        // Start the ping
        img.src = `${settings.url}${/\?/.test(settings.url) ? '&' : '?'}ping=${Date.now()}`;
      }
    }
    
    return new Ping();
  }));