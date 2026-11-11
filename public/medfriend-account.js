/* MedFriend progress in the uwomeds.com account (plan Task 27).

   MedFriend's sync.js keeps a reader's progress on every device. On
   schulichmed.github.io it stores it in Firebase behind a Google sign-in. On
   uwomeds.com every MedFriend reader is already signed in (the gate, Task 26),
   so this file, added to each MedFriend page when the site copies MedFriend in
   (scripts/prepare-medfriend.mjs), gives sync.js the uwomeds.com account as
   its storage instead, through the hook sync.js already has for a stand-in
   backend (window.PORTAL_SYNC_MOCK). It must load before sync.js.

   It answers the same calls as sync.js's Firebase backend, against
   /api/medfriend/progress/. sync.js does the merging (merge, never
   overwrite); a write the server refuses because another device wrote first
   is re-read and merged again, as Firebase's transaction did. Sync starts on
   every page load: no second sign-in. MedFriend itself is not changed. */
(function () {
  "use strict";

  var API = "/api/medfriend/progress/";
  var me = null;

  /* sync.js only starts on its own when this flag says the reader signed in before */
  try { window.localStorage.setItem("pc-sync-on", "1"); } catch (e) { /* storage refused */ }

  function call(method, query, body) {
    var opts = { method: method, credentials: "same-origin", headers: { Accept: "application/json" } };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch(API + (query || ""), opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 409) return { conflict: true };
        if (!res.ok) throw new Error("progress " + method + " " + res.status + ": " + (data.error || ""));
        return data;
      });
    });
  }

  function leave(path) {
    var f = document.createElement("form");
    f.method = "post";
    f.action = path;
    document.body.appendChild(f);
    f.submit();
    return new Promise(function () { /* the page is leaving */ });
  }

  window.PORTAL_SYNC_MOCK = {
    init: function () {
      return call("GET", "?me=1").then(function (data) { me = data.user || null; });
    },
    onUser: function (cb) {
      cb(me ? { uid: me.id, name: "", email: me.email || "", photo: "" } : null);
    },
    /* only reached if the session ended while the page was open */
    signIn: function () {
      window.location.href = "/login/?next=" + encodeURIComponent(window.location.pathname + window.location.search);
      return new Promise(function () { /* the page is leaving */ });
    },
    signOut: function () { return leave("/logout/"); },
    pull: function (uid, prefix, since) {
      return call("GET", "?prefix=" + encodeURIComponent(prefix) + "&since=" + Math.max(0, Math.floor(since || 0)))
        .then(function (data) { return data.rows || []; });
    },
    /* fn gets the stored text (or null) and returns the text to store, or null
       to leave it alone; like Firebase's transaction, it may run more than once */
    update: function (uid, prefix, key, fn) {
      function attempt(n) {
        return call("GET", "?key=" + encodeURIComponent(key)).then(function (cur) {
          var text = fn(cur.d === undefined ? null : cur.d);
          if (text === null) return;
          return call("PUT", "", { key: key, d: text, ver: cur.ver === undefined ? null : cur.ver }).then(function (r) {
            if (!r.conflict) return;
            if (n >= 4) throw new Error("progress kept changing elsewhere");
            return attempt(n + 1);
          });
        });
      }
      return attempt(0);
    },
    wipe: function (uid, prefixes) {
      return call("DELETE", "", { prefixes: prefixes });
    }
  };
})();
