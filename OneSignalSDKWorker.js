/* OneSignal Service Worker for Web Push & iOS PWA */
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
try {
  importScripts('./sw.js');
} catch (e) {
  console.log('sw.js load deferred:', e);
}
