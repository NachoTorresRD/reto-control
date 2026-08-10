/* ═══════════════════════════════════════════════════
   ONESIGNAL CENTRALIZED SERVICE MODULE
   App ID: 8ff58aa1-6626-410c-bfe1-29f07ecc17db
   Web SDK: v16 (Stable Track 160609)
═══════════════════════════════════════════════════ */

const ONESIGNAL_APP_ID = "8ff58aa1-6626-410c-bfe1-29f07ecc17db";
let _verificationModalShown = false;

/**
 * Centralized OneSignal Service Manager
 */
export const OneSignalService = {
  appId: ONESIGNAL_APP_ID,

  /**
   * Initializes the OneSignal Web SDK v16 asynchronously
   */
  async init() {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
          },
          serviceWorkerParam: {
            scope: "/"
          },
          serviceWorkerPath: "OneSignalSDKWorker.js"
        });

        console.log("✓ OneSignal Web SDK initialized successfully with App ID:", ONESIGNAL_APP_ID);

        // Setup Subscription Observer & Verification Dialog Flow
        OneSignalService.setupSubscriptionObserver(OneSignal);

      } catch (err) {
        console.error("Error initializing OneSignal Web SDK:", err);
      }
    });
  },

  /**
   * Sets up the Push Subscription observer to verify server registration & trigger prompt flow
   */
  setupSubscriptionObserver(OneSignal) {
    if (!OneSignal || !OneSignal.User || !OneSignal.User.PushSubscription) return;

    const checkSubscriptionAndShowVerification = (subscriptionId) => {
      const isRealId = subscriptionId && 
                       typeof subscriptionId === 'string' && 
                       subscriptionId.trim().length > 0 && 
                       !subscriptionId.startsWith('local-');

      const alreadyVerified = localStorage.getItem('onesignal_verification_dialog_shown') === 'true';

      if (isRealId && !alreadyVerified && !_verificationModalShown) {
        _verificationModalShown = true;
        localStorage.setItem('onesignal_verification_dialog_shown', 'true');
        OneSignalService.showVerificationDialog(OneSignal);
      }
    };

    // Evaluate subscription ID on initial load
    const currentSubId = OneSignal.User.PushSubscription.id;
    checkSubscriptionAndShowVerification(currentSubId);

    // Observe subscription changes over time
    OneSignal.User.PushSubscription.addEventListener("change", (event) => {
      const newSubId = event.current.id;
      checkSubscriptionAndShowVerification(newSubId);
    });
  },

  /**
   * Displays the required OneSignal Push Subscription Verification Dialog exactly once
   */
  showVerificationDialog(OneSignal) {
    const dialogId = "onesignal-verification-dialog";
    let modalEl = document.getElementById(dialogId);

    if (!modalEl) {
      modalEl = document.createElement("dialog");
      modalEl.id = dialogId;
      modalEl.className = "nt-dialog";
      modalEl.setAttribute("aria-labelledby", "onesignal-verification-title");
      modalEl.style.cssText = "max-width:440px; width:92vw; border-radius:18px; padding:0; background:#0c1422; border:1px solid rgba(34,211,238,0.3); box-shadow:0 20px 60px rgba(0,0,0,0.7); color:#f1f5f9;";

      modalEl.innerHTML = `
        <div class="dialog-body" style="padding:24px; text-align:center;">
          <div style="font-size:36px; margin-bottom:12px;">🎉</div>
          <h3 id="onesignal-verification-title" style="font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:700; color:#f1f5f9; margin-bottom:8px;">
            Your OneSignal SDK integration is complete!
          </h3>
          <p style="font-size:12.5px; color:#cbd5e1; line-height:1.55; margin-bottom:20px;">
            You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.
          </p>
          <div style="display:flex; justify-content:center;">
            <button id="onesignal-got-it-btn" class="btn btn-primary" style="width:100%; max-width:200px; padding:10px 20px; font-weight:700; background:linear-gradient(135deg, #22d3ee, #0284c7); border:none; border-radius:99px; color:#060a12; cursor:pointer;">
              Got it
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);
    }

    const gotItBtn = document.getElementById("onesignal-got-it-btn");
    if (gotItBtn) {
      gotItBtn.onclick = async () => {
        if (typeof modalEl.close === "function") {
          try { modalEl.close(); } catch(e) {}
        } else {
          modalEl.removeAttribute("open");
        }
        await OneSignalService.requestPermission();
      };
    }

    if (typeof modalEl.showModal === "function") {
      try { modalEl.showModal(); } catch (e) { modalEl.setAttribute("open", ""); }
    } else {
      modalEl.setAttribute("open", "");
    }
  },

  /**
   * Requests push notification permission
   */
  async requestPermission() {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    return new Promise((resolve) => {
      OneSignalDeferred.push(async function(OneSignal) {
        try {
          const permission = await OneSignal.Notifications.requestPermission();
          resolve(permission);
        } catch (e) {
          console.warn("OneSignal requestPermission error:", e);
          resolve(false);
        }
      });
    });
  },

  /**
   * Log in user / external ID in OneSignal
   */
  async loginUser(userId) {
    if (!userId) return;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.login(userId);
        console.log(`✓ OneSignal user logged in: ${userId}`);
      } catch (e) {
        console.warn("OneSignal login error:", e);
      }
    });
  },

  /**
   * Log out user from OneSignal
   */
  async logoutUser() {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.logout();
        console.log("✓ OneSignal user logged out");
      } catch (e) {
        console.warn("OneSignal logout error:", e);
      }
    });
  },

  /**
   * Set user tag in OneSignal
   */
  async setUserTag(key, value) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.User.addTag(key, value);
      } catch (e) {
        console.warn("OneSignal setTag error:", e);
      }
    });
  }
};
