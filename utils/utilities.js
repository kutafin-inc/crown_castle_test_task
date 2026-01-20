// utils/waitForPageIdle.js

/**
 * Wait until the page is "idle":
 *  - no pending fetch / XHR requests (tracked by our own counter)
 *  - no DOM mutations for at least `quietMillis`
 *
 * Uses page.waitForFunction under the hood and installs a tracker in the
 * browser context the first time it's called.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} [options]
 * @param {number} [options.timeout=30000]     Max total wait (ms)
 * @param {number} [options.quietMillis=1000]  How long the page must stay quiet (ms)
 * @param {number | "raf"} [options.polling="raf"] Polling mode for waitForFunction
 */
export async function waitForPageIdle(
  page,
  { timeout = 30000, quietMillis = 1000, polling = 'raf' } = {}
) {
  await page.waitForFunction(
    (quietMs) => {
      // This code runs in the browser context

      if (!window.__idleTracker) {
        const tracker = {
          pending: 0,
          lastActivity: Date.now(),
          quietMillis: quietMs
        };

        const mark = () => {
          tracker.lastActivity = Date.now();
        };

        // --- PATCH fetch (if present) --------------------------------------
        const origFetch = window.fetch;
        if (origFetch && !origFetch.__idlePatched) {
          const wrappedFetch = (...args) => {
            tracker.pending++;
            mark();
            return origFetch(...args)
              .finally(() => {
                tracker.pending--;
                mark();
              });
          };
          // small flag so we don't double-wrap if someone else reuses it
          wrappedFetch.__idlePatched = true;
          window.fetch = wrappedFetch;
        }

        // --- PATCH XHR (using subclass, safer) -----------------------------
        const OrigXHR = window.XMLHttpRequest;
        if (OrigXHR && !OrigXHR.prototype.__idlePatched) {
          const origSend = OrigXHR.prototype.send;

          OrigXHR.prototype.send = function patchedSend(...args) {
            if (!this.__idleTracked) {
              this.__idleTracked = true;
              tracker.pending++;
              mark();

              this.addEventListener(
                'loadend',
                () => {
                  tracker.pending = Math.max(0, tracker.pending - 1);
                  mark();
                  this.__idleTracked = false;
                },
                { once: true }
              );
            }

            return origSend.apply(this, args);
          };

          OrigXHR.prototype.__idlePatched = true;
        }

        // --- WATCH DOM MUTATIONS ------------------------------------------
        const observer = new MutationObserver(() => {
          mark();
        });

        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true
          // characterData: true, // enable if you care about text node changes
        });

        // Store tracker so subsequent polls don’t re-install patches
        window.__idleTracker = tracker;
      }

      const t = window.__idleTracker;
      const now = Date.now();
      const quietLongEnough = now - t.lastActivity >= t.quietMillis;

      // Idle condition:
      //  - no pending requests we know about
      //  - and DOM has been quiet for >= quietMillis
      return t.pending === 0 && quietLongEnough;
    },
    quietMillis, // <- quietMs argument for the browser function
    {
      timeout,
      polling
    }
  );
}