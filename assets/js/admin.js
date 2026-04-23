/* ==========================================================
   Admin Panel — Main Logic
   Auth + CRUD + Forms + Export/Import
   ========================================================== */

(() => {
  // ====== STATE ======
  const STORAGE_KEY = 'audit_admin_content';
  const AUTH_KEY = 'audit_admin_auth';
  const PASSWORD_KEY = 'audit_admin_password';
  const DEFAULT_PASSWORD = 'admin';
  const AUTH_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  let state = {
    content: null,
    currentSection: 'dashboard',
    isDirty: false
  };

  // ====== UTILITIES ======
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function toast(message, type = 'success', duration = 3000) {
    const container = $('#toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = {
      success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
      warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
      info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>'
    };
    el.innerHTML = `${icons[type] || icons.info}<span>${escapeHtml(message)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastIn 0.3s reverse';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function markDirty() {
    state.isDirty = true;
    // AUTO-SAVE to localStorage immediately — so refresh doesn't lose changes
    try {
      if (state.content) {
        state.content._updated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.content));
      }
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
    const indicator = $('#save-indicator');
    if (indicator) {
      indicator.textContent = 'ლოკალურად შენახული · გამოუქვეყნებელი';
      indicator.classList.add('unsaved');
    }
  }

  function markClean() {
    state.isDirty = false;
    const indicator = $('#save-indicator');
    if (indicator) {
      indicator.textContent = 'ყველა ცვლილება შენახული';
      indicator.classList.remove('unsaved');
    }
  }

  // ====== AUTH ======
  async function isAuthenticated() {
    const auth = localStorage.getItem(AUTH_KEY);
    if (!auth) return false;
    try {
      const { expires } = JSON.parse(auth);
      return Date.now() < expires;
    } catch {
      return false;
    }
  }

  async function login(password) {
    const stored = localStorage.getItem(PASSWORD_KEY);
    const hash = await sha256(password);
    const defaultHash = await sha256(DEFAULT_PASSWORD);

    if (hash === stored || (!stored && hash === defaultHash)) {
      const expires = Date.now() + AUTH_DURATION;
      localStorage.setItem(AUTH_KEY, JSON.stringify({ expires }));
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    location.reload();
  }

  async function changePassword(newPassword) {
    const hash = await sha256(newPassword);
    localStorage.setItem(PASSWORD_KEY, hash);
  }

  // ====== GITHUB CONFIG ======
  const GITHUB_OWNER = 'chaba17';
  const GITHUB_REPO = 'audit-company';
  const GITHUB_PATH = 'assets/data/content.json';
  const GITHUB_BRANCH = 'main';
  const GITHUB_TOKEN_KEY = 'audit_github_token';

  function getGithubToken() { return localStorage.getItem(GITHUB_TOKEN_KEY) || ''; }
  function setGithubToken(token) {
    if (token) localStorage.setItem(GITHUB_TOKEN_KEY, token);
    else localStorage.removeItem(GITHUB_TOKEN_KEY);
  }

  // ====== SHARED ADMIN SECRET (for multi-user via /api/publish) ======
  const SHARED_SECRET_KEY = 'audit_shared_secret';
  function getSharedSecret() { return localStorage.getItem(SHARED_SECRET_KEY) || ''; }
  function setSharedSecret(secret) {
    if (secret) localStorage.setItem(SHARED_SECRET_KEY, secret);
    else localStorage.removeItem(SHARED_SECRET_KEY);
  }

  async function publishViaSharedAPI() {
    const secret = getSharedSecret();
    if (!secret) throw new Error('NO_SECRET');

    // 3-way merge: fetch fresh live, merge with user's changes
    let baseline = getBaseline();
    const live = await fetchLiveContent();

    // AUTO-SYNC SAFETY — runs BEFORE the 3-way merge, aggressive enough to catch
    // "fresh browser" sessions where state.content = defaults and a naive publish
    // would overwrite real live content.
    if (live && state.content) {
      const countItems = (obj) => {
        if (!obj) return 0;
        const keys = ['services','team','testimonials','faq','blog','industries'];
        return keys.reduce((s, k) => s + (Array.isArray(obj[k]) ? obj[k].length : 0), 0)
          + (Array.isArray(obj.pricing?.plans) ? obj.pricing.plans.length : 0);
      };
      const stateCount = countItems(state.content);
      const liveCount = countItems(live);
      const baselineCount = baseline ? countItems(baseline) : 0;

      // Trigger auto-sync if ANY of these hold:
      //   a) There is no baseline at all (fresh login, never synced)
      //   b) Baseline count is very low compared to live (stale baseline from an old session)
      //   c) State is smaller than live by ANY amount AND state likely matches DEFAULT_CONTENT
      //      (i.e. user hasn't customised anything yet this session)
      const noBaseline = !baseline;
      const staleBaseline = baseline && liveCount >= 5 && baselineCount < liveCount - 1;
      let stateLooksLikeDefaults = false;
      try {
        const defaults = window.DEFAULT_CONTENT;
        const sample = ['services','team','testimonials','faq','blog','industries'];
        stateLooksLikeDefaults = sample.every(k =>
          JSON.stringify(state.content[k] || []) === JSON.stringify(defaults[k] || [])
        );
      } catch (_) {}
      const stateSmaller = liveCount > stateCount;

      if (noBaseline || staleBaseline || (stateLooksLikeDefaults && stateSmaller)) {
        // REPLACE state with live entirely — don't merge.
        // Merge would run mergeArray(live, defaults, live) and treat live items missing
        // from defaults as "user-deleted" (since baseline=live, mine-missing-keys = deletions),
        // producing the exact bug we're trying to fix.
        // Safe to replace: auto-sync only fires when user hasn't customised anything yet
        // (no baseline / stale baseline / state equals DEFAULT_CONTENT).
        const liveFilled = fillMissingDefaults(JSON.parse(JSON.stringify(live)));
        state.content = liveFilled;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.content));
        setBaseline(liveFilled);
        baseline = liveFilled;
        toast(`📥 ცოცხალი კონტენტი (${liveCount} ელემენტი) ჩაიტვირთა პანელში. Publish გრძელდება…`, 'info', 4000);
      }
    }

    let mergedContent = state.content;
    let mergeSummary = null;

    if (baseline && live) {
      const summary = diffSummary(baseline, state.content, live);
      mergedContent = mergeContent(baseline, state.content, live);
      mergeSummary = summary;
    } else if (live) {
      // No baseline but live exists → safest path is to MERGE WITH live
      // so we don't silently overwrite (e.g. a friend's additions) with state.content.
      mergedContent = mergeContent(live, state.content, live);
    }

    // DATA-LOSS GUARD — WIPE + SHRINK + EMPTY-PUBLISH detection
    if (live) {
      const guarded = ['services', 'team', 'testimonials', 'faq', 'blog', 'industries', 'pricing.plans'];
      const pathGet = (obj, p) => p.split('.').reduce((a, k) => (a && a[k] != null ? a[k] : null), obj);
      for (const path of guarded) {
        const liveArr = pathGet(live, path);
        const mergedArr = pathGet(mergedContent, path);
        if (Array.isArray(liveArr) && liveArr.length > 0 && (!Array.isArray(mergedArr) || mergedArr.length === 0)) {
          throw new Error(`⚠ გამოქვეყნება შეჩერებულია — "${path}" სექცია შენს პანელში ცარიელია, მაგრამ ცოცხალზე ${liveArr.length} ელემენტი. წაიშლება ყველაფერი. დააჭირე Sync → ხელახლა Publish.`);
        }
        if (Array.isArray(liveArr) && Array.isArray(mergedArr)) {
          const lost = liveArr.length - mergedArr.length;
          if (lost >= 3 || (liveArr.length >= 5 && mergedArr.length < liveArr.length * 0.6)) {
            throw new Error(`⚠ გამოქვეყნება შეჩერებულია — "${path}"-ში ცოცხალზე ${liveArr.length}, შენზე ${mergedArr.length}. Sync → ხელახლა Publish.`);
          }
        }
      }
      const totalMerged = guarded.reduce((s, p) => s + ((Array.isArray(pathGet(mergedContent, p))) ? pathGet(mergedContent, p).length : 0), 0);
      const totalLive = guarded.reduce((s, p) => s + ((Array.isArray(pathGet(live, p))) ? pathGet(live, p).length : 0), 0);
      if (totalLive >= 10 && totalMerged < totalLive * 0.3) {
        throw new Error(`⚠ გამოქვეყნება შეჩერებულია — შენს პანელში სულ ${totalMerged} ელემენტია ${totalLive}-ს ნაცვლად. Sync აუცილებელია.`);
      }
    }

    mergedContent._updated = new Date().toISOString();

    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, content: mergedContent })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.detail || `HTTP ${res.status}`);
    }

    // Update local state with merged content + set new baseline
    state.content = mergedContent;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedContent));
    setBaseline(mergedContent);

    return { ...data, mergeSummary };
  }

  async function githubAPI(path, options = {}) {
    const token = getGithubToken();
    if (!token) throw new Error('NO_TOKEN');
    const base = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
    let url = path ? `${base}/${path}` : base;

    // Cache-bust GET requests to avoid browser caching stale SHA
    if (!options.method || options.method === 'GET') {
      url += (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    }

    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...(options.headers || {})
    };
    if (options.method && options.method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    let res;
    try {
      res = await fetch(url, { ...options, headers, cache: 'no-store' });
    } catch (e) {
      throw new Error('NETWORK: ' + (e.message || 'Failed to fetch'));
    }

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        detail = err.message || detail;
      } catch {}
      if (res.status === 401) throw new Error('UNAUTHORIZED: Token არასწორია ან ვადაგასული.');
      if (res.status === 404) throw new Error('NOT_FOUND: ' + detail);
      if (res.status === 403) throw new Error('FORBIDDEN: Token-ს არ აქვს საკმარისი უფლება.');
      if (res.status === 409 || detail.includes('does not match')) throw new Error('SHA_CONFLICT: ' + detail);
      throw new Error(detail);
    }
    return res.json();
  }

  async function fetchFileSha() {
    try {
      const current = await githubAPI(`contents/${GITHUB_PATH}?ref=${GITHUB_BRANCH}`);
      return current.sha;
    } catch (e) {
      if (e.message.startsWith('NOT_FOUND')) return null;
      throw e;
    }
  }

  // UTF-8 safe Base64 encoding
  function toBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  async function publishToGitHub() {
    const publishBtn = $('#publish-btn');
    if (publishBtn) {
      publishBtn.disabled = true;
      publishBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg> იტვირთება...';
    }

    // If shared secret is configured, use /api/publish (multi-user mode)
    if (getSharedSecret()) {
      try {
        const result = await publishViaSharedAPI();
        markClean();
        if (result.mergeSummary && (result.mergeSummary.myAdds > 0 || result.mergeSummary.theirAdds > 0)) {
          toast(`✅ გამოქვეყნდა + სმარტ-მერჯი: +${result.mergeSummary.myAdds} შენი, +${result.mergeSummary.theirAdds} სხვების. 10-30 წამში live.`, 'success', 7000);
        } else {
          toast('✅ გამოქვეყნებულია! 10-30 წამში ხილვადი იქნება.', 'success', 5000);
        }
        logActivity('publish', 'content.json → shared API', 'publish');
        // Auto-rerender current section with merged content
        renderSection(state.currentSection);
      } catch (err) {
        if (err.message === 'NO_SECRET') toast('❌ Shared Secret დააყენე Settings-ში', 'error');
        else if (err.message === 'Invalid secret') toast('❌ Shared Secret არასწორია', 'error');
        else toast('❌ ' + err.message, 'error', 6000);
        console.error('Shared publish error:', err);
      } finally {
        if (publishBtn) {
          publishBtn.disabled = false;
          publishBtn.innerHTML = originalPublishBtnHTML;
        }
      }
      return;
    }

    try {
      // 3-way merge before publish (personal token flow)
      const baseline = getBaseline();
      const live = await fetchLiveContent();
      let mergedContent = state.content;
      let mergeSummary = null;
      if (baseline && live) {
        mergeSummary = diffSummary(baseline, state.content, live);
        mergedContent = mergeContent(baseline, state.content, live);
        state.content = mergedContent;
      } else if (live) {
        mergedContent = mergeContent(live, state.content, live);
        state.content = mergedContent;
      }

      // DATA-LOSS GUARD: block publish if a section would shrink significantly vs live
      if (live) {
        const guarded = ['services', 'team', 'testimonials', 'faq', 'blog', 'industries', 'pricing.plans'];
        const pathGet = (obj, p) => p.split('.').reduce((a, k) => (a && a[k] != null ? a[k] : null), obj);
        for (const path of guarded) {
          const liveArr = pathGet(live, path);
          const mergedArr = pathGet(mergedContent, path);
          if (Array.isArray(liveArr) && Array.isArray(mergedArr)) {
            const lost = liveArr.length - mergedArr.length;
            if (lost >= 3 || (liveArr.length >= 5 && mergedArr.length < liveArr.length * 0.6)) {
              toast(`⚠ გამოქვეყნება შეჩერებულია — "${path}" სექციაში live = ${liveArr.length}, შენი = ${mergedArr.length}. დააჭირე Sync და სცადე ხელახლა.`, 'error', 10000);
              if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.innerHTML = originalPublishBtnHTML;
              }
              return;
            }
          }
        }
      }

      // Prepare content
      state.content._updated = new Date().toISOString();
      const jsonStr = JSON.stringify(state.content, null, 2);
      const encoded = toBase64(jsonStr);

      // Get fresh SHA
      let sha = await fetchFileSha();

      const attemptPut = async (currentSha) => {
        const body = {
          message: `Update content via admin — ${new Date().toLocaleString('ka-GE')}`,
          content: encoded,
          branch: GITHUB_BRANCH
        };
        if (currentSha) body.sha = currentSha;
        return await githubAPI(`contents/${GITHUB_PATH}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
      };

      let result;
      try {
        result = await attemptPut(sha);
      } catch (e) {
        if (e.message.startsWith('SHA_CONFLICT')) {
          // Auto-retry with fresh SHA
          console.log('SHA conflict — retrying with fresh SHA...');
          await new Promise(r => setTimeout(r, 500));
          sha = await fetchFileSha();
          result = await attemptPut(sha);
        } else {
          throw e;
        }
      }

      // Save locally + update baseline
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.content));
      setBaseline(state.content);
      markClean();

      if (mergeSummary && (mergeSummary.myAdds > 0 || mergeSummary.theirAdds > 0)) {
        toast(`✅ გამოქვეყნდა + სმარტ-მერჯი: +${mergeSummary.myAdds} შენი, +${mergeSummary.theirAdds} სხვების.`, 'success', 7000);
      } else {
        toast('✅ ცვლილებები გამოქვეყნებულია!', 'success', 5000);
      }
      console.log('Commit:', result.commit?.html_url);
      logActivity('publish', 'content.json → GitHub', 'publish');
      renderSection(state.currentSection);
    } catch (err) {
      if (err.message === 'NO_TOKEN') {
        toast('❌ ჯერ GitHub Token-ი უნდა დააყენო. წადი → Settings', 'error', 5000);
        setTimeout(() => location.hash = '#settings', 1200);
      } else if (err.message?.includes('Bad credentials') || err.message?.includes('401')) {
        toast('❌ Token არასწორია. შეამოწმე Settings-ში.', 'error');
      } else {
        toast('❌ შეცდომა: ' + err.message, 'error', 5000);
      }
      console.error('Publish error:', err);
    } finally {
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.innerHTML = originalPublishBtnHTML;
      }
    }
  }

  const originalPublishBtnHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> Publish Live`;

  // ====== 3-WAY MERGE (for multi-user concurrent edits) ======
  const BASELINE_KEY = 'audit_admin_baseline';
  function getBaseline() {
    const s = localStorage.getItem(BASELINE_KEY);
    if (s) try { return JSON.parse(s); } catch {}
    return null;
  }
  function setBaseline(content) {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(content));
  }

  // Key function — identifies list items for merging
  function itemKey(item) {
    if (!item || typeof item !== 'object') return String(item);
    return item.id || item.slug || item.title || item.name || item.question || JSON.stringify(item);
  }

  function mergeArray(baseline, mine, live) {
    const bMap = new Map(baseline.map(i => [itemKey(i), i]));
    const mMap = new Map(mine.map(i => [itemKey(i), i]));
    const lMap = new Map(live.map(i => [itemKey(i), i]));

    // SAFETY NET: if user's "mine" is identical (byte-for-byte) to "baseline" AND live has
    // items that "mine" doesn't have, this is almost certainly a localStorage-drift bug, not
    // an intentional delete. Trust live — otherwise a stale browser tab can silently erase
    // a friend's additions.
    // Only way to reliably delete something: user must have loaded up-to-date data and
    // actively deleted it (so mine ≠ baseline afterwards).
    const liveIdsNotInMine = [...lMap.keys()].filter(k => !mMap.has(k));
    const noUserEditsYet = JSON.stringify(mine) === JSON.stringify(baseline);
    const safetyOverride = noUserEditsYet && liveIdsNotInMine.length > 0;

    const userDeleted = safetyOverride
      ? new Set()
      : new Set([...bMap.keys()].filter(k => !mMap.has(k)));
    const userAdded = new Set([...mMap.keys()].filter(k => !bMap.has(k)));

    // Detect whether the user reordered: mine's key sequence differs from baseline's key sequence
    // (but the sets match or overlap). If so, we iterate in MINE's order to preserve the drag-drop.
    // Otherwise we fall back to LIVE's order (in case another user reordered on the server side).
    const mineKeys = mine.map(i => itemKey(i));
    const baseKeys = baseline.map(i => itemKey(i));
    const mineKeysStr = mineKeys.filter(k => bMap.has(k)).join('|');
    const baseKeysStr = baseKeys.join('|');
    const userReordered = !safetyOverride && mineKeys.length > 0 && mineKeysStr !== baseKeysStr.split('|').filter(k => mMap.has(k)).join('|');

    const result = [];
    const seen = new Set();

    if (userReordered) {
      // Step 1 (user reordered): iterate MINE's order — user's drag-drop wins
      mine.forEach(mineItem => {
        const k = itemKey(mineItem);
        if (seen.has(k)) return;
        const baseItem = bMap.get(k);
        const liveItem = lMap.get(k);
        const userModified = baseItem && JSON.stringify(mineItem) !== JSON.stringify(baseItem);
        // Item in live? If user modified it → take mine; else take live (may have fresh data from another user)
        // Item not in live? It's a user addition (or friend deleted it; prefer keeping mine)
        if (liveItem) {
          result.push(userModified ? mineItem : liveItem);
        } else {
          result.push(mineItem);
        }
        seen.add(k);
      });
      // Step 2: append any friend-added items from live (not in mine) at the end, unless user deleted them
      live.forEach(item => {
        const k = itemKey(item);
        if (seen.has(k)) return;
        if (userDeleted.has(k)) return;
        result.push(item);
        seen.add(k);
      });
    } else {
      // Step 1 (no user reorder): iterate live order, keep items not deleted by user
      live.forEach(item => {
        const k = itemKey(item);
        if (userDeleted.has(k)) return;
        if (seen.has(k)) return;
        if (mMap.has(k)) {
          const mineItem = mMap.get(k);
          const baseItem = bMap.get(k);
          const userModified = baseItem && JSON.stringify(mineItem) !== JSON.stringify(baseItem);
          result.push(userModified ? mineItem : item);
        } else {
          result.push(item); // friend's addition — keep it
        }
        seen.add(k);
      });
      // Step 2: append user's new additions (not in live)
      mine.forEach(item => {
        const k = itemKey(item);
        if (seen.has(k)) return;
        if (userAdded.has(k) || !bMap.has(k)) {
          result.push(item);
          seen.add(k);
        }
      });
    }

    return result;
  }

  function mergeContent(baseline, mine, live) {
    if (!baseline) return mine;
    if (!live) return mine;

    // Arrays
    if (Array.isArray(mine) || Array.isArray(live)) {
      return mergeArray(
        Array.isArray(baseline) ? baseline : [],
        Array.isArray(mine) ? mine : [],
        Array.isArray(live) ? live : []
      );
    }

    // Objects
    if (mine && typeof mine === 'object' && live && typeof live === 'object') {
      const result = {};
      const allKeys = new Set([
        ...Object.keys(baseline || {}),
        ...Object.keys(mine),
        ...Object.keys(live)
      ]);
      allKeys.forEach(key => {
        if (key.startsWith('_')) {
          // metadata — use mine
          result[key] = mine[key] !== undefined ? mine[key] : live[key];
          return;
        }
        const b = baseline?.[key];
        const m = mine[key];
        const l = live[key];
        result[key] = mergeContent(b, m !== undefined ? m : l, l !== undefined ? l : m);
      });
      return result;
    }

    // Primitive: user wins if changed from baseline
    if (mine === undefined) return live;
    if (live === undefined) return mine;
    if (JSON.stringify(baseline) !== JSON.stringify(mine)) return mine;
    return live;
  }

  // Fetch live content for merge
  async function fetchLiveContent() {
    try {
      const res = await fetch('/api/content?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  // Compute a diff summary for toast
  function diffSummary(baseline, mine, live) {
    const sections = ['services', 'team', 'testimonials', 'faq', 'blog', 'industries'];
    let myAdds = 0, theirAdds = 0, myEdits = 0;
    sections.forEach(key => {
      const b = (baseline?.[key] || []);
      const m = (mine?.[key] || []);
      const l = (live?.[key] || []);
      const bKeys = new Set(b.map(itemKey));
      const mKeys = new Set(m.map(itemKey));
      const lKeys = new Set(l.map(itemKey));
      m.forEach(i => { if (!bKeys.has(itemKey(i))) myAdds++; });
      l.forEach(i => { if (!bKeys.has(itemKey(i)) && !mKeys.has(itemKey(i))) theirAdds++; });
    });
    return { myAdds, theirAdds };
  }

  // ====== CONTENT MANAGEMENT ======
  function fillMissingDefaults(content) {
    // Ensure all default mega menus exist
    if (!content.megaMenus) content.megaMenus = {};
    Object.entries(window.DEFAULT_CONTENT.megaMenus || {}).forEach(([key, defaultMenu]) => {
      if (!content.megaMenus[key]) {
        content.megaMenus[key] = deepClone(defaultMenu);
      }
    });
    // Ensure top-level keys exist
    ['site', 'hero', 'stats', 'services', 'pricing', 'team', 'testimonials', 'faq', 'blog', 'industries', 'footer', 'seo', 'analytics', 'media', 'theme'].forEach(key => {
      if (!content[key]) content[key] = deepClone(window.DEFAULT_CONTENT[key] || (Array.isArray(window.DEFAULT_CONTENT[key]) ? [] : {}));
    });
    // Normalize fields that MUST be arrays — historic content.json versions had some of
    // these as {} which crashes every .map/.length call site.
    ['media', 'services', 'team', 'testimonials', 'faq', 'blog', 'industries', 'stats'].forEach(key => {
      if (!Array.isArray(content[key])) {
        content[key] = [];
      }
    });
    return content;
  }

  function loadContent() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return fillMissingDefaults(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved content:', e);
      }
    }
    return deepClone(window.DEFAULT_CONTENT);
  }

  async function syncFromLive(opts = {}) {
    try {
      const res = await fetch('/api/content?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('API failed');
      const live = await res.json();
      const liveFilled = fillMissingDefaults(live);

      // FIRST-RUN SAFETY: If no localStorage STORAGE_KEY exists yet (first admin load ever
      // for this browser), seed state directly from live. DO NOT merge defaults vs live —
      // that path can silently drop live items the user has never seen.
      const hadStoredContent = !!localStorage.getItem(STORAGE_KEY);

      // Baseline: saved baseline, or live as fallback (NOT defaults — defaults vs live
      // would let a fresh browser publish defaults and wipe live content).
      let baseline = getBaseline();
      if (!baseline) baseline = deepClone(liveFilled);

      // Always run merge to safely preserve ALL user changes
      let newState;
      if (opts.force || !hadStoredContent) {
        // Force-sync or first-ever admin load → just take live
        newState = liveFilled;
      } else {
        newState = mergeContent(baseline, state.content || liveFilled, liveFilled);
      }

      const hadLocalChanges = JSON.stringify(newState) !== JSON.stringify(liveFilled);

      state.content = newState;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setBaseline(liveFilled); // baseline = live at sync time
      if (!hadLocalChanges) markClean();
      else {
        // Still have unpublished changes
        const indicator = $('#save-indicator');
        if (indicator) {
          indicator.textContent = 'ლოკალურად შენახული · გამოუქვეყნებელი';
          indicator.classList.add('unsaved');
        }
      }
      updateBadges();
      return { success: true, hadLocalChanges, liveUpdated: live._updated };
    } catch (e) {
      console.error('Sync failed:', e);
      return { success: false, error: e.message };
    }
  }

  // ====== AUTO-POLLING (check for others' updates every 15s) ======
  let lastKnownUpdate = null;
  let pollInterval = null;
  function startAutoPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
      if (document.hidden) return; // don't poll if tab not visible
      try {
        const res = await fetch('/api/content?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) return;
        const live = await res.json();
        if (!lastKnownUpdate) {
          lastKnownUpdate = live._updated;
          return;
        }
        if (live._updated && live._updated !== lastKnownUpdate) {
          lastKnownUpdate = live._updated;
          showUpdateBanner(live);
        }
      } catch {}
    }, 15000); // 15 seconds
  }

  function showUpdateBanner(live) {
    let banner = document.getElementById('update-banner');
    if (banner) return; // already showing
    banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.innerHTML = `
      <div style="position: fixed; top: 64px; left: 50%; transform: translateX(-50%); z-index: 150; background: var(--ink); color: white; padding: 12px 20px; border-left: 3px solid var(--yellow); display: flex; align-items: center; gap: 14px; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); max-width: 90vw;">
        <span>🔄 სხვა user-მა გააკეთა ცვლილება. Live content განახლდა.</span>
        <button class="btn btn-yellow btn-xs" id="apply-sync">Sync</button>
        <button style="background: none; color: rgba(255,255,255,0.6); padding: 4px;" id="dismiss-banner">✕</button>
      </div>
    `;
    document.body.appendChild(banner);
    $('#apply-sync').onclick = async () => {
      banner.remove();
      const res = await syncFromLive();
      if (res.success) {
        toast(res.hadLocalChanges ? '✅ Sync + შენი ცვლილებები შენარჩუნდა' : '✅ Live content ჩამოიტვირთა', 'success');
        renderSection(state.currentSection);
      }
    };
    $('#dismiss-banner').onclick = () => banner.remove();
  }

  function saveContent() {
    state.content._updated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.content));
    // Keep "unpublished" indicator if user has changes that aren't yet live
    toast('ლოკალურად შენახულია · დააჭირე "Publish Live" საიტზე გამოსაქვეყნებლად', 'info', 4000);
    logActivity('update', 'Local save', state.currentSection);
    updateBadges();
  }

  function resetContent() {
    if (!confirm('დარწმუნებული ხარ? ყველა ცვლილება წაიშლება და დაბრუნდება ნაგულისხმევ კონტენტზე.')) return;
    localStorage.removeItem(STORAGE_KEY);
    state.content = deepClone(window.DEFAULT_CONTENT);
    renderSection(state.currentSection);
    toast('ნაგულისხმევი კონტენტი აღდგა', 'info');
    updateBadges();
  }

  function exportJSON() {
    const data = JSON.stringify(state.content, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `audit-content-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('JSON ფაილი ჩამოიტვირთა', 'success');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported.site || !imported.services) {
          throw new Error('არასწორი ფორმატი');
        }
        if (!confirm('ნამდვილად ჩანაცვლდეს ყველა მიმდინარე კონტენტი?')) return;
        state.content = imported;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.content));
        renderSection(state.currentSection);
        updateBadges();
        toast('JSON წარმატებით იმპორტდა!', 'success');
      } catch (err) {
        toast('შეცდომა: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  function updateBadges() {
    const badges = {
      'badge-services': state.content.services?.length || 0,
      'badge-pricing': state.content.pricing?.plans?.length || 0,
      'badge-team': state.content.team?.length || 0,
      'badge-testimonials': state.content.testimonials?.length || 0,
      'badge-faq': state.content.faq?.length || 0,
      'badge-blog': state.content.blog?.length || 0,
      'badge-industries': state.content.industries?.length || 0
    };
    Object.entries(badges).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }

  // ====== ROUTING ======
  function handleRoute() {
    const hash = location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash);
  }

  function navigateTo(section) {
    state.currentSection = section;
    $$('.sidebar-link').forEach(el => {
      el.classList.toggle('active', el.dataset.section === section);
    });
    const labels = {
      dashboard: 'Dashboard',
      site: 'Site Info',
      hero: 'Hero Section',
      services: 'Services',
      pricing: 'Pricing Plans',
      team: 'Team',
      testimonials: 'Testimonials',
      faq: 'FAQ',
      blog: 'Blog Posts',
      industries: 'Industries',
      stats: 'Statistics',
      megamenu: 'Mega Menu',
      footer: 'Footer',
      translations: 'Translations',
      import: 'Import / Restore',
      settings: 'Settings',
      seo: 'SEO Dashboard',
      meta: 'Meta Tags',
      sitemap: 'Sitemap',
      analytics: 'Analytics',
      media: 'Media Library',
      theme: 'Theme & Colors',
      activity: 'Activity Log',
      shortcuts: 'Keyboard Shortcuts'
    };
    $('#current-section-label').textContent = labels[section] || section;
    renderSection(section);
    // Close mobile sidebar
    $('#admin-sidebar').classList.remove('open');
    $('#sidebar-backdrop').classList.remove('active');
  }

  function renderSection(section) {
    const main = $('#admin-main');
    const renderers = {
      dashboard: renderDashboard,
      site: renderSite,
      hero: renderHero,
      services: renderServices,
      pricing: renderPricing,
      team: renderTeam,
      testimonials: renderTestimonials,
      faq: renderFAQ,
      blog: renderBlog,
      industries: renderIndustries,
      stats: renderStats,
      aboutPage: renderAboutPage,
      contactPage: renderContactPage,
      search: renderSearchSection,
      megamenu: renderMegaMenu,
      footer: renderFooter,
      translations: renderTranslations,
      import: renderImport,
      settings: renderSettings,
      seo: renderSEO,
      meta: renderMeta,
      sitemap: renderSitemap,
      analytics: renderAnalytics,
      media: renderMedia,
      theme: renderTheme,
      activity: renderActivity,
      shortcuts: renderShortcuts
    };
    const renderer = renderers[section] || renderDashboard;
    main.innerHTML = renderer();
    // Attach section-specific handlers
    const attachers = {
      dashboard: attachDashboard,
      site: attachSite,
      hero: attachHero,
      services: attachServices,
      pricing: attachPricing,
      team: attachTeam,
      testimonials: attachTestimonials,
      faq: attachFAQ,
      blog: attachBlog,
      industries: attachIndustries,
      stats: attachStats,
      aboutPage: attachAboutPage,
      contactPage: attachFieldListeners,
      search: attachFieldListeners,
      megamenu: attachMegaMenu,
      footer: attachFooter,
      translations: attachTranslations,
      import: attachImport,
      settings: attachSettings,
      seo: attachSEO,
      meta: attachMeta,
      sitemap: attachSitemap,
      analytics: attachAnalytics,
      media: attachMedia,
      theme: attachTheme,
      activity: attachActivity,
      shortcuts: () => {}
    };
    if (attachers[section]) attachers[section]();
    // Scroll to top
    main.scrollTop = 0;
  }

  // ====== SECTION RENDERERS ======

  // --- DASHBOARD ---
  function renderDashboard() {
    const c = state.content;
    return `
      <div class="page-header">
        <div>
          <h1>კეთილი იყოს თქვენი მობრძანება 👋</h1>
          <p>მართე შენი ვებგვერდის მთელი კონტენტი ერთ სივრცეში</p>
        </div>
      </div>

      <div class="info-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        <div style="flex: 1;">
          <strong>რჩევა:</strong> ცვლილებები ავტომატურად ინახება ბრაუზერში. Live საიტზე გამოსახვისთვის დააჭირე <code>Publish Live</code> — ცვლილება 10-30 წამში ჩანს.
          <div style="margin-top: 8px;">
            <a href="https://gubermangeo.com/" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: var(--ink);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
              ცოცხალი საიტი: gubermangeo.com
            </a>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-label">სერვისები</div>
          <div class="stat-card-value">${c.services?.length || 0}</div>
          <div class="stat-card-desc">აქტიური სერვისი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">პაკეტები</div>
          <div class="stat-card-value">${c.pricing?.plans?.length || 0}</div>
          <div class="stat-card-desc">საფასო პაკეტი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">გუნდი</div>
          <div class="stat-card-value">${c.team?.length || 0}</div>
          <div class="stat-card-desc">ექსპერტი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">გამოხმაურება</div>
          <div class="stat-card-value">${c.testimonials?.length || 0}</div>
          <div class="stat-card-desc">ტესტიმონიალი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">FAQ</div>
          <div class="stat-card-value">${c.faq?.length || 0}</div>
          <div class="stat-card-desc">ხშირი კითხვა</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">ბლოგი</div>
          <div class="stat-card-value">${c.blog?.length || 0}</div>
          <div class="stat-card-desc">ბლოგის პოსტი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">ინდუსტრიები</div>
          <div class="stat-card-value">${c.industries?.length || 0}</div>
          <div class="stat-card-desc">სექტორი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">ბოლო განახლება</div>
          <div class="stat-card-value" style="font-size: 18px;">${c._updated ? new Date(c._updated).toLocaleDateString('ka-GE') : 'არასდროს'}</div>
          <div class="stat-card-desc">ვერსია ${c._version || '1.0.0'}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">სწრაფი ქმედებები</h3>
            <p class="card-subtitle">ხშირად გამოყენებადი დავალებები</p>
          </div>
        </div>
        <div class="quick-actions">
          <button class="quick-action" data-goto="site">
            <div class="quick-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="18" x="2" y="3" rx="2"/><path d="M2 12h20"/></svg>
            </div>
            <div class="quick-action-text">
              <div class="quick-action-title">საიტის ინფორმაცია</div>
              <div class="quick-action-desc">ტელ, მეილი, მისამართი</div>
            </div>
          </button>
          <button class="quick-action" data-goto="hero">
            <div class="quick-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
            </div>
            <div class="quick-action-text">
              <div class="quick-action-title">Hero სექცია</div>
              <div class="quick-action-desc">სათაური, ტექსტი, CTA</div>
            </div>
          </button>
          <button class="quick-action" data-goto="services">
            <div class="quick-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div class="quick-action-text">
              <div class="quick-action-title">სერვისების მართვა</div>
              <div class="quick-action-desc">დამატება, რედაქტირება</div>
            </div>
          </button>
          <button class="quick-action" data-goto="blog">
            <div class="quick-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="quick-action-text">
              <div class="quick-action-title">ახალი ბლოგი</div>
              <div class="quick-action-desc">დაამატე სტატია</div>
            </div>
          </button>
        </div>
      </div>
    `;
  }

  function attachDashboard() {
    $$('.quick-action').forEach(btn => {
      btn.addEventListener('click', () => {
        location.hash = '#' + btn.dataset.goto;
      });
    });
  }

  // --- SITE INFO ---
  function renderSite() {
    const s = state.content.site;
    return `
      <div class="page-header">
        <div>
          <h1>საიტის ინფორმაცია</h1>
          <p>კომპანიის კონტაქტები, მისამართი, სოციალური ქსელები</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">საბაზისო ინფორმაცია</h3>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>კომპანიის სახელი <span class="required">*</span></label>
            <input type="text" data-field="site.name" value="${escapeHtml(s.name)}" />
          </div>
          <div class="form-group">
            <label>ტაგლაინი</label>
            <input type="text" data-field="site.tagline" value="${escapeHtml(s.tagline)}" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">🌐 ბრაუზერის Tab (Title + Favicon)</h3>
          <p class="card-subtitle">ის, რაც ჩანს ბრაუზერის ფანჯრის ზედა სათაურში და ძიების შედეგებში</p>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Default Title (ყველა გვერდისთვის)</label>
            <input type="text" data-field="site.defaultTitle" value="${escapeHtml(s.defaultTitle || '')}" placeholder="Guberman Group — გააფორმე ბიზნესის მომავალი | საქართველო" maxlength="65" />
            <small class="hint">30-60 სიმბოლო რეკომენდებულია. თითოეული გვერდის ცალკე სათაური — <a href="#meta" onclick="location.hash='#meta'" style="color: var(--ink); font-weight: 700;">Meta Tags</a> სექციაში</small>
          </div>
          <div class="form-group">
            <label>Default Description (ყველა გვერდისთვის)</label>
            <textarea data-field="site.defaultDescription" rows="2" maxlength="170" placeholder="სრული საბუღალტრო, საგადასახადო, აუდიტის და საკონსულტაციო მომსახურება საქართველოში.">${escapeHtml(s.defaultDescription || '')}</textarea>
            <small class="hint">120-160 სიმბოლო — ეს ტექსტი ჩანს Google-ის ძიების შედეგებში</small>
          </div>
          <div class="form-grid cols-2">
            <div class="form-group">
              <label>Favicon URL (ბრაუზერის ტაბის ლოგო) · 32×32 ან 64×64 px</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="url" data-field="site.favicon" data-url-preview="favicon-preview" value="${escapeHtml(s.favicon || '')}" placeholder="https://gubermangeo.com/assets/images/uploads/..." style="flex: 1;" />
                <img id="favicon-preview" src="${escapeHtml(s.favicon || '')}" class="url-preview" data-original="${escapeHtml(s.favicon || '')}" style="width: 32px; height: 32px; border: 1px solid var(--gray-200); background: var(--gray-100); object-fit: contain; display: ${s.favicon ? 'block' : 'none'};" alt="" />
              </div>
              <small class="hint">ატვირთე სურათი Media Library-ში → Copy URL → პასტე აქ. რეკ: კვადრატული PNG/ICO, 64×64 px</small>
            </div>
            <div class="form-group">
              <label>Apple Touch Icon URL · 180×180 px (iPhone home-screen ლოგო)</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="url" data-field="site.appleTouchIcon" data-url-preview="apple-touch-preview" value="${escapeHtml(s.appleTouchIcon || '')}" placeholder="https://..." style="flex: 1;" />
                <img id="apple-touch-preview" src="${escapeHtml(s.appleTouchIcon || '')}" class="url-preview" data-original="${escapeHtml(s.appleTouchIcon || '')}" style="width: 32px; height: 32px; border: 1px solid var(--gray-200); background: var(--gray-100); object-fit: contain; display: ${s.appleTouchIcon ? 'block' : 'none'};" alt="" />
              </div>
              <small class="hint">iPhone-ზე Add to Home-ის შემდეგ იქნება აპლიკაციის ხატად</small>
            </div>
          </div>
          <div class="form-group">
            <label>Logo Image URL (ჰედერის ლოგოსთვის)</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="url" data-field="site.logoUrl" data-url-preview="logo-preview" value="${escapeHtml(s.logoUrl || '')}" placeholder="https://gubermangeo.com/assets/images/uploads/logo.png" style="flex: 1;" />
              <img id="logo-preview" src="${escapeHtml(s.logoUrl || '')}" class="url-preview" data-original="${escapeHtml(s.logoUrl || '')}" style="max-height: 40px; border: 1px solid var(--gray-200); background: var(--gray-100); object-fit: contain; display: ${s.logoUrl ? 'block' : 'none'};" alt="" />
            </div>
            <small class="hint">💡 <strong>საუკეთესო ფორმატი:</strong> PNG გამჭვირვალე ფონით (transparent background) ან SVG. JPG თეთრი ფონით დიდ ოთხკუთხედს გაჩენს — ამ შემთხვევაში გამოიყენე ქვემოთ "Blend mode".</small>
          </div>
          <div class="form-group">
            <label>Logo Blend Mode (JPG თეთრი ფონით)</label>
            <select data-field="site.logoBlend" style="max-width: 280px;">
              <option value="" ${!s.logoBlend ? 'selected' : ''}>— არაფერი (PNG/SVG გამჭვირვალე ფონისთვის) —</option>
              <option value="multiply" ${s.logoBlend === 'multiply' ? 'selected' : ''}>Multiply (თეთრი ფონი გაქრება — უმოკლესი)</option>
              <option value="screen" ${s.logoBlend === 'screen' ? 'selected' : ''}>Screen (შავი ფონი გაქრება)</option>
              <option value="lighten" ${s.logoBlend === 'lighten' ? 'selected' : ''}>Lighten (სხვა ვარიანტი)</option>
              <option value="darken" ${s.logoBlend === 'darken' ? 'selected' : ''}>Darken (სხვა ვარიანტი)</option>
            </select>
            <small class="hint">თუ ლოგო JPG-ია თეთრი ფონით — აირჩიე <strong>Multiply</strong>, თეთრი ფონი გაქრება და ბნელ header-ში გაერევა. გამჭვირვალე PNG-ისთვის დატოვე ცარიელი.</small>
          </div>
          <div class="form-group">
            <label>Footer Logo URL (ფუტერის ლოგო — არასავალდებულო)</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="url" data-field="site.footerLogoUrl" data-url-preview="footer-logo-preview" value="${escapeHtml(s.footerLogoUrl || '')}" placeholder="https://gubermangeo.com/assets/images/uploads/logo-light.png" style="flex: 1;" />
              <img id="footer-logo-preview" src="${escapeHtml(s.footerLogoUrl || '')}" class="url-preview" data-original="${escapeHtml(s.footerLogoUrl || '')}" style="max-height: 40px; border: 1px solid var(--gray-200); background: var(--ink); object-fit: contain; display: ${s.footerLogoUrl ? 'block' : 'none'};" alt="" />
            </div>
            <small class="hint">💡 ფუტერის ფონი მუქია — საუკეთესოა <strong>ღია/თეთრი ვარიანტი</strong> PNG გამჭვირვალე ფონით. თუ ცარიელია, გამოიყენება ჰედერის ლოგო.</small>
          </div>
          <div class="form-group">
            <label>Footer Logo Blend Mode</label>
            <select data-field="site.footerLogoBlend" style="max-width: 280px;">
              <option value="" ${!s.footerLogoBlend ? 'selected' : ''}>— არაფერი (გამჭვირვალე PNG/SVG) —</option>
              <option value="multiply" ${s.footerLogoBlend === 'multiply' ? 'selected' : ''}>Multiply (თეთრი ფონი გაქრება)</option>
              <option value="screen" ${s.footerLogoBlend === 'screen' ? 'selected' : ''}>Screen (შავი ფონი გაქრება)</option>
              <option value="lighten" ${s.footerLogoBlend === 'lighten' ? 'selected' : ''}>Lighten</option>
              <option value="darken" ${s.footerLogoBlend === 'darken' ? 'selected' : ''}>Darken</option>
            </select>
            <small class="hint">იგივე წესი რაც ჰედერის ლოგოსთვის — JPG-თვის თეთრი ფონით აირჩიე Screen (ფუტერი მუქია).</small>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">კონტაქტი</h3>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>ტელეფონი (ძირითადი)</label>
            <input type="tel" data-field="site.phone" value="${escapeHtml(s.phone)}" />
          </div>
          <div class="form-group">
            <label>ტელეფონი (მობილური)</label>
            <input type="tel" data-field="site.phoneAlt" value="${escapeHtml(s.phoneAlt || '')}" />
          </div>
          <div class="form-group">
            <label>ელ.ფოსტა (ძირითადი)</label>
            <input type="email" data-field="site.email" value="${escapeHtml(s.email)}" />
          </div>
          <div class="form-group">
            <label>ელ.ფოსტა (მხარდაჭერა)</label>
            <input type="email" data-field="site.emailAlt" value="${escapeHtml(s.emailAlt || '')}" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">მისამართი</h3>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>მისამართი</label>
            <input type="text" data-field="site.address" value="${escapeHtml(s.address)}" />
          </div>
          <div class="form-group">
            <label>დეტალები</label>
            <input type="text" data-field="site.addressDetails" value="${escapeHtml(s.addressDetails || '')}" />
          </div>
          <div class="form-group">
            <label>სამუშაო საათები</label>
            <input type="text" data-field="site.hours" value="${escapeHtml(s.hours)}" />
          </div>
          <div class="form-group">
            <label>შაბათ-კვირა</label>
            <input type="text" data-field="site.hoursWeekend" value="${escapeHtml(s.hoursWeekend || '')}" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">სოციალური ქსელები</h3>
          <p class="card-subtitle">Footer-ში footer ludet links. ცარიელი — ტაბი აღარ ჩანს.</p>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>Facebook</label>
            <input type="url" data-field="site.social.facebook" value="${escapeHtml(s.social?.facebook || '')}" placeholder="https://facebook.com/..." />
          </div>
          <div class="form-group">
            <label>Instagram</label>
            <input type="url" data-field="site.social.instagram" value="${escapeHtml(s.social?.instagram || '')}" placeholder="https://instagram.com/..." />
          </div>
          <div class="form-group">
            <label>LinkedIn</label>
            <input type="url" data-field="site.social.linkedin" value="${escapeHtml(s.social?.linkedin || '')}" placeholder="https://linkedin.com/..." />
          </div>
          <div class="form-group">
            <label>YouTube</label>
            <input type="url" data-field="site.social.youtube" value="${escapeHtml(s.social?.youtube || '')}" placeholder="https://youtube.com/..." />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">💬 მდნიშვნელობა Live chat widget</h3>
          <p class="card-subtitle">Floating ღილაკი მარჯვენა-ქვედა კუთხეში — ვიზიტორი აჭერს და WhatsApp/Telegram/WeChat-ში ხსნის საუბარს. რომელიც ველსაც არ შეავსებ, იმ ტაბი იმალება.</p>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" data-field="site.chat.enabled" ${s.chat?.enabled ? 'checked' : ''} />
              <span class="switch-slider"></span>
              <span class="switch-label">Live chat widget ჩართულია</span>
            </label>
            <small class="hint">Desktop + mobile. Default: ჩართული</small>
          </div>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>WhatsApp — ტელეფონის ნომერი</label>
            <input type="text" data-field="site.chat.whatsapp" value="${escapeHtml(s.chat?.whatsapp || '')}" placeholder="+995555123456" />
            <small class="hint">საერთაშორისო ფორმატი, + ნიშნით. მაგ: +995555123456</small>
          </div>
          <div class="form-group">
            <label>Telegram — username (@-ის გარეშე)</label>
            <input type="text" data-field="site.chat.telegram" value="${escapeHtml(s.chat?.telegram || '')}" placeholder="gubermangroup" />
            <small class="hint">telegram.me/<strong>username</strong></small>
          </div>
          <div class="form-group">
            <label>WeChat — ID</label>
            <input type="text" data-field="site.chat.wechat" value="${escapeHtml(s.chat?.wechat || '')}" placeholder="your-wechat-id" />
            <small class="hint">WeChat-ში საუბრისთვის გადავა weixin:// schema-ზე</small>
          </div>
          <div class="form-group">
            <label>Viber — ტელეფონის ნომერი (არასავალდებულო)</label>
            <input type="text" data-field="site.chat.viber" value="${escapeHtml(s.chat?.viber || '')}" placeholder="+995555123456" />
          </div>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>მისალმება ტექსტი</label>
            <input type="text" data-field="site.chat.greeting" value="${escapeHtml(s.chat?.greeting || '')}" placeholder="გამარჯობა! როგორ დაგეხმაროთ? 👋" />
            <small class="hint">ჩანს chat panel-ის თავში</small>
          </div>
          <div class="form-group">
            <label>წინასწარი მესიჯი (pre-filled)</label>
            <input type="text" data-field="site.chat.prefill" value="${escapeHtml(s.chat?.prefill || '')}" placeholder="გამარჯობა, საიტიდან გწერთ..." />
            <small class="hint">ავტომატურად ჩაწერს ამას WhatsApp/Telegram/Viber-ში</small>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Copyright</h3>
        </div>
        <div class="form-group">
          <label>Copyright ტექსტი</label>
          <input type="text" data-field="site.copyright" value="${escapeHtml(s.copyright)}" />
        </div>
      </div>
    `;
  }

  function attachSite() {
    attachFieldListeners();
    // Live image preview for URL fields (favicon / apple-touch / logo)
    // - Updates preview <img> as user types
    // - If Vercel URL fails to load (file not yet propagated), retries with GitHub raw URL
    $$('[data-url-preview]').forEach(input => {
      const preview = document.getElementById(input.dataset.urlPreview);
      if (!preview) return;
      const updatePreview = (rawUrl) => {
        if (!rawUrl) { preview.style.display = 'none'; return; }
        preview.style.display = 'block';
        preview.dataset.original = rawUrl;
        preview.dataset.retried = '';
        preview.src = rawUrl;
      };
      // On typing — update src live
      input.addEventListener('input', () => updatePreview(input.value.trim()));
      // On load failure — try GitHub raw URL as fallback
      preview.addEventListener('error', () => {
        const orig = preview.dataset.original || '';
        if (!orig) return;
        // Convert https://gubermangeo.com/<path> → raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>
        const m = orig.match(/^https:\/\/(?:gubermangeo\.com|[a-z0-9-]+\.vercel\.app)\/(.+)$/i);
        if (m && preview.dataset.retried !== 'raw') {
          const rawUrl = `https://raw.githubusercontent.com/chaba17/audit-company/main/${m[1]}`;
          preview.dataset.retried = 'raw';
          preview.src = rawUrl;
          return;
        }
        // Final retry with cache-bust after 3s
        if (preview.dataset.retried !== 'final') {
          preview.dataset.retried = 'final';
          setTimeout(() => {
            preview.src = orig + (orig.includes('?') ? '&' : '?') + 'v=' + Date.now();
          }, 3000);
        }
      });
    });
  }

  // --- HERO ---
  function renderHero() {
    const h = state.content.hero;
    return `
      <div class="page-header">
        <div>
          <h1>Hero სექცია</h1>
          <p>მთავარი გვერდის ზედა სექცია — პირველი შთაბეჭდილება</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">სათაური და ტექსტი</h3>
          <p class="card-subtitle">თარგმნე ოთხივე ენაზე — აირჩიე tab ქვემოთ</p>
        </div>
        ${renderSectionLangTabBar('hero', 'Tag / სათაური / აღწერა')}
        <div class="form-grid">
          <div class="form-group">
            <label>Tag (პატარა ყვითელი ლეიბლი) <span class="lang-hint-badge" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label>
            <input type="text" data-lang-field="tag" value="" />
          </div>
          <div class="form-group">
            <label>მთავარი სათაური <span class="required">*</span> <span class="lang-hint-badge" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label>
            <textarea data-lang-field="title" rows="3"></textarea>
            <small class="hint">HTML-ის გამოყენება შესაძლებელია. <code>&lt;mark&gt;სიტყვა&lt;/mark&gt;</code> — ყვითელი highlight</small>
          </div>
          <div class="form-group">
            <label>აღწერა <span class="lang-hint-badge" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label>
            <textarea data-lang-field="subtitle" rows="3"></textarea>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">ღილაკები (CTA) — თარგმანი</h3>
        </div>
        ${renderSectionLangTabBar('hero', 'ღილაკების ტექსტი')}
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>Primary ღილაკი — ტექსტი <span class="lang-hint-badge" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label>
            <input type="text" data-lang-field="primaryCta.text" value="" />
          </div>
          <div class="form-group">
            <label>Primary ღილაკი — URL (საერთო)</label>
            <input type="text" data-field="hero.primaryCta.href" value="${escapeHtml(h.primaryCta?.href || '')}" />
          </div>
          <div class="form-group">
            <label>Secondary ღილაკი — ტექსტი <span class="lang-hint-badge" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label>
            <input type="text" data-lang-field="secondaryCta.text" value="" />
          </div>
          <div class="form-group">
            <label>Secondary ღილაკი — URL (საერთო)</label>
            <input type="text" data-field="hero.secondaryCta.href" value="${escapeHtml(h.secondaryCta?.href || '')}" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">ფონის სურათი</h3>
        </div>
        <div class="image-input">
          <div class="image-input-field">
            <div class="form-group">
              <label>სურათის URL</label>
              <input type="url" data-field="hero.bgImage" data-preview="hero-bg-preview" value="${escapeHtml(h.bgImage)}" />
              <small class="hint">გამოიყენე Unsplash-ის ან სხვა დიდი სურათის URL. რეკ. ზომა: 2000×1200px</small>
            </div>
          </div>
          <div class="image-preview">
            ${h.bgImage ? `<img id="hero-bg-preview" src="${escapeHtml(h.bgImage)}" alt="" />` : '<span>N/A</span>'}
          </div>
        </div>
      </div>
    `;
  }

  function attachHero() {
    attachSectionLangTabs();
    attachFieldListeners();
    attachImagePreview();
  }

  // --- SERVICES ---
  function renderServices() {
    const services = state.content.services || [];
    return `
      <div class="page-header">
        <div>
          <h1>სერვისები</h1>
          <p>საიტზე გამოსახული ყველა სერვისი</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-yellow" id="add-service">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            ახალი სერვისი
          </button>
        </div>
      </div>

      <div class="list-toolbar">
        <div class="list-search">
          <input type="text" id="service-search" placeholder="მოძებნე სერვისი..." />
        </div>
      </div>

      ${services.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <h3>ჯერ სერვისები არ გაქვს</h3>
          <p>დაიწყე პირველი სერვისის დამატებით</p>
          <button class="btn btn-yellow" id="add-service-empty">+ პირველი სერვისი</button>
        </div>
      ` : `
        <div class="list-items" id="services-list">
          ${services.map((s, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>
              </div>
              <div style="display: flex; gap: 14px; align-items: center;">
                ${s.image ? `<img src="${escapeHtml(s.image)}" class="list-item-thumb" alt="" />` : `<div class="list-item-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>`}
                <div class="list-item-body">
                  <h4 class="list-item-title">${escapeHtml(s.title)}</h4>
                  <p class="list-item-subtitle">${escapeHtml(s.shortDesc || '')}</p>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}" title="რედაქტირება">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button class="icon-btn danger" data-delete="${i}" title="წაშლა">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachServices() {
    const add = () => openServiceModal();
    $('#add-service')?.addEventListener('click', add);
    $('#add-service-empty')?.addEventListener('click', add);

    $$('#services-list [data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openServiceModal(parseInt(btn.dataset.edit)));
    });
    $$('#services-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm(`წაიშალოს "${state.content.services[i].title}"?`)) return;
        state.content.services.splice(i, 1);
        markDirty();
        renderSection('services');
        toast('სერვისი წაიშალა', 'warning');
      });
    });

    $('#service-search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      $$('#services-list .list-item').forEach(item => {
        const txt = item.textContent.toLowerCase();
        item.style.display = txt.includes(q) ? '' : 'none';
      });
    });

    setupDragReorder('services-list', 'services');
  }

  function openServiceModal(index = null) {
    const isEdit = index !== null;
    const s = isEdit ? deepClone(state.content.services[index]) : {
      id: 'service-' + Date.now(),
      title: '', subtitle: '', shortDesc: '', fullDesc: '', icon: 'book-open', image: '', features: [], faq: [],
      i18n: {}
    };
    s.i18n = s.i18n || {};
    // Normalize FAQ items (accept {q,a} or {question,answer})
    s.faq = (s.faq || []).map(f => ({ q: f.q || f.question || '', a: f.a || f.answer || '' }));
    const ICONS = ['book-open', 'receipt', 'users', 'building', 'shield-check', 'message-circle', 'globe', 'briefcase', 'cpu'];
    const LANGS = ['ka', 'en', 'ru', 'he'];
    const LANG_LABELS = { ka: '🇬🇪 ქართული', en: '🇬🇧 English', ru: '🇷🇺 Русский', he: '🇮🇱 עברית' };

    openModal(isEdit ? 'სერვისის რედაქტირება' : 'ახალი სერვისი', `
      <!-- Language tabs -->
      <div class="lang-tabs" style="display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--gray-200); padding: 0;">
        ${LANGS.map(l => `
          <button type="button" class="lang-tab ${l === 'ka' ? 'active' : ''}" data-lang-tab="${l}" style="padding: 10px 14px; background: ${l === 'ka' ? 'var(--gray-100)' : 'transparent'}; border: none; border-bottom: 3px solid ${l === 'ka' ? 'var(--yellow)' : 'transparent'}; font-weight: 600; cursor: pointer; font-family: inherit; font-size: 13px; color: ${l === 'ka' ? 'var(--ink)' : 'var(--gray-500)'}; margin-bottom: -1px;">${LANG_LABELS[l]}</button>
        `).join('')}
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>სათაური <span class="required">*</span> <span class="lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">(<span class="current-lang-label">KA</span>)</span></label>
          <input type="text" id="svc-title" value="${escapeHtml(s.title)}" required />
        </div>
        <div class="form-group">
          <label>ID (URL slug) — <span style="color: var(--gray-500); font-weight: 400;">ყველა ენისთვის საერთოა</span></label>
          <input type="text" id="svc-id" value="${escapeHtml(s.id)}" data-lang-neutral />
          <small class="hint">გამოიყენება URL-ში, მაგ. services/accounting.html. ♻ სასურველია მხოლოდ ლათინური ასოები და ტირეები (a-z, 0-9, -).</small>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>ხატულა (Icon)</label>
            <select id="svc-icon">
              ${ICONS.map(ic => `<option value="${ic}" ${s.icon === ic ? 'selected' : ''}>${ic}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Hero სურათის URL</label>
            <input type="url" id="svc-image" value="${escapeHtml(s.image || '')}" />
            <small class="hint">გვიდონ შიდა გვერდზე ჰერო ბლოკში</small>
          </div>
        </div>
        <div class="form-group">
          <label>მოკლე აღწერა (ბარათებისთვის) <span class="lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">(<span class="current-lang-label">KA</span>)</span></label>
          <input type="text" id="svc-short" value="${escapeHtml(s.shortDesc || '')}" />
          <small class="hint">ჩანს სერვისების ბადეში ყოველი ბარათის ქვეშ</small>
        </div>
        <div class="form-group">
          <label>ქვესათაური (შიდა გვერდისთვის) <span class="lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">(<span class="current-lang-label">KA</span>)</span></label>
          <input type="text" id="svc-subtitle" value="${escapeHtml(s.subtitle || '')}" />
          <small class="hint">ერთ წინადადებიანი აღწერა სერვისის შიდა გვერდის ჰეროში</small>
        </div>
        <div class="form-group">
          <label>სრული აღწერა (შიდა გვერდის ინტრო ტექსტი) <span class="lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">(<span class="current-lang-label">KA</span>)</span></label>
          <textarea id="svc-full" rows="4">${escapeHtml(s.fullDesc || '')}</textarea>
        </div>
        <div class="form-group">
          <label>მახასიათებლები (შიდა გვერდზე გამოჩნდება)</label>
          <div class="features-editor" id="svc-features">
            ${(s.features || []).map((f, i) => `
              <div class="feature-row" data-i="${i}">
                <span class="feature-handle">≡</span>
                <input type="text" value="${escapeHtml(f)}" />
                <button class="icon-btn danger" data-remove-feature="${i}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-outline btn-xs" id="svc-add-feature" type="button" style="margin-top: 8px;">+ მახასიათებელი</button>
        </div>
        <div class="form-group">
          <label>FAQ (შიდა გვერდის ქვემოთ)</label>
          <div class="faq-editor" id="svc-faq-editor">
            ${s.faq.map((f, i) => `
              <div class="faq-row" data-i="${i}" style="border: 1px solid var(--gray-200); padding: 12px; margin-bottom: 8px; background: var(--gray-50);">
                <input type="text" placeholder="კითხვა" class="svc-faq-q" value="${escapeHtml(f.q)}" style="margin-bottom: 6px;" />
                <textarea rows="2" placeholder="პასუხი" class="svc-faq-a">${escapeHtml(f.a)}</textarea>
                <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
                  <button class="icon-btn danger" data-remove-faq="${i}" type="button"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-outline btn-xs" id="svc-add-faq" type="button" style="margin-top: 8px;">+ FAQ ელემენტი</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="svc-save">შენახვა</button>
      </div>
    `);

    // FAQ row bindings
    const bindFaqRemoves = () => {
      $$('#svc-faq-editor [data-remove-faq]').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.faq-row').remove());
      });
    };
    bindFaqRemoves();
    $('#svc-add-faq')?.addEventListener('click', () => {
      const container = $('#svc-faq-editor');
      const row = document.createElement('div');
      row.className = 'faq-row';
      row.style.cssText = 'border: 1px solid var(--gray-200); padding: 12px; margin-bottom: 8px; background: var(--gray-50);';
      row.innerHTML = `
        <input type="text" placeholder="კითხვა" class="svc-faq-q" value="" style="margin-bottom: 6px;" />
        <textarea rows="2" placeholder="პასუხი" class="svc-faq-a"></textarea>
        <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
          <button class="icon-btn danger" type="button"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
        </div>
      `;
      container.appendChild(row);
      row.querySelector('button').addEventListener('click', () => row.remove());
      row.querySelector('input').focus();
    });

    const rerenderFeatures = () => {
      const container = $('#svc-features');
      const features = $$('#svc-features .feature-row input').map(i => i.value);
      container.innerHTML = features.map((f, i) => `
        <div class="feature-row" data-i="${i}">
          <span class="feature-handle">≡</span>
          <input type="text" value="${escapeHtml(f)}" />
          <button class="icon-btn danger" data-remove-feature="${i}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
        </div>
      `).join('');
      bindFeatureRemoves();
    };
    const bindFeatureRemoves = () => {
      $$('#svc-features [data-remove-feature]').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.closest('.feature-row').remove();
        });
      });
    };
    bindFeatureRemoves();

    $('#svc-add-feature').addEventListener('click', () => {
      const container = $('#svc-features');
      const row = document.createElement('div');
      row.className = 'feature-row';
      row.innerHTML = `<span class="feature-handle">≡</span><input type="text" value="" placeholder="ახალი მახასიათებელი" /><button class="icon-btn danger"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/></svg></button>`;
      container.appendChild(row);
      row.querySelector('input').focus();
      row.querySelector('button').addEventListener('click', () => row.remove());
    });

    // Slugify helper — URL-safe (keeps Georgian letters but strips spaces/special chars)
    const slugify = (str) => {
      if (!str) return '';
      return str.toString().trim()
        .toLowerCase()
        .replace(/\s+/g, '-')           // spaces → hyphens
        .replace(/[\/\\?#&=]/g, '-')    // URL-unsafe → hyphens
        .replace(/-+/g, '-')            // collapse multiple hyphens
        .replace(/^-|-$/g, '');         // trim leading/trailing hyphens
    };

    // Auto-fill slug from title when user is creating a new service and hasn't manually edited ID
    if (!isEdit) {
      let slugManuallyEdited = false;
      $('#svc-id')?.addEventListener('input', () => { slugManuallyEdited = true; });
      $('#svc-title')?.addEventListener('input', () => {
        if (!slugManuallyEdited && currentLang === 'ka') {
          const suggested = slugify($('#svc-title').value) || s.id;
          $('#svc-id').value = suggested;
        }
      });
    }

    // ===== LANGUAGE TAB SWITCHING =====
    // Fields that are per-language:
    const LANG_FIELDS = {
      title: '#svc-title',
      subtitle: '#svc-subtitle',
      shortDesc: '#svc-short',
      fullDesc: '#svc-full'
    };
    // features + faq are also per-language (arrays)
    let currentLang = 'ka';

    const readCurrentLangToDraft = () => {
      // Collect current form values into draft for the currentLang
      const snapshot = {
        title: $('#svc-title').value,
        subtitle: $('#svc-subtitle').value,
        shortDesc: $('#svc-short').value,
        fullDesc: $('#svc-full').value,
        features: $$('#svc-features .feature-row input').map(i => i.value).filter(Boolean),
        faq: $$('#svc-faq-editor .faq-row').map(row => ({
          q: row.querySelector('.svc-faq-q')?.value.trim() || '',
          a: row.querySelector('.svc-faq-a')?.value.trim() || ''
        })).filter(f => f.q || f.a)
      };
      if (currentLang === 'ka') {
        Object.assign(s, snapshot);
      } else {
        s.i18n[currentLang] = snapshot;
      }
    };

    const loadLangToForm = (lang) => {
      const source = lang === 'ka' ? s : (s.i18n[lang] || {});
      $('#svc-title').value = source.title || '';
      $('#svc-subtitle').value = source.subtitle || '';
      $('#svc-short').value = source.shortDesc || '';
      $('#svc-full').value = source.fullDesc || '';
      // features
      const featuresHtml = (source.features || []).map((f, i) => `
        <div class="feature-row" data-i="${i}">
          <span class="feature-handle">≡</span>
          <input type="text" value="${escapeHtml(f)}" />
          <button class="icon-btn danger" data-remove-feature="${i}" type="button"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/></svg></button>
        </div>
      `).join('');
      $('#svc-features').innerHTML = featuresHtml;
      bindFeatureRemoves();
      // faq
      const faqHtml = (source.faq || []).map((f, i) => `
        <div class="faq-row" data-i="${i}" style="border: 1px solid var(--gray-200); padding: 12px; margin-bottom: 8px; background: var(--gray-50);">
          <input type="text" placeholder="კითხვა" class="svc-faq-q" value="${escapeHtml(f.q || '')}" style="margin-bottom: 6px;" />
          <textarea rows="2" placeholder="პასუხი" class="svc-faq-a">${escapeHtml(f.a || '')}</textarea>
          <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
            <button class="icon-btn danger" data-remove-faq="${i}" type="button"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/></svg></button>
          </div>
        </div>
      `).join('');
      $('#svc-faq-editor').innerHTML = faqHtml;
      bindFaqRemoves();

      // Update visual hint for per-language fields
      document.querySelectorAll('.current-lang-label').forEach(el => {
        el.textContent = lang.toUpperCase();
      });

      // Hebrew RTL inside modal
      $('#svc-title').dir = lang === 'he' ? 'rtl' : 'ltr';
      $('#svc-subtitle').dir = lang === 'he' ? 'rtl' : 'ltr';
      $('#svc-short').dir = lang === 'he' ? 'rtl' : 'ltr';
      $('#svc-full').dir = lang === 'he' ? 'rtl' : 'ltr';
    };

    document.querySelectorAll('.lang-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        readCurrentLangToDraft();
        currentLang = btn.getAttribute('data-lang-tab');
        // Update visual state
        document.querySelectorAll('.lang-tab').forEach(b => {
          const isActive = b === btn;
          b.classList.toggle('active', isActive);
          b.style.background = isActive ? 'var(--gray-100)' : 'transparent';
          b.style.borderBottomColor = isActive ? 'var(--yellow)' : 'transparent';
          b.style.color = isActive ? 'var(--ink)' : 'var(--gray-500)';
        });
        loadLangToForm(currentLang);
      });
    });

    $('#svc-save').addEventListener('click', () => {
      // Capture current tab into draft before saving
      readCurrentLangToDraft();
      // Always slugify the final id — prevents spaces/special chars breaking URLs
      const rawId = $('#svc-id').value || '';
      const cleanId = slugify(rawId) || 'service-' + Date.now();
      const updated = {
        id: cleanId,
        title: s.title,
        subtitle: s.subtitle,
        shortDesc: s.shortDesc,
        fullDesc: s.fullDesc,
        icon: $('#svc-icon').value,
        image: $('#svc-image').value,
        features: s.features || [],
        faq: s.faq || [],
        i18n: s.i18n || {}
      };
      // Clean empty i18n overrides
      Object.keys(updated.i18n).forEach(l => {
        const o = updated.i18n[l];
        if (!o) { delete updated.i18n[l]; return; }
        const hasAny = ['title','subtitle','shortDesc','fullDesc'].some(k => (o[k]||'').trim()) ||
                       (Array.isArray(o.features) && o.features.length) ||
                       (Array.isArray(o.faq) && o.faq.length);
        if (!hasAny) delete updated.i18n[l];
      });
      if (!Object.keys(updated.i18n).length) delete updated.i18n;

      if (!updated.title) { toast('სათაური სავალდებულოა (ქართული ძირითადი ენაა)', 'error'); return; }
      if (isEdit) state.content.services[index] = updated;
      else state.content.services.push(updated);
      markDirty();
      closeModal();
      renderSection('services');
      updateBadges();
      toast(isEdit ? 'სერვისი განახლდა' : 'სერვისი დამატებულია', 'success');
    });
  }

  // --- PRICING ---
  function renderPricing() {
    const p = state.content.pricing;
    return `
      <div class="page-header">
        <div>
          <h1>ფასები</h1>
          <p>მართე 3 საფასო პაკეტი</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-yellow" id="add-plan">+ პაკეტი</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">ზოგადი პარამეტრები</h3>
        </div>
        <div class="form-grid cols-3">
          <div class="form-group">
            <label>თვიური ტექსტი</label>
            <input type="text" data-field="pricing.monthly" value="${escapeHtml(p.monthly)}" />
          </div>
          <div class="form-group">
            <label>"Popular" badge ტექსტი</label>
            <input type="text" data-field="pricing.popular" value="${escapeHtml(p.popular)}" />
          </div>
          <div class="form-group">
            <label>CTA ღილაკის ტექსტი</label>
            <input type="text" data-field="pricing.ctaStart" value="${escapeHtml(p.ctaStart)}" />
          </div>
        </div>
      </div>

      <div class="list-items" id="plans-list">
        ${(p.plans || []).map((plan, i) => `
          <div class="list-item" data-index="${i}">
            <div class="list-item-handle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>
            </div>
            <div class="list-item-body">
              <h4 class="list-item-title">
                ${escapeHtml(plan.name)}
                ${plan.featured ? `<span class="list-item-featured">POPULAR</span>` : ''}
              </h4>
              <p class="list-item-subtitle">${escapeHtml(plan.currency)} ${escapeHtml(plan.price)} — ${escapeHtml(plan.description || '')}</p>
            </div>
            <div class="list-item-actions">
              <button class="icon-btn" data-edit-plan="${i}" title="რედაქტირება">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
              <button class="icon-btn danger" data-delete-plan="${i}" title="წაშლა">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function attachPricing() {
    attachFieldListeners();
    $('#add-plan')?.addEventListener('click', () => openPlanModal());
    $$('#plans-list [data-edit-plan]').forEach(btn => {
      btn.addEventListener('click', () => openPlanModal(parseInt(btn.dataset.editPlan)));
    });
    $$('#plans-list [data-delete-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.deletePlan);
        if (!confirm(`წაიშალოს "${state.content.pricing.plans[i].name}"?`)) return;
        state.content.pricing.plans.splice(i, 1);
        markDirty();
        renderSection('pricing');
        toast('პაკეტი წაიშალა', 'warning');
      });
    });
  }

  function openPlanModal(index = null) {
    const isEdit = index !== null;
    const p = isEdit ? deepClone(state.content.pricing.plans[index]) : {
      name: '', description: '', price: '0', currency: '₾', featured: false, features: []
    };

    openModal(isEdit ? 'პაკეტის რედაქტირება' : 'ახალი პაკეტი', `
      <div class="form-grid">
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>დასახელება <span class="required">*</span></label>
            <input type="text" id="plan-name" value="${escapeHtml(p.name)}" />
          </div>
          <div class="form-group">
            <label>აღწერა</label>
            <input type="text" id="plan-desc" value="${escapeHtml(p.description)}" />
          </div>
        </div>
        <div class="form-grid cols-3">
          <div class="form-group">
            <label>ფასი</label>
            <input type="text" id="plan-price" value="${escapeHtml(p.price)}" />
          </div>
          <div class="form-group">
            <label>ვალუტა</label>
            <input type="text" id="plan-currency" value="${escapeHtml(p.currency)}" maxlength="4" />
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <label class="switch" style="padding: 8px 0;">
              <input type="checkbox" id="plan-featured" ${p.featured ? 'checked' : ''} />
              <span class="switch-slider"></span>
              <span class="switch-label">Popular პაკეტი</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>მახასიათებლები</label>
          <div class="features-editor" id="plan-features">
            ${(p.features || []).map((f, i) => `
              <div class="feature-row">
                <span class="feature-handle">≡</span>
                <input type="text" value="${escapeHtml(f)}" />
                <button class="icon-btn danger" type="button"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/></svg></button>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-outline btn-xs" id="plan-add-feature" type="button" style="margin-top: 8px;">+ მახასიათებელი</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="plan-save">შენახვა</button>
      </div>
    `);

    $$('#plan-features .icon-btn.danger').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.feature-row').remove());
    });

    $('#plan-add-feature').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'feature-row';
      row.innerHTML = `<span class="feature-handle">≡</span><input type="text" placeholder="ახალი მახასიათებელი" /><button type="button" class="icon-btn danger"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/></svg></button>`;
      $('#plan-features').appendChild(row);
      row.querySelector('input').focus();
      row.querySelector('button').addEventListener('click', () => row.remove());
    });

    $('#plan-save').addEventListener('click', () => {
      const updated = {
        name: $('#plan-name').value,
        description: $('#plan-desc').value,
        price: $('#plan-price').value,
        currency: $('#plan-currency').value,
        featured: $('#plan-featured').checked,
        features: $$('#plan-features .feature-row input').map(i => i.value).filter(Boolean)
      };
      if (!updated.name) { toast('სახელი სავალდებულოა', 'error'); return; }
      if (isEdit) state.content.pricing.plans[index] = updated;
      else state.content.pricing.plans.push(updated);
      markDirty();
      closeModal();
      renderSection('pricing');
      updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- TEAM ---
  function renderTeam() {
    const team = state.content.team || [];
    return `
      <div class="page-header">
        <div>
          <h1>გუნდის წევრები</h1>
          <p>გუნდის გვერდის მართვა</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-yellow" id="add-member">+ წევრი</button>
        </div>
      </div>
      ${team.length === 0 ? emptyState('ჯერ გუნდის წევრები არ გაქვს', 'დაამატე პირველი წევრი', 'add-member-empty') : `
        <div class="list-items" id="team-list">
          ${team.map((m, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
              <div style="display: flex; gap: 14px; align-items: center;">
                ${m.photo ? `<img src="${escapeHtml(m.photo)}" class="list-item-thumb" style="border-radius: 50%;" alt="" />` : `<div class="list-item-icon" style="border-radius: 50%;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`}
                <div class="list-item-body">
                  <h4 class="list-item-title">${escapeHtml(m.name)} ${m.tag ? `<span class="list-item-featured">${escapeHtml(m.tag)}</span>` : ''}</h4>
                  <p class="list-item-subtitle">${escapeHtml(m.role)} — ${escapeHtml(m.bio || '')}</p>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachTeam() {
    const add = () => openTeamModal();
    $('#add-member')?.addEventListener('click', add);
    $('#add-member-empty')?.addEventListener('click', add);
    $$('#team-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openTeamModal(parseInt(btn.dataset.edit))));
    $$('#team-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm(`წაიშალოს "${state.content.team[i].name}"?`)) return;
        state.content.team.splice(i, 1);
        markDirty();
        renderSection('team');
        toast('წევრი წაიშალა', 'warning');
      });
    });
    setupDragReorder('team-list', 'team');
  }

  function openTeamModal(index = null) {
    const isEdit = index !== null;
    const m = isEdit ? deepClone(state.content.team[index]) : { name: '', role: '', tag: '', bio: '', photo: '', i18n: {} };
    m.i18n = m.i18n || {};
    openModal(isEdit ? 'წევრის რედაქტირება' : 'ახალი წევრი', `
      ${MODAL_LANG_TABS_HTML}
      <div class="form-grid">
        <div class="form-grid cols-2">
          <div class="form-group"><label>სახელი და გვარი * <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><input type="text" id="mem-name" value="${escapeHtml(m.name)}" /></div>
          <div class="form-group"><label>პოზიცია <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><input type="text" id="mem-role" value="${escapeHtml(m.role)}" /></div>
          <div class="form-group"><label>Tag (მაგ. ACCA, CPA) <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><input type="text" id="mem-tag" value="${escapeHtml(m.tag || '')}" /></div>
          <div class="form-group"><label>ფოტო URL <small style="color: var(--gray-500); font-weight: 400;">(ყველა ენისთვის საერთო)</small></label><input type="url" id="mem-photo" value="${escapeHtml(m.photo || '')}" /></div>
        </div>
        <div class="form-group"><label>ბიო <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><textarea id="mem-bio" rows="3">${escapeHtml(m.bio || '')}</textarea></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="mem-save">შენახვა</button>
      </div>
    `);
    const lt = initModalLangTabs(m, { name: 'mem-name', role: 'mem-role', tag: 'mem-tag', bio: 'mem-bio' });
    $('#mem-save').addEventListener('click', () => {
      lt?.finalize();
      m.photo = $('#mem-photo').value; // non-translatable field grabbed explicitly
      if (!m.name) { toast('სახელი სავალდებულოა (KA ძირითადი ენაა)', 'error'); return; }
      if (isEdit) state.content.team[index] = m; else state.content.team.push(m);
      markDirty(); closeModal(); renderSection('team'); updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- TESTIMONIALS ---
  function renderTestimonials() {
    const items = state.content.testimonials || [];
    return `
      <div class="page-header">
        <div><h1>გამოხმაურებები</h1><p>კლიენტების ცოცხალი გამოხმაურებები</p></div>
        <div class="page-header-actions"><button class="btn btn-yellow" id="add-testimonial">+ გამოხმაურება</button></div>
      </div>
      ${items.length === 0 ? emptyState('ჯერ გამოხმაურებები არ გაქვს', 'დაამატე პირველი', 'add-testimonial-empty') : `
        <div class="list-items" id="testimonials-list">
          ${items.map((t, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
              <div style="display: flex; gap: 14px; align-items: center;">
                ${t.avatar ? `<img src="${escapeHtml(t.avatar)}" class="list-item-thumb" style="border-radius: 50%;" alt="" />` : `<div class="list-item-icon" style="border-radius: 50%;">👤</div>`}
                <div class="list-item-body">
                  <h4 class="list-item-title">${escapeHtml(t.author)}</h4>
                  <p class="list-item-subtitle">${escapeHtml(t.role)} — "${escapeHtml((t.quote||'').substring(0, 80))}..."</p>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachTestimonials() {
    const add = () => openTestimonialModal();
    $('#add-testimonial')?.addEventListener('click', add);
    $('#add-testimonial-empty')?.addEventListener('click', add);
    $$('#testimonials-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openTestimonialModal(parseInt(btn.dataset.edit))));
    $$('#testimonials-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm('წაიშალოს გამოხმაურება?')) return;
        state.content.testimonials.splice(i, 1);
        markDirty(); renderSection('testimonials'); toast('წაიშალა', 'warning');
      });
    });
    setupDragReorder('testimonials-list', 'testimonials');
  }

  function openTestimonialModal(index = null) {
    const isEdit = index !== null;
    const t = isEdit ? deepClone(state.content.testimonials[index]) : { quote: '', author: '', role: '', avatar: '', i18n: {} };
    t.i18n = t.i18n || {};
    openModal(isEdit ? 'გამოხმაურების რედაქტირება' : 'ახალი გამოხმაურება', `
      ${MODAL_LANG_TABS_HTML}
      <div class="form-grid">
        <div class="form-group"><label>Quote (ციტატა) * <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><textarea id="tes-quote" rows="4">${escapeHtml(t.quote)}</textarea></div>
        <div class="form-grid cols-2">
          <div class="form-group"><label>ავტორი <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><input type="text" id="tes-author" value="${escapeHtml(t.author)}" /></div>
          <div class="form-group"><label>პოზიცია / კომპანია <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><input type="text" id="tes-role" value="${escapeHtml(t.role)}" /></div>
        </div>
        <div class="form-group"><label>Avatar URL <small style="color: var(--gray-500); font-weight: 400;">(ყველა ენისთვის საერთო)</small></label><input type="url" id="tes-avatar" value="${escapeHtml(t.avatar || '')}" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="tes-save">შენახვა</button>
      </div>
    `);
    const lt = initModalLangTabs(t, { quote: 'tes-quote', author: 'tes-author', role: 'tes-role' });
    $('#tes-save').addEventListener('click', () => {
      lt?.finalize();
      t.avatar = $('#tes-avatar').value;
      if (!t.quote) { toast('ციტატა სავალდებულოა (KA)', 'error'); return; }
      if (isEdit) state.content.testimonials[index] = t; else state.content.testimonials.push(t);
      markDirty(); closeModal(); renderSection('testimonials'); updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- FAQ ---
  function renderFAQ() {
    const items = state.content.faq || [];
    return `
      <div class="page-header">
        <div><h1>FAQ</h1><p>ხშირად დასმული კითხვები</p></div>
        <div class="page-header-actions"><button class="btn btn-yellow" id="add-faq">+ კითხვა</button></div>
      </div>
      ${items.length === 0 ? emptyState('FAQ ცარიელია', 'დაამატე პირველი', 'add-faq-empty') : `
        <div class="list-items" id="faq-list">
          ${items.map((f, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
              <div class="list-item-body">
                <h4 class="list-item-title">${escapeHtml(f.question)}</h4>
                <p class="list-item-subtitle">${escapeHtml((f.answer || '').substring(0, 100))}...</p>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachFAQ() {
    const add = () => openFAQModal();
    $('#add-faq')?.addEventListener('click', add);
    $('#add-faq-empty')?.addEventListener('click', add);
    $$('#faq-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openFAQModal(parseInt(btn.dataset.edit))));
    $$('#faq-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm('წაიშალოს კითხვა?')) return;
        state.content.faq.splice(i, 1);
        markDirty(); renderSection('faq'); toast('წაიშალა', 'warning');
      });
    });
    setupDragReorder('faq-list', 'faq');
  }

  function openFAQModal(index = null) {
    const isEdit = index !== null;
    const f = isEdit ? deepClone(state.content.faq[index]) : { question: '', answer: '', i18n: {} };
    f.i18n = f.i18n || {};
    openModal(isEdit ? 'FAQ რედაქტირება' : 'ახალი FAQ', `
      ${MODAL_LANG_TABS_HTML}
      <div class="form-grid">
        <div class="form-group"><label>კითხვა * <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><input type="text" id="faq-q" value="${escapeHtml(f.question)}" /></div>
        <div class="form-group"><label>პასუხი * <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><textarea id="faq-a" rows="5">${escapeHtml(f.answer)}</textarea></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="faq-save">შენახვა</button>
      </div>
    `);
    const lt = initModalLangTabs(f, { question: 'faq-q', answer: 'faq-a' });
    $('#faq-save').addEventListener('click', () => {
      lt?.finalize();
      if (!f.question || !f.answer) { toast('ორივე ველი სავალდებულოა (KA)', 'error'); return; }
      if (isEdit) state.content.faq[index] = f; else state.content.faq.push(f);
      markDirty(); closeModal(); renderSection('faq'); updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- BLOG ---
  function renderBlog() {
    const items = state.content.blog || [];
    return `
      <div class="page-header">
        <div><h1>ბლოგის პოსტები</h1><p>Insights & Thought Leadership</p></div>
        <div class="page-header-actions"><button class="btn btn-yellow" id="add-blog">+ სტატია</button></div>
      </div>
      ${items.length === 0 ? emptyState('ბლოგი ცარიელია', 'დაწერე პირველი სტატია', 'add-blog-empty') : `
        <div class="list-items" id="blog-list">
          ${items.map((b, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
              <div style="display: flex; gap: 14px; align-items: center;">
                ${b.image ? `<img src="${escapeHtml(b.image)}" class="list-item-thumb" alt="" />` : `<div class="list-item-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg></div>`}
                <div class="list-item-body">
                  <h4 class="list-item-title">${escapeHtml(b.title)} ${b.featured ? `<span class="list-item-featured">FEATURED</span>` : ''}</h4>
                  <p class="list-item-subtitle">${escapeHtml(b.category)} · ${escapeHtml(b.date)} · ${escapeHtml(b.readTime || '')}</p>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachBlog() {
    const add = () => openBlogModal();
    $('#add-blog')?.addEventListener('click', add);
    $('#add-blog-empty')?.addEventListener('click', add);
    $$('#blog-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openBlogModal(parseInt(btn.dataset.edit))));
    $$('#blog-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm(`წაიშალოს "${state.content.blog[i].title}"?`)) return;
        state.content.blog.splice(i, 1);
        markDirty(); renderSection('blog'); toast('წაიშალა', 'warning');
      });
    });
    setupDragReorder('blog-list', 'blog');
  }

  function openBlogModal(index = null) {
    const isEdit = index !== null;
    const b = isEdit ? deepClone(state.content.blog[index]) : {
      title: '', slug: '', category: '', date: new Date().toISOString().split('T')[0], readTime: '5 წუთი', excerpt: '', image: '', featured: false, i18n: {}
    };
    b.i18n = b.i18n || {};
    openModal(isEdit ? 'ბლოგის რედაქტირება' : 'ახალი სტატია', `
      ${MODAL_LANG_TABS_HTML}
      <div class="form-grid">
        <div class="form-group"><label>სათაური * <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><input type="text" id="bl-title" value="${escapeHtml(b.title)}" /></div>
        <div class="form-grid cols-2">
          <div class="form-group"><label>Slug (URL) <small style="color: var(--gray-500); font-weight: 400;">(ენებისთვის საერთო)</small></label><input type="text" id="bl-slug" value="${escapeHtml(b.slug)}" /></div>
          <div class="form-group"><label>კატეგორია <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><input type="text" id="bl-category" value="${escapeHtml(b.category)}" /></div>
        </div>
        <div class="form-grid cols-3">
          <div class="form-group"><label>თარიღი <small style="color: var(--gray-500); font-weight: 400;">(საერთო)</small></label><input type="date" id="bl-date" value="${escapeHtml(b.date)}" /></div>
          <div class="form-group"><label>წაკითხვის დრო <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><input type="text" id="bl-read" value="${escapeHtml(b.readTime || '')}" /></div>
          <div class="form-group">
            <label>&nbsp;</label>
            <label class="switch" style="padding: 8px 0;"><input type="checkbox" id="bl-featured" ${b.featured ? 'checked' : ''} /><span class="switch-slider"></span><span class="switch-label">Featured</span></label>
          </div>
        </div>
        <div class="form-group"><label>Excerpt (მოკლე აღწერა) <span class="modal-lang-hint" style="color: var(--gray-500); font-weight: 400; font-size: 12px;">KA</span></label><textarea id="bl-excerpt" rows="3">${escapeHtml(b.excerpt || '')}</textarea></div>
        <div class="form-group"><label>სურათის URL <small style="color: var(--gray-500); font-weight: 400;">(საერთო)</small></label><input type="url" id="bl-image" value="${escapeHtml(b.image || '')}" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="bl-save">შენახვა</button>
      </div>
    `);
    const lt = initModalLangTabs(b, { title: 'bl-title', category: 'bl-category', readTime: 'bl-read', excerpt: 'bl-excerpt' });
    $('#bl-save').addEventListener('click', () => {
      lt?.finalize();
      b.slug = $('#bl-slug').value;
      b.date = $('#bl-date').value;
      b.image = $('#bl-image').value;
      b.featured = $('#bl-featured').checked;
      if (!b.title) { toast('სათაური სავალდებულოა (KA)', 'error'); return; }
      if (isEdit) state.content.blog[index] = b; else state.content.blog.push(b);
      markDirty(); closeModal(); renderSection('blog'); updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- INDUSTRIES ---
  function renderIndustries() {
    const items = state.content.industries || [];
    return `
      <div class="page-header">
        <div><h1>ინდუსტრიები</h1><p>სექტორები რომელთაც ემსახურები</p></div>
        <div class="page-header-actions"><button class="btn btn-yellow" id="add-industry">+ ინდუსტრია</button></div>
      </div>
      ${items.length === 0 ? emptyState('ჯერ ინდუსტრიები არ გაქვს', 'დაამატე პირველი', 'add-industry-empty') : `
        <div class="list-items" id="industries-list">
          ${items.map((ind, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
              <div class="list-item-body">
                <h4 class="list-item-title">${escapeHtml(ind.title)}</h4>
                <p class="list-item-subtitle">${escapeHtml(ind.description)}</p>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachIndustries() {
    const add = () => openIndustryModal();
    $('#add-industry')?.addEventListener('click', add);
    $('#add-industry-empty')?.addEventListener('click', add);
    $$('#industries-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openIndustryModal(parseInt(btn.dataset.edit))));
    $$('#industries-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm(`წაიშალოს "${state.content.industries[i].title}"?`)) return;
        state.content.industries.splice(i, 1);
        markDirty(); renderSection('industries'); toast('წაიშალა', 'warning');
      });
    });
    setupDragReorder('industries-list', 'industries');
  }

  function openIndustryModal(index = null) {
    const isEdit = index !== null;
    const ind = isEdit ? deepClone(state.content.industries[index]) : { title: '', description: '', i18n: {} };
    ind.i18n = ind.i18n || {};
    const LANGS = ['ka', 'en', 'ru', 'he'];
    const LANG_LABELS = { ka: '🇬🇪 ქართული', en: '🇬🇧 English', ru: '🇷🇺 Русский', he: '🇮🇱 עברית' };

    openModal(isEdit ? 'ინდუსტრიის რედაქტირება' : 'ახალი ინდუსტრია', `
      <div class="lang-tabs" style="display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--gray-200); padding: 0;">
        ${LANGS.map(l => `
          <button type="button" class="lang-tab ${l === 'ka' ? 'active' : ''}" data-lang-tab="${l}" style="padding: 10px 14px; background: ${l === 'ka' ? 'var(--gray-100)' : 'transparent'}; border: none; border-bottom: 3px solid ${l === 'ka' ? 'var(--yellow)' : 'transparent'}; font-weight: 600; cursor: pointer; font-family: inherit; font-size: 13px; color: ${l === 'ka' ? 'var(--ink)' : 'var(--gray-500)'}; margin-bottom: -1px;">${LANG_LABELS[l]}</button>
        `).join('')}
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>სახელი * <span style="color: var(--gray-500); font-weight: 400; font-size: 12px;">(<span class="current-lang-label">KA</span>)</span></label>
          <input type="text" id="ind-title" value="${escapeHtml(ind.title)}" />
        </div>
        <div class="form-group">
          <label>აღწერა <span style="color: var(--gray-500); font-weight: 400; font-size: 12px;">(<span class="current-lang-label">KA</span>)</span></label>
          <textarea id="ind-desc" rows="3">${escapeHtml(ind.description || '')}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="ind-save">შენახვა</button>
      </div>
    `);

    let currentLang = 'ka';
    const readCurrentLangToDraft = () => {
      const snapshot = {
        title: $('#ind-title').value,
        description: $('#ind-desc').value
      };
      if (currentLang === 'ka') {
        Object.assign(ind, snapshot);
      } else {
        ind.i18n[currentLang] = snapshot;
      }
    };
    const loadLangToForm = (lang) => {
      const source = lang === 'ka' ? ind : (ind.i18n[lang] || {});
      $('#ind-title').value = source.title || '';
      $('#ind-desc').value = source.description || '';
      document.querySelectorAll('.current-lang-label').forEach(el => { el.textContent = lang.toUpperCase(); });
      $('#ind-title').dir = lang === 'he' ? 'rtl' : 'ltr';
      $('#ind-desc').dir = lang === 'he' ? 'rtl' : 'ltr';
    };
    document.querySelectorAll('.lang-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        readCurrentLangToDraft();
        currentLang = btn.getAttribute('data-lang-tab');
        document.querySelectorAll('.lang-tab').forEach(b => {
          const active = b === btn;
          b.classList.toggle('active', active);
          b.style.background = active ? 'var(--gray-100)' : 'transparent';
          b.style.borderBottomColor = active ? 'var(--yellow)' : 'transparent';
          b.style.color = active ? 'var(--ink)' : 'var(--gray-500)';
        });
        loadLangToForm(currentLang);
      });
    });

    $('#ind-save').addEventListener('click', () => {
      readCurrentLangToDraft();
      // Clean empty i18n overrides
      Object.keys(ind.i18n).forEach(l => {
        const o = ind.i18n[l];
        if (!o) { delete ind.i18n[l]; return; }
        const has = (o.title || '').trim() || (o.description || '').trim();
        if (!has) delete ind.i18n[l];
      });
      if (!Object.keys(ind.i18n).length) delete ind.i18n;
      if (!ind.title) { toast('სახელი სავალდებულოა (ქართული ძირითადი ენაა)', 'error'); return; }
      if (isEdit) state.content.industries[index] = ind; else state.content.industries.push(ind);
      markDirty(); closeModal(); renderSection('industries'); updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- STATS ---
  function renderStats() {
    const stats = state.content.stats || [];
    return `
      <div class="page-header">
        <div><h1>სტატისტიკა</h1><p>მთავარი გვერდის დიდი რიცხვები</p></div>
        <div class="page-header-actions"><button class="btn btn-yellow" id="add-stat">+ სტატი</button></div>
      </div>
      <div class="list-items" id="stats-list">
        ${stats.map((st, i) => `
          <div class="list-item" data-index="${i}">
            <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
            <div class="list-item-body">
              <h4 class="list-item-title" style="font-size: 20px;">${escapeHtml(st.value)}</h4>
              <p class="list-item-subtitle">${escapeHtml(st.label)}</p>
            </div>
            <div class="list-item-actions">
              <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
              <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function attachStats() {
    $('#add-stat')?.addEventListener('click', () => openStatModal());
    $$('#stats-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openStatModal(parseInt(btn.dataset.edit))));
    $$('#stats-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm('წაიშალოს?')) return;
        state.content.stats.splice(i, 1);
        markDirty(); renderSection('stats'); toast('წაიშალა', 'warning');
      });
    });
    setupDragReorder('stats-list', 'stats');
  }

  function openStatModal(index = null) {
    const isEdit = index !== null;
    const s = isEdit ? deepClone(state.content.stats[index]) : { value: '', label: '' };
    openModal(isEdit ? 'სტატის რედაქტირება' : 'ახალი სტატი', `
      <div class="form-grid cols-2">
        <div class="form-group"><label>მაჩვენებელი (მაგ. 500+)</label><input type="text" id="st-value" value="${escapeHtml(s.value)}" /></div>
        <div class="form-group"><label>ტექსტი</label><input type="text" id="st-label" value="${escapeHtml(s.label)}" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="st-save">შენახვა</button>
      </div>
    `);
    $('#st-save').addEventListener('click', () => {
      const u = { value: $('#st-value').value, label: $('#st-label').value };
      if (isEdit) state.content.stats[index] = u; else state.content.stats.push(u);
      markDirty(); closeModal(); renderSection('stats');
      toast('შენახულია', 'success');
    });
  }

  // --- CONTACT PAGE ---
  // --- ABOUT PAGE EDITOR (Mission, History timeline, Values) ---
  function renderAboutPage() {
    if (!state.content.aboutPage) state.content.aboutPage = {};
    const a = state.content.aboutPage;
    // Defaults
    a.hero = a.hero || { eyebrow: 'ჩვენ შესახებ · 01', titlePre: '15 წელი', titleHighlight: 'საქართველოს ბიზნესთან ერთად.', subtitle: '15+ წლის გამოცდილების გუნდი, რომელიც საქართველოს ბიზნესს ეხმარება ფინანსური ზრდის გზაზე.' };
    a.mission = a.mission || {
      eyebrow: 'ჩვენი მისია · 02',
      titlePre: 'ბუღალტერია არ უნდა იყოს',
      titleHighlight: 'ტვირთი.',
      text: 'ვაქციოთ ბუღალტერია და გადასახადები უხილავად ყოველდღიური ბიზნესისთვის. გამჭვირვალე პროცესით, პროფესიონალური გუნდით და თანამედროვე ტექნოლოგიებით ვეხმარებით მეწარმეებს ფოკუსირდნენ მთავარზე — ბიზნესის ზრდაზე.',
      ctaText: 'დაიწყე კონსულტაცია',
      ctaHref: 'contact.html',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=85',
      items: [
        { title: 'გამჭვირვალე ფასი', text: 'ფარული ხარჯების გარეშე.' },
        { title: 'პერსონალური ბუღალტერი', text: 'თქვენი კომპანიისთვის გამოყოფილი ექსპერტი.' },
        { title: 'ციფრული პლატფორმა', text: 'ყველა დოკუმენტი ერთ სივრცეში.' }
      ]
    };
    a.history = a.history || {
      eyebrow: 'ჩვენი ისტორია · 03',
      titlePre: '15 წელი',
      titleHighlight: 'წარმატების',
      image: 'https://images.unsplash.com/photo-1664575602554-2087b04935a5?auto=format&fit=crop&w=900&q=85',
      timeline: [
        { year: "'10", title: 'დაარსება', text: 'პირველი კლიენტი — 3 პარტნიორი.' },
        { year: "'15", title: '50+ კლიენტი', text: 'აუდიტის სერვისის დანერგვა.' },
        { year: "'19", title: '200+ კლიენტი', text: 'ონლაინ პლატფორმის გაშვება.' },
        { year: "'23", title: '400+ კლიენტი', text: 'გუნდი გაიზარდა 15 სპეციალისტამდე.' },
        { year: "'26", title: '500+ კლიენტი', text: 'ახალი ოფისი თბილისის ცენტრში.' }
      ]
    };
    a.values = a.values || {
      eyebrow: 'ჩვენი ღირებულებები · 04',
      titlePre: 'პრინციპები, რომლითაც',
      titleHighlight: 'ვცხოვრობთ.',
      items: [
        { num: 'VALUE 01', title: 'სანდოობა', text: 'ყოველდღე ვიმსახურებთ თქვენს ნდობას — მონაცემების უსაფრთხოება და სიზუსტე პრიორიტეტია.' },
        { num: 'VALUE 02', title: 'სისწრაფე', text: 'მოთხოვნის პასუხი 4 საათში, დეკლარაციები ვადამდე — კლიენტს არასდროს უწევს ლოდინი.' },
        { num: 'VALUE 03', title: 'ექსპერტიზა', text: 'სერტიფიცირებული ბუღალტრები, აუდიტორები და იურისტები — ცვლილებები ვიცით პირველებმა.' }
      ]
    };

    const imagePicker = (fieldPath, currentUrl) => `
      <div class="form-group">
        <label>სურათის URL</label>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="url" data-field="${fieldPath}" value="${escapeHtml(currentUrl || '')}" placeholder="https://..." style="flex: 1;" />
          <button class="btn btn-outline btn-sm" type="button" data-pick-media="${fieldPath}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            Library
          </button>
        </div>
        ${currentUrl ? `<div style="margin-top: 8px;"><img src="${escapeHtml(currentUrl)}" alt="" style="max-width: 160px; height: auto; border: 1px solid var(--gray-200);"></div>` : ''}
        <small class="hint">აატვირთე ახალი სურათი → <a href="#media" style="color: var(--ink); font-weight: 700;" onclick="location.hash='#media'">Media Library</a>, შემდეგ URL დააკოპირე აქ</small>
      </div>
    `;

    return `
      <div class="page-header">
        <div><h1>About Page</h1><p>მართე /about გვერდის სექციები: მისია, ისტორიის ქრონიკა, ღირებულებები</p></div>
      </div>

      <div class="info-banner" style="background: #f0fdf4; border-left-color: #10B981;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <div><strong>ცოცხალი:</strong> ყველა ცვლილება Publish-ის შემდეგ ავტომატურად ჩანს /about გვერდზე. გუნდის წევრების სია <a href="#team" onclick="location.hash='#team'" style="color: var(--ink); font-weight: 700;">Team</a> სექციაში იცვლება.</div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">🎯 ჰერო ბლოკი (გვერდის თავი)</h3></div>
        <div class="form-grid">
          <div class="form-group"><label>Eyebrow</label><input type="text" data-field="aboutPage.hero.eyebrow" value="${escapeHtml(a.hero.eyebrow || '')}" /></div>
          <div class="form-grid cols-2">
            <div class="form-group"><label>სათაური (პირველი ნაწილი)</label><input type="text" data-field="aboutPage.hero.titlePre" value="${escapeHtml(a.hero.titlePre || '')}" /></div>
            <div class="form-group"><label>Highlight (ყვითლად)</label><input type="text" data-field="aboutPage.hero.titleHighlight" value="${escapeHtml(a.hero.titleHighlight || '')}" /></div>
          </div>
          <div class="form-group"><label>ქვესათაური</label><textarea data-field="aboutPage.hero.subtitle" rows="2">${escapeHtml(a.hero.subtitle || '')}</textarea></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">💡 მისიის ბლოკი</h3></div>
        <div class="form-grid">
          <div class="form-group"><label>Eyebrow</label><input type="text" data-field="aboutPage.mission.eyebrow" value="${escapeHtml(a.mission.eyebrow || '')}" /></div>
          <div class="form-grid cols-2">
            <div class="form-group"><label>სათაური (პირველი ნაწილი)</label><input type="text" data-field="aboutPage.mission.titlePre" value="${escapeHtml(a.mission.titlePre || '')}" /></div>
            <div class="form-group"><label>Highlight (ყვითლად)</label><input type="text" data-field="aboutPage.mission.titleHighlight" value="${escapeHtml(a.mission.titleHighlight || '')}" /></div>
          </div>
          <div class="form-group"><label>ტექსტი (აბზაცი)</label><textarea data-field="aboutPage.mission.text" rows="4">${escapeHtml(a.mission.text || '')}</textarea></div>
          ${imagePicker('aboutPage.mission.image', a.mission.image)}
          <div class="form-group"><label>ნუმერაციის ჩამონათვალი (3 ელემენტი)</label>
            <div id="mission-items" style="display: flex; flex-direction: column; gap: 8px;">
              ${(a.mission.items || []).map((it, i) => `
                <div style="display: grid; grid-template-columns: 1fr 2fr auto; gap: 8px; align-items: center;">
                  <input type="text" data-mission-item="${i}" data-key="title" value="${escapeHtml(it.title || '')}" placeholder="სათაური" />
                  <input type="text" data-mission-item="${i}" data-key="text" value="${escapeHtml(it.text || '')}" placeholder="მოკლე აღწერა" />
                  <button class="icon-btn danger" type="button" data-remove-mission-item="${i}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                </div>
              `).join('')}
            </div>
            <button class="btn btn-outline btn-xs" type="button" id="add-mission-item" style="margin-top: 8px;">+ დაამატე პუნქტი</button>
          </div>
          <div class="form-grid cols-2">
            <div class="form-group"><label>ღილაკის ტექსტი</label><input type="text" data-field="aboutPage.mission.ctaText" value="${escapeHtml(a.mission.ctaText || '')}" /></div>
            <div class="form-group"><label>ღილაკის URL</label><input type="text" data-field="aboutPage.mission.ctaHref" value="${escapeHtml(a.mission.ctaHref || '')}" /></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">📅 ისტორიის ქრონიკა (Timeline)</h3></div>
        <div class="form-grid">
          <div class="form-group"><label>Eyebrow</label><input type="text" data-field="aboutPage.history.eyebrow" value="${escapeHtml(a.history.eyebrow || '')}" /></div>
          <div class="form-grid cols-2">
            <div class="form-group"><label>სათაური (პირველი ნაწილი)</label><input type="text" data-field="aboutPage.history.titlePre" value="${escapeHtml(a.history.titlePre || '')}" /></div>
            <div class="form-group"><label>Highlight (ყვითლად)</label><input type="text" data-field="aboutPage.history.titleHighlight" value="${escapeHtml(a.history.titleHighlight || '')}" /></div>
          </div>
          ${imagePicker('aboutPage.history.image', a.history.image)}
          <div class="form-group"><label>Timeline ელემენტები</label>
            <div id="history-timeline" style="display: flex; flex-direction: column; gap: 8px;">
              ${(a.history.timeline || []).map((it, i) => `
                <div style="display: grid; grid-template-columns: 80px 1fr 2fr auto; gap: 8px; align-items: center;">
                  <input type="text" data-timeline-item="${i}" data-key="year" value="${escapeHtml(it.year || '')}" placeholder="'10" />
                  <input type="text" data-timeline-item="${i}" data-key="title" value="${escapeHtml(it.title || '')}" placeholder="სათაური" />
                  <input type="text" data-timeline-item="${i}" data-key="text" value="${escapeHtml(it.text || '')}" placeholder="აღწერა" />
                  <button class="icon-btn danger" type="button" data-remove-timeline-item="${i}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                </div>
              `).join('')}
            </div>
            <button class="btn btn-outline btn-xs" type="button" id="add-timeline-item" style="margin-top: 8px;">+ დაამატე ეპოქა</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">⭐ ღირებულებები</h3></div>
        <div class="form-grid">
          <div class="form-group"><label>Eyebrow</label><input type="text" data-field="aboutPage.values.eyebrow" value="${escapeHtml(a.values.eyebrow || '')}" /></div>
          <div class="form-grid cols-2">
            <div class="form-group"><label>სათაური (პირველი ნაწილი)</label><input type="text" data-field="aboutPage.values.titlePre" value="${escapeHtml(a.values.titlePre || '')}" /></div>
            <div class="form-group"><label>Highlight (ყვითლად)</label><input type="text" data-field="aboutPage.values.titleHighlight" value="${escapeHtml(a.values.titleHighlight || '')}" /></div>
          </div>
          <div class="form-group"><label>ღირებულებების ბარათები</label>
            <div id="values-items" style="display: flex; flex-direction: column; gap: 12px;">
              ${(a.values.items || []).map((it, i) => `
                <div style="border: 1px solid var(--gray-200); padding: 12px; background: var(--gray-50); display: grid; grid-template-columns: 100px 1fr auto; gap: 8px; align-items: start;">
                  <input type="text" data-value-item="${i}" data-key="num" value="${escapeHtml(it.num || '')}" placeholder="VALUE 01" />
                  <div style="display: flex; flex-direction: column; gap: 6px;">
                    <input type="text" data-value-item="${i}" data-key="title" value="${escapeHtml(it.title || '')}" placeholder="სათაური" />
                    <textarea data-value-item="${i}" data-key="text" rows="2" placeholder="აღწერა">${escapeHtml(it.text || '')}</textarea>
                  </div>
                  <button class="icon-btn danger" type="button" data-remove-value-item="${i}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                </div>
              `).join('')}
            </div>
            <button class="btn btn-outline btn-xs" type="button" id="add-value-item" style="margin-top: 8px;">+ დაამატე ღირებულება</button>
          </div>
        </div>
      </div>
    `;
  }

  function attachAboutPage() {
    attachFieldListeners();
    const a = state.content.aboutPage;
    const rerender = () => renderSection('aboutPage');

    // Pick from library buttons
    $$('[data-pick-media]').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.pickMedia;
        const library = Array.isArray(state.content.media) ? state.content.media : [];
        if (!library.length) { toast('Media library ცარიელია. ჯერ ატვირთე Media Library-ში.', 'info', 4000); return; }
        const url = prompt('აირჩიე URL:\n\n' + library.map((m,i) => (i+1)+'. '+m.name+'\n   '+m.url).join('\n\n') + '\n\nჩაწერე URL ან რიცხვი (1-'+library.length+'):');
        if (!url) return;
        const picked = /^\d+$/.test(url.trim()) ? library[parseInt(url.trim())-1]?.url : url.trim();
        if (picked) {
          const path = field.split('.');
          let obj = state.content;
          for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]] || (obj[path[i]] = {});
          obj[path[path.length-1]] = picked;
          markDirty(); rerender();
        }
      });
    });

    // Mission items (title + text rows)
    const syncMissionItems = () => {
      a.mission.items = $$('[data-mission-item]').reduce((acc, el) => {
        const i = parseInt(el.dataset.missionItem);
        acc[i] = acc[i] || {};
        acc[i][el.dataset.key] = el.value;
        return acc;
      }, []).filter(Boolean);
      markDirty();
    };
    $$('[data-mission-item]').forEach(el => el.addEventListener('input', syncMissionItems));
    $$('[data-remove-mission-item]').forEach(btn => btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.removeMissionItem);
      a.mission.items.splice(i, 1); markDirty(); rerender();
    }));
    $('#add-mission-item')?.addEventListener('click', () => {
      a.mission.items = a.mission.items || [];
      a.mission.items.push({ title: '', text: '' });
      markDirty(); rerender();
    });

    // Timeline items (year + title + text rows)
    const syncTimeline = () => {
      a.history.timeline = $$('[data-timeline-item]').reduce((acc, el) => {
        const i = parseInt(el.dataset.timelineItem);
        acc[i] = acc[i] || {};
        acc[i][el.dataset.key] = el.value;
        return acc;
      }, []).filter(Boolean);
      markDirty();
    };
    $$('[data-timeline-item]').forEach(el => el.addEventListener('input', syncTimeline));
    $$('[data-remove-timeline-item]').forEach(btn => btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.removeTimelineItem);
      a.history.timeline.splice(i, 1); markDirty(); rerender();
    }));
    $('#add-timeline-item')?.addEventListener('click', () => {
      a.history.timeline = a.history.timeline || [];
      a.history.timeline.push({ year: '', title: '', text: '' });
      markDirty(); rerender();
    });

    // Values items
    const syncValues = () => {
      a.values.items = $$('[data-value-item]').reduce((acc, el) => {
        const i = parseInt(el.dataset.valueItem);
        acc[i] = acc[i] || {};
        acc[i][el.dataset.key] = el.value;
        return acc;
      }, []).filter(Boolean);
      markDirty();
    };
    $$('[data-value-item]').forEach(el => el.addEventListener('input', syncValues));
    $$('[data-remove-value-item]').forEach(btn => btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.removeValueItem);
      a.values.items.splice(i, 1); markDirty(); rerender();
    }));
    $('#add-value-item')?.addEventListener('click', () => {
      a.values.items = a.values.items || [];
      a.values.items.push({ num: 'VALUE ' + String((a.values.items.length + 1)).padStart(2, '0'), title: '', text: '' });
      markDirty(); rerender();
    });
  }

  function renderContactPage() {
    if (!state.content.contactPage) state.content.contactPage = {
      eyebrow: 'კონტაქტი · 01',
      title: 'დავიწყოთ <mark>საუბარი</mark>.',
      subtitle: 'გვიპასუხეთ კითხვაზე 24 საათში — რომელი კომუნიკაციის ფორმატი უფრო კომფორტულია?',
      leftEyebrow: 'კომუნიკაციის არხები · 02',
      leftTitle: 'ყველაზე მოსახერხებელი <mark>შეარჩიე</mark>.',
      leftIntro: 'ჩვენი გუნდი გიპასუხებთ 24 საათში სამუშაო დღეებში.',
      formEyebrow: 'გაგვიგზავნე შეტყობინება · 03',
      formTitle: 'გვიამბე თქვენი <mark>ამოცანის</mark> შესახებ.',
      submitBtnText: 'გაგზავნა',
      successMessage: 'მადლობა! დაგიკავშირდებით 24 საათში.'
    };
    const c = state.content.contactPage;
    return `
      <div class="page-header">
        <div>
          <h1>კონტაქტი გვერდი</h1>
          <p>მართე /contact გვერდის ტექსტები და ფორმის შეტყობინებები</p>
        </div>
      </div>

      <div class="info-banner" style="background: #f0fdf4; border-left-color: #10B981;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <div><strong>ცოცხალი:</strong> კონტაქტის ფორმის მიღებული შეტყობინებები ინახება Site Info → ელ.ფოსტაზე. ფორმის ქცევა და SMTP გაგზავნა მუშაობს Zoho-ს საშუალებით.</div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">📍 გვერდის ჰერო</h3></div>
        <div class="form-grid">
          <div class="form-group"><label>Eyebrow (პატარა ტექსტი ზევით)</label>
            <input type="text" data-field="contactPage.eyebrow" value="${escapeHtml(c.eyebrow || '')}" />
          </div>
          <div class="form-group"><label>მთავარი სათაური (შეგიძლია გამოიყენო &lt;mark&gt;...&lt;/mark&gt; ყვითელი highlight-ისთვის)</label>
            <input type="text" data-field="contactPage.title" value="${escapeHtml(c.title || '')}" />
          </div>
          <div class="form-group"><label>სათაურის ქვეშ ტექსტი</label>
            <textarea data-field="contactPage.subtitle" rows="2">${escapeHtml(c.subtitle || '')}</textarea>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">📞 მარცხენა ბლოკი — კომუნიკაცია</h3></div>
        <div class="form-grid">
          <div class="form-group"><label>Eyebrow</label>
            <input type="text" data-field="contactPage.leftEyebrow" value="${escapeHtml(c.leftEyebrow || '')}" />
          </div>
          <div class="form-group"><label>სათაური</label>
            <input type="text" data-field="contactPage.leftTitle" value="${escapeHtml(c.leftTitle || '')}" />
          </div>
          <div class="form-group"><label>შესავალი ტექსტი</label>
            <textarea data-field="contactPage.leftIntro" rows="2">${escapeHtml(c.leftIntro || '')}</textarea>
          </div>
        </div>
        <div style="padding: 12px 14px; background: var(--gray-50); font-size: 13px; color: var(--gray-700);">
          💡 ტელეფონი, ელ.ფოსტა, მისამართი, სამუშაო საათები იცვლება <a href="#site" onclick="location.hash='#site'" style="color: var(--ink); font-weight: 700;">Site Info</a> სექციაში.
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">📝 მარჯვენა ბლოკი — ფორმა</h3></div>
        <div class="form-grid">
          <div class="form-group"><label>Eyebrow</label>
            <input type="text" data-field="contactPage.formEyebrow" value="${escapeHtml(c.formEyebrow || '')}" />
          </div>
          <div class="form-group"><label>ფორმის სათაური</label>
            <input type="text" data-field="contactPage.formTitle" value="${escapeHtml(c.formTitle || '')}" />
          </div>
          <div class="form-grid cols-2">
            <div class="form-group"><label>Submit ღილაკის ტექსტი</label>
              <input type="text" data-field="contactPage.submitBtnText" value="${escapeHtml(c.submitBtnText || 'გაგზავნა')}" />
            </div>
            <div class="form-group"><label>წარმატების შეტყობინება</label>
              <input type="text" data-field="contactPage.successMessage" value="${escapeHtml(c.successMessage || '')}" />
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- SEARCH SETTINGS ---
  function renderSearchSection() {
    if (!state.content.search) state.content.search = {
      enabled: false,
      placeholder: 'მოძებნე სერვისი ან ინფორმაცია...',
      noResultsText: 'შედეგი ვერ მოიძებნა'
    };
    const s = state.content.search;
    return `
      <div class="page-header">
        <div>
          <h1>Search</h1>
          <p>ჰედერში არსებული 🔍 ძიების ღილაკის კონფიგურაცია</p>
        </div>
      </div>

      <div class="info-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/></svg>
        <div>
          <strong>ძიება რას ნიშნავს:</strong> ჰედერის "Search" ღილაკი გახსნის პოპაპს, სადაც მომხმარებელს შეუძლია საიტის კონტენტის მოძებნა (სერვისები, ბლოგი, FAQ). ძიება არის <strong>client-side</strong> (JavaScript-ით, ბრაუზერში), არ ჭირდება სერვერი.
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">⚙ ძიების ფუნქცია</h3></div>
        <div class="form-grid">
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" data-field="search.enabled" ${s.enabled ? 'checked' : ''} />
              <span class="switch-slider"></span>
              <span class="switch-label">ძიება ჩართულია საიტზე</span>
            </label>
            <small class="hint">გათიშვისას, ჰედერის 🔍 ღილაკი იმალება</small>
          </div>
          <div class="form-group">
            <label>საძიებო velvet-ის placeholder</label>
            <input type="text" data-field="search.placeholder" value="${escapeHtml(s.placeholder || '')}" />
          </div>
          <div class="form-group">
            <label>შედეგების გარეშე შეტყობინება</label>
            <input type="text" data-field="search.noResultsText" value="${escapeHtml(s.noResultsText || '')}" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">📋 რასაც იძიებს</h3></div>
        <div style="padding: 12px 14px; background: var(--gray-50); font-size: 14px; line-height: 1.6;">
          ავტომატურად გაიდაჭდება ძიების ინდექსი შემდეგი წყაროებიდან:
          <ul style="margin: 8px 0 0; padding-left: 20px;">
            <li><strong>სერვისები</strong> — ${state.content.services?.length || 0} ცალი (title + description)</li>
            <li><strong>FAQ</strong> — ${state.content.faq?.length || 0} ცალი (question + answer)</li>
            <li><strong>ბლოგი</strong> — ${state.content.blog?.length || 0} ცალი (title + excerpt)</li>
            <li><strong>ინდუსტრიები</strong> — ${state.content.industries?.length || 0} ცალი (title + description)</li>
          </ul>
        </div>
      </div>
    `;
  }

  // --- MEGA MENU (full CRUD — labels, links, spotlight) ---
  function renderMegaMenu() {
    if (!state.content.megaMenus) state.content.megaMenus = {};
    const menus = state.content.megaMenus;
    const entries = Object.entries(menus);

    return `
      <div class="page-header">
        <div>
          <h1>Mega Menu</h1>
          <p>ზედა ნავიგაციის ტაბები, ჩამოსაშლელი მენიუები, ბმულები</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-yellow" id="add-mega-tab">+ ახალი ტაბი</button>
        </div>
      </div>

      <div class="info-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/></svg>
        <div><strong>სტრუქტურა:</strong> ყველა ტაბს აქვს 3 ნაწილი — <strong>Intro</strong> (მარცხნივ), <strong>Links</strong> (შუაში), <strong>Spotlight</strong> (მარჯვნივ). შეცვალე label — გამოჩნდება ზედა ნავიგაციაში.</div>
      </div>

      ${entries.length === 0 ? `
        <div class="empty-state">
          <h3>Mega Menu არ არის</h3>
          <p>დაამატე პირველი ტაბი</p>
        </div>
      ` : entries.map(([key, m]) => `
        <div class="card" data-menu-key="${key}">
          <div class="card-header" style="flex-direction: column; align-items: stretch; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
              <div style="flex: 1;">
                <div style="font-size: 11px; color: var(--gray-500); font-family: 'JetBrains Mono', monospace; margin-bottom: 6px;">TAB #${escapeHtml(key)}</div>
                <input type="text" data-field="megaMenus.${key}.label" value="${escapeHtml(m.label || '')}"
                       placeholder="ტაბის სახელი (მაგ. სერვისები)"
                       style="font-family: 'Archivo', sans-serif; font-size: 22px; font-weight: 700; border: 1px dashed var(--gray-300); padding: 8px 12px; background: white; width: 100%; max-width: 400px;" />
              </div>
              <button class="btn btn-outline btn-xs" data-remove-menu="${key}" style="color: var(--danger); border-color: var(--danger);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                ტაბის წაშლა
              </button>
            </div>
          </div>

          <!-- Intro -->
          <div style="margin-top: 20px;">
            <h4 style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-500); margin-bottom: 12px;">▸ Intro Block (მარცხენა მხარე)</h4>
            <div class="form-grid cols-2">
              <div class="form-group">
                <label>Intro Title</label>
                <input type="text" data-field="megaMenus.${key}.intro.title" value="${escapeHtml(m.intro?.title || '')}" />
              </div>
              <div class="form-group">
                <label>CTA ღილაკის ტექსტი</label>
                <input type="text" data-field="megaMenus.${key}.intro.ctaText" value="${escapeHtml(m.intro?.ctaText || '')}" />
              </div>
            </div>
            <div class="form-group">
              <label>აღწერა</label>
              <textarea data-field="megaMenus.${key}.intro.desc" rows="3">${escapeHtml(m.intro?.desc || '')}</textarea>
            </div>
            <div class="form-group">
              <label>CTA ღილაკის ბმული</label>
              <input type="text" data-field="megaMenus.${key}.intro.ctaHref" value="${escapeHtml(m.intro?.ctaHref || '')}" placeholder="services.html" style="font-family: 'JetBrains Mono', monospace; font-size: 13px;" />
            </div>
          </div>

          <!-- Links -->
          <div style="margin-top: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-500); margin: 0;">▸ Links (შუა სვეტი) — ${(m.links || []).length} ცალი</h4>
              <button class="btn btn-outline btn-xs" data-add-link="${key}">+ ბმული</button>
            </div>
            <div class="features-editor" id="menu-links-${key}">
              ${(m.links || []).map((link, i) => `
                <div class="feature-row" style="grid-template-columns: auto 1fr 1fr auto;">
                  <span class="feature-handle">≡</span>
                  <input type="text" placeholder="დასახელება" value="${escapeHtml(link.title || '')}"
                         data-link-menu="${key}" data-link-idx="${i}" data-link-prop="title" />
                  <input type="text" placeholder="href" value="${escapeHtml(link.href || '')}"
                         data-link-menu="${key}" data-link-idx="${i}" data-link-prop="href"
                         style="font-family: 'JetBrains Mono', monospace; font-size: 12px;" />
                  <button class="icon-btn danger" data-remove-link="${key}-${i}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Spotlight -->
          <div style="margin-top: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-500); margin: 0;">▸ Spotlight (მარჯვენა მხარე) — ${(m.spotlight?.items || []).length} ცალი</h4>
              <button class="btn btn-outline btn-xs" data-add-spot="${key}">+ Spotlight Item</button>
            </div>
            <div class="form-group" style="max-width: 320px; margin-bottom: 12px;">
              <label>Spotlight Title (სათაური)</label>
              <input type="text" data-field="megaMenus.${key}.spotlight.title" value="${escapeHtml(m.spotlight?.title || 'Spotlight')}" />
            </div>
            <div class="features-editor" id="menu-spot-${key}">
              ${(m.spotlight?.items || []).map((item, i) => `
                <div class="feature-row" style="grid-template-columns: auto 1fr 1fr auto;">
                  <span class="feature-handle">≡</span>
                  <input type="text" placeholder="დასახელება" value="${escapeHtml(item.title || '')}"
                         data-spot-menu="${key}" data-spot-idx="${i}" data-spot-prop="title" />
                  <input type="text" placeholder="href" value="${escapeHtml(item.href || '')}"
                         data-spot-menu="${key}" data-spot-idx="${i}" data-spot-prop="href"
                         style="font-family: 'JetBrains Mono', monospace; font-size: 12px;" />
                  <button class="icon-btn danger" data-remove-spot="${key}-${i}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    `;
  }

  function attachMegaMenu() {
    attachFieldListeners();

    // Add new tab
    $('#add-mega-tab')?.addEventListener('click', () => {
      const key = prompt('ტაბის ID (ინგლისურად, უნიკალური, მაგ. "products"):');
      if (!key) return;
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!cleanKey) { toast('ID უნდა იყოს ლათინური ასოები/ციფრები', 'error'); return; }
      if (state.content.megaMenus[cleanKey]) { toast('ეს ID უკვე არსებობს', 'error'); return; }
      state.content.megaMenus[cleanKey] = {
        label: 'ახალი ტაბი',
        intro: { title: 'სათაური', desc: 'აღწერა', ctaText: 'გაეცანი', ctaHref: '#' },
        links: [],
        spotlight: { title: 'Spotlight', items: [] }
      };
      markDirty();
      renderSection('megamenu');
      logActivity('create', `Mega menu tab: ${cleanKey}`, 'megamenu');
      toast('ტაბი დაემატა', 'success');
    });

    // Remove tab
    $$('[data-remove-menu]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.removeMenu;
        if (!confirm(`წაიშალოს "${state.content.megaMenus[key]?.label || key}" ტაბი?`)) return;
        delete state.content.megaMenus[key];
        markDirty();
        renderSection('megamenu');
        logActivity('delete', `Mega menu: ${key}`, 'megamenu');
        toast('ტაბი წაიშალა', 'warning');
      });
    });

    // Link inputs — update state on change
    $$('[data-link-menu]').forEach(input => {
      input.addEventListener('input', () => {
        const key = input.dataset.linkMenu;
        const idx = parseInt(input.dataset.linkIdx);
        const prop = input.dataset.linkProp;
        if (!state.content.megaMenus[key].links) state.content.megaMenus[key].links = [];
        if (!state.content.megaMenus[key].links[idx]) state.content.megaMenus[key].links[idx] = {};
        state.content.megaMenus[key].links[idx][prop] = input.value;
        markDirty();
      });
    });

    // Add link
    $$('[data-add-link]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.addLink;
        if (!state.content.megaMenus[key].links) state.content.megaMenus[key].links = [];
        state.content.megaMenus[key].links.push({ title: '', href: '' });
        markDirty();
        renderSection('megamenu');
      });
    });

    // Remove link
    $$('[data-remove-link]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [key, idx] = btn.dataset.removeLink.split('-');
        state.content.megaMenus[key].links.splice(parseInt(idx), 1);
        markDirty();
        renderSection('megamenu');
      });
    });

    // Spotlight inputs
    $$('[data-spot-menu]').forEach(input => {
      input.addEventListener('input', () => {
        const key = input.dataset.spotMenu;
        const idx = parseInt(input.dataset.spotIdx);
        const prop = input.dataset.spotProp;
        if (!state.content.megaMenus[key].spotlight) state.content.megaMenus[key].spotlight = { items: [] };
        if (!state.content.megaMenus[key].spotlight.items) state.content.megaMenus[key].spotlight.items = [];
        if (!state.content.megaMenus[key].spotlight.items[idx]) state.content.megaMenus[key].spotlight.items[idx] = {};
        state.content.megaMenus[key].spotlight.items[idx][prop] = input.value;
        markDirty();
      });
    });

    // Add spotlight
    $$('[data-add-spot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.addSpot;
        if (!state.content.megaMenus[key].spotlight) state.content.megaMenus[key].spotlight = { title: 'Spotlight', items: [] };
        if (!state.content.megaMenus[key].spotlight.items) state.content.megaMenus[key].spotlight.items = [];
        state.content.megaMenus[key].spotlight.items.push({ title: '', href: '' });
        markDirty();
        renderSection('megamenu');
      });
    });

    // Remove spotlight
    $$('[data-remove-spot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [key, idx] = btn.dataset.removeSpot.split('-');
        state.content.megaMenus[key].spotlight.items.splice(parseInt(idx), 1);
        markDirty();
        renderSection('megamenu');
      });
    });
  }

  // --- FOOTER ---
  function renderFooter() {
    const f = state.content.footer;
    return `
      <div class="page-header">
        <div><h1>Footer</h1><p>ფუტერის ტექსტი და ბმულები</p></div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">About ტექსტი</h3></div>
        <div class="form-group"><label>აღწერა</label><textarea data-field="footer.about" rows="4">${escapeHtml(f.about || '')}</textarea></div>
      </div>
    `;
  }

  function attachFooter() {
    attachFieldListeners();
    const f = document.querySelector('[data-field="footer.about"]');
    if (f && f.tagName === 'TEXTAREA') makeRichEditor(f);
  }

  // --- TRANSLATIONS ---
  function renderTranslations() {
    return `
      <div class="page-header">
        <div><h1>თარგმანები (i18n)</h1><p>ქართული / ინგლისური ტექსტები</p></div>
      </div>
      <div class="info-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        <div>
          <strong>შენიშვნა:</strong> ეს სექცია მხოლოდ ხაზგასმისთვისაა — ენის გადართვა საიტზე ხდება KA/EN ღილაკით Header-ში. თარგმანები ავტომატურად იტვირთება i18n.js-დან.
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">ენის გადართვის პანელი</h3></div>
        <p>საიტზე ყველა ტექსტი არის ქართულად. ინგლისურ ვერსიას ავტომატურად დააჯენს <code>i18n.js</code> ფაილი.</p>
      </div>
    `;
  }

  function attachTranslations() {}

  // --- IMPORT ---
  function renderImport() {
    return `
      <div class="page-header">
        <div><h1>Import / Restore</h1><p>JSON ფაილის ატვირთვა ან ნაგულისხმევი კონტენტის აღდგენა</p></div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">📂 JSON იმპორტი</h3></div>
        <p>ატვირთე ადრე Export-ით გადმოწერილი <code>.json</code> ფაილი — ყველა კონტენტი განახლდება.</p>
        <div style="margin-top: 16px; display: flex; gap: 10px;">
          <button class="btn btn-dark" id="import-trigger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            აირჩიე JSON ფაილი
          </button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">🔄 ნაგულისხმევზე დაბრუნება</h3></div>
        <p>ყველა ცვლილება წაიშლება და დაბრუნდება ნაგულისხმევი (factory) კონტენტი.</p>
        <div style="margin-top: 16px;">
          <button class="btn btn-danger" id="reset-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            ყველაფრის წაშლა და აღდგენა
          </button>
        </div>
      </div>
    `;
  }

  function attachImport() {
    $('#import-trigger')?.addEventListener('click', () => $('#import-file').click());
    $('#reset-btn')?.addEventListener('click', resetContent);
  }

  // --- SETTINGS ---
  function renderSettings() {
    const hasToken = !!getGithubToken();
    const maskedToken = hasToken ? '••••••••••••••••••••' + getGithubToken().slice(-4) : '';

    return `
      <div class="page-header">
        <div><h1>პარამეტრები</h1><p>ადმინი პანელის და GitHub-ის კონფიგურაცია</p></div>
      </div>

      <!-- Shared Publish (Multi-user) -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">👥 Shared Publish (Multi-user) ${getSharedSecret() ? '<span style="display: inline-block; margin-left: 8px; padding: 3px 10px; background: #10B981; color: white; font-size: 11px; border-radius: 4px; font-weight: 700;">ACTIVE</span>' : '<span style="display: inline-block; margin-left: 8px; padding: 3px 10px; background: #6B7688; color: white; font-size: 11px; border-radius: 4px; font-weight: 700;">OFF</span>'}</h3>
            <p class="card-subtitle">მეგობრების დასამატებლად — მათ არ სჭირდებათ საკუთარი GitHub token</p>
          </div>
        </div>

        <div class="info-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/></svg>
          <div>
            <strong>სეტაპი (ერთხელ):</strong><br>
            1. <a href="https://vercel.com/chabas-projects-c40e9f58/audit-company/settings/environment-variables" target="_blank" style="color: var(--ink); font-weight: 700;">Vercel → Environment Variables</a><br>
            2. დაამატე <code>GITHUB_TOKEN</code> = შენი personal access token<br>
            3. დაამატე <code>ADMIN_SECRET</code> = გამოიგონე პაროლი (მაგ. "auditsecret2026")<br>
            4. <strong>Redeploy</strong> (Deployments → ... → Redeploy)<br>
            5. გაუზიარე მეგობარს: პორტალის URL + Basic Auth პაროლი + ADMIN_SECRET
          </div>
        </div>

        <div class="form-grid" style="max-width: 640px;">
          <div class="form-group">
            <label>Shared Admin Secret</label>
            <input type="password" id="shared-secret" value="${getSharedSecret() ? '••••••••••••••••' : ''}" placeholder="ADMIN_SECRET რაც Vercel-ში დააყენე" />
            <small class="hint">ეს არის საერთო პაროლი რომელსაც შენ და მეგობარი ხმარობთ Publish-ისთვის. შეგიძლია ნებისმიერი სიტყვა იყოს.</small>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-dark" id="save-secret">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              შენახვა
            </button>
            ${getSharedSecret() ? `
              <button class="btn btn-outline" id="test-secret">ტესტი</button>
              <button class="btn btn-outline" id="remove-secret" style="color: var(--danger); border-color: var(--danger);">წაშლა</button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- GitHub Token (personal, fallback) -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">🔑 Personal GitHub Token ${hasToken ? '<span style="display: inline-block; margin-left: 8px; padding: 3px 10px; background: #10B981; color: white; font-size: 11px; border-radius: 4px; font-weight: 700;">ACTIVE</span>' : '<span style="display: inline-block; margin-left: 8px; padding: 3px 10px; background: #6B7688; color: white; font-size: 11px; border-radius: 4px; font-weight: 700;">OFF</span>'}</h3>
            <p class="card-subtitle">Fallback — თუ Shared Secret არ გაქვს დაყენებული</p>
          </div>
        </div>

        <div class="info-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          <div>
            <strong>როგორ მივიღო Token:</strong><br>
            1. გადადი <a href="https://github.com/settings/tokens/new?description=Audit%20Admin&scopes=repo" target="_blank" style="color: var(--ink); font-weight: 700; text-decoration: underline;">GitHub → New Token</a><br>
            2. მონიშნე <code>repo</code> scope<br>
            3. დააჭირე "Generate token"<br>
            4. დააკოპირე ტოკენი (ერთჯერად ჩანს!) და ჩასვი ქვემოთ
          </div>
        </div>

        <div class="form-grid" style="max-width: 640px;">
          <div class="form-group">
            <label>GitHub Personal Access Token</label>
            <input type="password" id="gh-token" value="${escapeHtml(hasToken ? maskedToken : '')}" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" />
            <small class="hint">შენახული მხოლოდ შენი ბრაუზერის localStorage-ში. Repository: <code>${GITHUB_OWNER}/${GITHUB_REPO}</code></small>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-dark" id="save-token">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              შენახვა
            </button>
            ${hasToken ? `
              <button class="btn btn-outline" id="test-token">Test კავშირი</button>
              <button class="btn btn-outline" id="remove-token" style="color: var(--danger); border-color: var(--danger);">წაშლა</button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Password -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">🔒 Admin პაროლი</h3></div>
        <div class="form-grid cols-2" style="max-width: 640px;">
          <div class="form-group">
            <label>ახალი პაროლი</label>
            <input type="password" id="new-password" />
          </div>
          <div class="form-group">
            <label>გაიმეორე</label>
            <input type="password" id="confirm-password" />
          </div>
        </div>
        <button class="btn btn-dark" id="change-pw">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          შეცვლა
        </button>
      </div>

      <!-- System Info -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">ℹ️ სისტემური ინფო</h3></div>
        <div class="form-grid cols-2">
          <div class="form-group"><label>ვერსია</label><input type="text" readonly value="${state.content._version || '1.0.0'}" /></div>
          <div class="form-group"><label>ბოლო განახლება</label><input type="text" readonly value="${state.content._updated ? new Date(state.content._updated).toLocaleString('ka-GE') : 'N/A'}" /></div>
        </div>
      </div>

      <!-- How it works -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">📖 როგორ მუშაობს</h3></div>
        <div style="font-size: 14px; line-height: 1.7; color: var(--gray-700);">
          <p><strong>🔵 Save Local</strong> — ცვლილებები შენახულია მხოლოდ შენს ბრაუზერში (localStorage). მხოლოდ შენ ხედავ.</p>
          <p><strong>🟡 Publish Live</strong> — ცვლილებები იგზავნება GitHub-ზე, Vercel ავტომატურად ანახლებს საიტს. ყველას გამოუჩნდება 30-60 წამში.</p>
          <p><strong>⚙️ Export JSON</strong> — ჩამოწერა backup-ისთვის (ფაილის სახით).</p>
          <p style="margin-top: 12px; padding: 12px; background: var(--gray-100); border-left: 3px solid var(--yellow);"><strong>💡 რჩევა:</strong> Token-ი დააყენე ერთხელ → შემდეგ "Publish Live" ღილაკი იმუშავებს ყოველთვის.</p>
        </div>
      </div>
    `;
  }

  function attachSettings() {
    $('#change-pw')?.addEventListener('click', async () => {
      const n = $('#new-password').value;
      const c = $('#confirm-password').value;
      if (!n || n.length < 3) { toast('მინიმუმ 3 სიმბოლო', 'error'); return; }
      if (n !== c) { toast('პაროლები არ ემთხვევა', 'error'); return; }
      await changePassword(n);
      $('#new-password').value = '';
      $('#confirm-password').value = '';
      toast('პაროლი შეიცვალა', 'success');
    });

    // GitHub token
    $('#save-token')?.addEventListener('click', () => {
      const val = $('#gh-token').value.trim();
      if (!val || val.startsWith('••••')) { toast('ჩასვი სწორი ტოკენი', 'error'); return; }
      if (!val.startsWith('ghp_') && !val.startsWith('github_pat_')) {
        if (!confirm('Token არ იწყება ghp_ ან github_pat_. გააგრძელო?')) return;
      }
      setGithubToken(val);
      toast('Token შენახულია', 'success');
      renderSection('settings');
    });

    $('#test-token')?.addEventListener('click', async () => {
      const btn = $('#test-token');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg> ტესტი...';

      try {
        const data = await githubAPI('');
        toast(`✅ კავშირი OK — ${data.full_name} (${data.private ? 'private' : 'public'})`, 'success', 5000);
      } catch (e) {
        const msg = e.message;
        if (msg.startsWith('NETWORK:')) {
          toast('❌ ქსელის პრობლემა. შეამოწმე: 1) ინტერნეტი 2) AdBlocker/VPN 3) Brave Shield — გამორთე', 'error', 8000);
          console.error('Network error — try disabling AdBlocker or browser extensions that block api.github.com');
        } else if (msg.startsWith('UNAUTHORIZED:')) {
          toast('❌ ' + msg.replace('UNAUTHORIZED: ', ''), 'error', 5000);
        } else if (msg.startsWith('NOT_FOUND:')) {
          toast('❌ ' + msg.replace('NOT_FOUND: ', ''), 'error', 5000);
        } else if (msg.startsWith('FORBIDDEN:')) {
          toast('❌ ' + msg.replace('FORBIDDEN: ', ''), 'error', 5000);
        } else {
          toast('❌ ' + msg, 'error', 6000);
        }
        console.error('GitHub test failed:', e);
      } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    });

    $('#remove-token')?.addEventListener('click', () => {
      if (!confirm('Token-ის წაშლა? "Publish Live" აღარ იმუშავებს.')) return;
      setGithubToken('');
      toast('Token წაიშალა', 'warning');
      renderSection('settings');
    });

    // Shared Secret handlers
    $('#save-secret')?.addEventListener('click', () => {
      const val = $('#shared-secret').value.trim();
      if (!val || val.startsWith('••••')) { toast('ჩასვი Shared Secret', 'error'); return; }
      setSharedSecret(val);
      toast('Shared Secret შენახულია', 'success');
      renderSection('settings');
    });

    $('#test-secret')?.addEventListener('click', async () => {
      const btn = $('#test-secret');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg> ტესტი...';
      try {
        // Test with empty content — server should reject invalid secret but accept valid one with content
        const res = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: getSharedSecret(), content: { _test: true } })
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          toast('❌ Shared Secret არასწორია', 'error', 5000);
        } else if (res.status === 500 && data.error?.includes('not configured')) {
          toast('❌ Vercel-ზე env vars არ არის: ' + data.error, 'error', 8000);
        } else if (res.ok || res.status === 400) {
          toast('✅ კავშირი OK! Secret სწორია.', 'success');
        } else {
          toast('⚠️ ' + (data.error || `HTTP ${res.status}`), 'warning', 5000);
        }
      } catch (e) {
        toast('❌ ' + e.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    });

    $('#remove-secret')?.addEventListener('click', () => {
      if (!confirm('Shared Secret-ის წაშლა?')) return;
      setSharedSecret('');
      toast('Secret წაიშალა', 'warning');
      renderSection('settings');
    });
  }

  // ====== ACTIVITY LOG ======
  const ACTIVITY_KEY = 'audit_activity_log';
  function logActivity(action, title, section) {
    const log = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
    log.unshift({ action, title, section, time: Date.now() });
    // Keep last 100
    if (log.length > 100) log.length = 100;
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log));
  }
  function getActivityLog() { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]'); }
  function clearActivityLog() { localStorage.removeItem(ACTIVITY_KEY); }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return days + 'd';
    if (hr > 0) return hr + 'h';
    if (min > 0) return min + 'm';
    return 'ახლახან';
  }

  // ====== RICH TEXT EDITOR (Quill) ======
  const editorInstances = new Map();

  function makeRichEditor(selector, onChange) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el || typeof Quill === 'undefined') return null;
    const initialValue = el.value || el.textContent || '';
    const holder = document.createElement('div');
    holder.className = 'quill-holder';
    el.parentNode.insertBefore(holder, el);
    el.style.display = 'none';

    const quill = new Quill(holder, {
      theme: 'snow',
      placeholder: el.placeholder || 'ჩაწერე ტექსტი...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'blockquote'],
          ['clean']
        ]
      }
    });

    quill.root.innerHTML = initialValue;
    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      el.value = html === '<p><br></p>' ? '' : html;
      if (onChange) onChange(el.value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    editorInstances.set(el, quill);
    return quill;
  }

  // ====== SEO DASHBOARD ======
  function renderSEO() {
    const c = state.content;
    const checks = [];

    // Site name check
    checks.push({
      title: 'საიტის სახელი',
      desc: c.site?.name ? `დაყენებულია: ${c.site.name}` : 'სახელი დაყენებული არაა',
      status: c.site?.name ? 'success' : 'danger',
      value: c.site?.name ? '✓' : '✗'
    });

    // Phone/email
    checks.push({
      title: 'კონტაქტი',
      desc: c.site?.phone && c.site?.email ? 'ტელეფონი და ელ.ფოსტა ორივე დაყენებულია' : 'დარჩა კონტაქტი',
      status: c.site?.phone && c.site?.email ? 'success' : 'warning',
      value: (c.site?.phone ? 1 : 0) + (c.site?.email ? 1 : 0) + '/2'
    });

    // Hero title
    const heroTitleText = (c.hero?.title || '').replace(/<[^>]+>/g, '');
    checks.push({
      title: 'Hero სათაური',
      desc: heroTitleText.length === 0 ? 'სათაური ცარიელია' : heroTitleText.length < 30 ? 'სათაური მოკლეა — დაამატე კონტექსტი' : heroTitleText.length > 100 ? 'სათაური ძალიან გრძელია' : `${heroTitleText.length} სიმბოლო — იდეალურია`,
      status: heroTitleText.length >= 30 && heroTitleText.length <= 100 ? 'success' : 'warning',
      value: heroTitleText.length + 'ch'
    });

    // Hero subtitle
    const heroSub = c.hero?.subtitle || '';
    checks.push({
      title: 'Hero აღწერა',
      desc: heroSub.length === 0 ? 'აღწერა ცარიელია' : heroSub.length < 120 ? 'შეიძლება მეტი იყოს' : heroSub.length > 200 ? 'ძალიან გრძელი — 200-ის ფარგლებში შეინახე' : `${heroSub.length} სიმბოლო — იდეალურია`,
      status: heroSub.length >= 120 && heroSub.length <= 200 ? 'success' : heroSub.length > 0 ? 'warning' : 'danger',
      value: heroSub.length + 'ch'
    });

    // Services count
    const svcCount = c.services?.length || 0;
    checks.push({
      title: 'სერვისები',
      desc: svcCount < 3 ? 'მინიმუმ 3 სერვისი დაამატე' : svcCount < 6 ? 'კარგია, მაგრამ 6-9 უკეთესია' : `${svcCount} სერვისი — შესანიშნავია`,
      status: svcCount >= 6 ? 'success' : svcCount >= 3 ? 'warning' : 'danger',
      value: svcCount
    });

    // Blog count
    const blogCount = c.blog?.length || 0;
    checks.push({
      title: 'ბლოგის პოსტები',
      desc: blogCount === 0 ? 'ბლოგი ცარიელია — SEO-სთვის მინიმუმ 5 სტატია სჭირდება' : blogCount < 5 ? `${blogCount}/5 — დაამატე მეტი` : `${blogCount} სტატია`,
      status: blogCount >= 5 ? 'success' : blogCount > 0 ? 'warning' : 'danger',
      value: blogCount
    });

    // Team count
    checks.push({
      title: 'გუნდის წევრები',
      desc: (c.team?.length || 0) === 0 ? 'დაამატე გუნდის წევრები — trust signal-ისთვის' : `${c.team.length} წევრი`,
      status: (c.team?.length || 0) >= 3 ? 'success' : (c.team?.length || 0) > 0 ? 'warning' : 'danger',
      value: c.team?.length || 0
    });

    // Testimonials
    checks.push({
      title: 'გამოხმაურებები',
      desc: (c.testimonials?.length || 0) === 0 ? 'გამოხმაურებები ზრდის კონვერსიას' : `${c.testimonials.length} გამოხმაურება`,
      status: (c.testimonials?.length || 0) >= 3 ? 'success' : (c.testimonials?.length || 0) > 0 ? 'warning' : 'danger',
      value: c.testimonials?.length || 0
    });

    // FAQ
    checks.push({
      title: 'FAQ',
      desc: (c.faq?.length || 0) === 0 ? 'FAQ ცარიელია — SEO-სთვის მნიშვნელოვანია' : `${c.faq.length} კითხვა`,
      status: (c.faq?.length || 0) >= 5 ? 'success' : (c.faq?.length || 0) > 0 ? 'warning' : 'danger',
      value: c.faq?.length || 0
    });

    // Social
    const socialCount = Object.values(c.site?.social || {}).filter(v => v && v !== '#').length;
    checks.push({
      title: 'სოციალური ქსელები',
      desc: socialCount === 0 ? 'დაუკავშირდი სოციალურ ქსელებს' : `${socialCount}/4 ქსელი დაყენებული`,
      status: socialCount >= 2 ? 'success' : socialCount > 0 ? 'warning' : 'danger',
      value: socialCount + '/4'
    });

    // Calculate score
    const successCount = checks.filter(c => c.status === 'success').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    const dangerCount = checks.filter(c => c.status === 'danger').length;
    const score = Math.round((successCount + warningCount * 0.5) / checks.length * 100);
    const scoreLabel = score >= 80 ? 'შესანიშნავი' : score >= 60 ? 'კარგი' : score >= 40 ? 'საშუალო' : 'სუსტი';
    const scoreRingClass = score >= 80 ? '' : score >= 60 ? 'warn' : 'danger';
    const circleLength = 314;
    const offset = circleLength - (score / 100) * circleLength;

    // Update badge
    const badge = $('#badge-seo');
    if (badge) badge.textContent = score;

    return `
      <div class="page-header">
        <div>
          <h1>SEO Dashboard</h1>
          <p>საიტის SEO-ს ჯანმრთელობის შემოწმება და Google-ში აღმოჩენისთვის მომზადება</p>
        </div>
        <div class="page-header-actions">
          <a href="https://pagespeed.web.dev/analysis?url=https://gubermangeo.com" target="_blank" class="btn btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            PageSpeed Test
          </a>
          <a href="https://search.google.com/search-console" target="_blank" class="btn btn-dark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            Search Console
          </a>
        </div>
      </div>

      <div class="seo-score-card">
        <div class="seo-score-ring ${scoreRingClass}">
          <svg viewBox="0 0 120 120">
            <circle class="bg" cx="60" cy="60" r="50"/>
            <circle class="fg" cx="60" cy="60" r="50" style="stroke-dashoffset: ${offset}"/>
          </svg>
          <div class="seo-score-value">
            <div class="num">${score}</div>
            <div class="lbl">SEO SCORE</div>
          </div>
        </div>
        <div class="seo-score-info">
          <h2>${scoreLabel}</h2>
          <p>საიტი ${score >= 60 ? 'მზადაა' : 'საჭიროებს გაუმჯობესებას'} Google-ში აღმოჩენისთვის. გამოიყენე ქვემოთ მოცემული შემოწმებები პრობლემების გამოსასწორებლად.</p>
          <div class="seo-score-stats">
            <div class="seo-score-stat"><span class="dot success"></span>${successCount} OK</div>
            <div class="seo-score-stat"><span class="dot warning"></span>${warningCount} გასაუმჯობესებელი</div>
            <div class="seo-score-stat"><span class="dot danger"></span>${dangerCount} კრიტიკული</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">შემოწმებები (${checks.length})</h3>
        </div>
        <div class="seo-checks">
          ${checks.map(ch => `
            <div class="seo-check">
              <div class="seo-check-icon ${ch.status}">
                ${ch.status === 'success' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' :
                  ch.status === 'warning' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>' :
                  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>'}
              </div>
              <div class="seo-check-body">
                <h4>${escapeHtml(ch.title)}</h4>
                <p>${escapeHtml(ch.desc)}</p>
              </div>
              <div class="seo-check-value">${escapeHtml(String(ch.value))}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📋 გვერდის SEO აუდიტი</h3>
          <p class="card-subtitle">თითოეული გვერდის title/description-ის სტატუსი</p>
        </div>
        <div class="seo-page-audit">
          ${renderPageAudit()}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">🔗 სასარგებლო ბმულები</h3></div>
        <div class="form-grid cols-2">
          <a href="https://search.google.com/search-console/welcome" target="_blank" class="quick-action">
            <div class="quick-action-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div>
            <div class="quick-action-text">
              <div class="quick-action-title">Google Search Console</div>
              <div class="quick-action-desc">საიტი Google-ში დაარეგისტრირე</div>
            </div>
          </a>
          <a href="https://analytics.google.com/" target="_blank" class="quick-action">
            <div class="quick-action-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></div>
            <div class="quick-action-text">
              <div class="quick-action-title">Google Analytics</div>
              <div class="quick-action-desc">ვიზიტორების სტატისტიკა</div>
            </div>
          </a>
          <a href="https://pagespeed.web.dev/" target="_blank" class="quick-action">
            <div class="quick-action-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <div class="quick-action-text">
              <div class="quick-action-title">PageSpeed Insights</div>
              <div class="quick-action-desc">საიტის სისწრაფის ტესტი</div>
            </div>
          </a>
          <a href="https://www.bing.com/webmasters" target="_blank" class="quick-action">
            <div class="quick-action-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg></div>
            <div class="quick-action-text">
              <div class="quick-action-title">Bing Webmaster</div>
              <div class="quick-action-desc">Bing-ზე საიტის დარეგისტრირება</div>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  function renderPageAudit() {
    const seo = state.content.seo || {};
    const pages = [
      { name: 'მთავარი', url: '/', key: 'home' },
      { name: 'სერვისები', url: '/services', key: 'services' },
      { name: 'ფასები', url: '/pricing', key: 'pricing' },
      { name: 'ჩვენ შესახებ', url: '/about', key: 'about' },
      { name: 'ბლოგი', url: '/blog', key: 'blog' },
      { name: 'კონტაქტი', url: '/contact', key: 'contact' }
    ];
    return pages.map(p => {
      const pageSeo = seo.pages?.[p.key] || {};
      const hasTitle = !!pageSeo.title;
      const hasDesc = !!pageSeo.description;
      const titleOk = hasTitle && pageSeo.title.length >= 30 && pageSeo.title.length <= 60;
      const descOk = hasDesc && pageSeo.description.length >= 120 && pageSeo.description.length <= 160;
      const overall = titleOk && descOk ? 'success' : (hasTitle || hasDesc) ? 'warning' : 'danger';
      return `
        <div class="seo-page-row">
          <div>
            <div class="seo-page-name">${escapeHtml(p.name)}</div>
            <div class="seo-page-url">${escapeHtml(p.url)}</div>
          </div>
          <span class="seo-mini-badge ${hasTitle ? (titleOk ? 'success' : 'warning') : 'danger'}">
            Title ${hasTitle ? pageSeo.title.length + 'ch' : '—'}
          </span>
          <span class="seo-mini-badge ${hasDesc ? (descOk ? 'success' : 'warning') : 'danger'}">
            Desc ${hasDesc ? pageSeo.description.length + 'ch' : '—'}
          </span>
          <a href="#meta" class="btn btn-outline btn-xs" onclick="location.hash='#meta'">რედაქტირება →</a>
        </div>
      `;
    }).join('');
  }

  function attachSEO() {}

  // ====== META TAGS EDITOR ======
  function renderMeta() {
    if (!state.content.seo) state.content.seo = { pages: {}, verification: {} };
    if (!state.content.seo.pages) state.content.seo.pages = {};
    if (!state.content.seo.verification) state.content.seo.verification = {};
    const v = state.content.seo.verification;

    const pages = [
      { name: 'მთავარი', key: 'home' },
      { name: 'სერვისები', key: 'services' },
      { name: 'ფასები', key: 'pricing' },
      { name: 'ჩვენ შესახებ', key: 'about' },
      { name: 'ბლოგი', key: 'blog' },
      { name: 'კონტაქტი', key: 'contact' }
    ];

    return `
      <div class="page-header">
        <div>
          <h1>Meta Tags</h1>
          <p>თითოეული გვერდის SEO meta title და description</p>
        </div>
      </div>

      <div class="info-banner" style="background: #f0fdf4; border-left-color: #10B981;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <div>
          <strong>ცოცხალი:</strong> ცვლილებები ავტომატურად ინერგება <code>&lt;title&gt;</code>, <code>meta description</code>, Open Graph (FB/LinkedIn), Twitter Card და canonical URL-ში ყოველ Publish-ზე.
          <div style="margin-top: 8px; font-size: 13px; color: var(--gray-700);">
            • <strong>Title</strong>: 30-60 სიმბოლო, მთავარი საძიებო სიტყვა დასაწყისში<br>
            • <strong>Description</strong>: 120-160 სიმბოლო, მიზიდვალი ტექსტი რომელიც Google-ში გამოჩნდება<br>
            • <strong>OG Image</strong>: 1200×630px, ხილულია FB/LinkedIn-ზე გაზიარების დროს<br>
            • <strong>Keywords</strong>: ნაკლებად კრიტიკულია — Google იგნორირებს, მაგრამ Bing-ისთვის სასარგებლოა
          </div>
        </div>
      </div>

      ${pages.map(p => {
        const s = state.content.seo.pages[p.key] || {};
        return `
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">${escapeHtml(p.name)}</h3>
              <p class="card-subtitle">URL: /${p.key === 'home' ? '' : p.key}</p>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Meta Title <span class="required">*</span> <span style="color: var(--gray-500); font-weight: 400;">(${(s.title || '').length}/60)</span></label>
                <input type="text" data-field="seo.pages.${p.key}.title" value="${escapeHtml(s.title || '')}" placeholder="მაგ. ${p.name} — Audit" maxlength="80" />
              </div>
              <div class="form-group">
                <label>Meta Description <span style="color: var(--gray-500); font-weight: 400;">(${(s.description || '').length}/160)</span></label>
                <textarea data-field="seo.pages.${p.key}.description" rows="2" placeholder="მოკლე აღწერა რაც Google-ში გამოჩნდება" maxlength="200">${escapeHtml(s.description || '')}</textarea>
              </div>
              <div class="form-grid cols-2">
                <div class="form-group">
                  <label>OG Image URL (სოც. ქსელებისთვის)</label>
                  <input type="url" data-field="seo.pages.${p.key}.ogImage" value="${escapeHtml(s.ogImage || '')}" placeholder="https://..." />
                </div>
                <div class="form-group">
                  <label>Keywords (მძიმით გამოყოფილი)</label>
                  <input type="text" data-field="seo.pages.${p.key}.keywords" value="${escapeHtml(s.keywords || '')}" placeholder="ბუღალტერია, აუდიტი, ..." />
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">🔐 საძიებო სისტემების ვერიფიკაცია</h3>
          <p class="card-subtitle">თითოეული search engine-ის webmaster tools-ში რეგისტრაციისას ჩაწერე აქ მიცემული კოდი — meta tag-ები ავტომატურად ჩაიდოს ყველა გვერდზე</p>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>Google Search Console</label>
            <input type="text" data-field="seo.verification.google" value="${escapeHtml(v.google || '')}" placeholder="xxxxxxxxxxxxxxxx" />
            <small class="hint">გაიდი: <a href="https://search.google.com/search-console" target="_blank" style="color: var(--ink); font-weight: 700;">search.google.com/search-console</a> → Add Property → HTML tag → მიცემული content-ის მნიშვნელობა</small>
          </div>
          <div class="form-group">
            <label>Bing Webmaster Tools</label>
            <input type="text" data-field="seo.verification.bing" value="${escapeHtml(v.bing || '')}" placeholder="F8C0D3B068A2D777FC53B0FE97D3DAFA" />
            <small class="hint">გაიდი: <a href="https://www.bing.com/webmasters" target="_blank" style="color: var(--ink); font-weight: 700;">bing.com/webmasters</a> → Add Site → HTML Meta Tag → content მნიშვნელობა</small>
          </div>
          <div class="form-group">
            <label>Yandex Webmaster</label>
            <input type="text" data-field="seo.verification.yandex" value="${escapeHtml(v.yandex || '')}" placeholder="xxxxxxxxxxxxxxxx" />
          </div>
          <div class="form-group">
            <label>Pinterest domain verify</label>
            <input type="text" data-field="seo.verification.pinterest" value="${escapeHtml(v.pinterest || '')}" placeholder="xxxxxxxxxxxxxxxx" />
          </div>
          <div class="form-group">
            <label>Facebook domain verify</label>
            <input type="text" data-field="seo.verification.facebook" value="${escapeHtml(v.facebook || '')}" placeholder="xxxxxxxxxxxxxxxx" />
          </div>
        </div>
        <div style="margin-top: 16px; padding: 12px 14px; background: #f0fdf4; border-left: 3px solid #10B981; font-size: 13px;">
          <strong>ცოცხალი:</strong> ყველა კოდი ავტომატურად ხდება <code>&lt;meta&gt;</code> ტაგი <code>&lt;head&gt;</code>-ში. Publish-ის შემდეგ Bing/Google/Yandex-ს შეუძლია ვერიფიცირება 30 წამში.
        </div>
      </div>
    `;
  }

  function attachMeta() {
    attachFieldListeners();
  }

  // ====== SITEMAP ======
  function renderSitemap() {
    const baseUrl = 'https://gubermangeo.com';
    const urls = [
      { loc: baseUrl + '/', priority: '1.0', freq: 'weekly' },
      { loc: baseUrl + '/services.html', priority: '0.9', freq: 'weekly' },
      { loc: baseUrl + '/pricing.html', priority: '0.9', freq: 'monthly' },
      { loc: baseUrl + '/about.html', priority: '0.8', freq: 'monthly' },
      { loc: baseUrl + '/blog.html', priority: '0.8', freq: 'daily' },
      { loc: baseUrl + '/contact.html', priority: '0.7', freq: 'monthly' }
    ];
    (state.content.services || []).forEach(s => {
      urls.push({ loc: `${baseUrl}/services/${s.id}.html`, priority: '0.8', freq: 'monthly' });
    });
    (state.content.blog || []).forEach(b => {
      urls.push({ loc: `${baseUrl}/blog.html#${b.slug}`, priority: '0.7', freq: 'monthly' });
    });

    const today = new Date().toISOString().split('T')[0];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return `
      <div class="page-header">
        <div>
          <h1>Sitemap.xml</h1>
          <p>ავტომატურად გენერირებული sitemap Google-ისა და საძიებო სისტემებისთვის</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-outline" id="download-sitemap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Download
          </button>
          <button class="btn btn-yellow" id="publish-sitemap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            Publish to Site
          </button>
        </div>
      </div>

      <div class="info-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/></svg>
        <div>
          <strong>სიტე-მაპის URL:</strong> <code>${baseUrl}/sitemap.xml</code><br>
          <strong>ატვირთე Google Search Console-ში:</strong> Settings → Sitemaps → Add new sitemap
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">სიტე-მაპის შიგთავსი (${urls.length} URL)</h3>
            <p class="card-subtitle">ავტო-გენერირდა ყოველი სერვისიდან და ბლოგიდან</p>
          </div>
        </div>
        <pre style="background: var(--gray-900, #1a1a24); color: #a8e6cf; padding: 20px; overflow-x: auto; font-size: 12px; line-height: 1.55; font-family: 'JetBrains Mono', monospace; max-height: 500px; overflow-y: auto;"><code>${escapeHtml(sitemap)}</code></pre>
      </div>
    `;
  }

  function attachSitemap() {
    const baseUrl = 'https://gubermangeo.com';

    const generateSitemapXml = () => {
      const urls = [
        { loc: baseUrl + '/', priority: '1.0', freq: 'weekly' },
        { loc: baseUrl + '/services.html', priority: '0.9', freq: 'weekly' },
        { loc: baseUrl + '/pricing.html', priority: '0.9', freq: 'monthly' },
        { loc: baseUrl + '/about.html', priority: '0.8', freq: 'monthly' },
        { loc: baseUrl + '/blog.html', priority: '0.8', freq: 'daily' },
        { loc: baseUrl + '/contact.html', priority: '0.7', freq: 'monthly' }
      ];
      (state.content.services || []).forEach(s => {
        urls.push({ loc: `${baseUrl}/services/${s.id}.html`, priority: '0.8', freq: 'monthly' });
      });
      const today = new Date().toISOString().split('T')[0];
      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    };

    $('#download-sitemap')?.addEventListener('click', () => {
      const xml = generateSitemapXml();
      const blob = new Blob([xml], { type: 'application/xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sitemap.xml';
      a.click();
      toast('sitemap.xml ჩამოიწერა', 'success');
    });

    $('#publish-sitemap')?.addEventListener('click', async () => {
      if (!getGithubToken()) {
        toast('❌ ჯერ GitHub Token-ი დააყენე Settings-ში', 'error');
        return;
      }
      if (!confirm('Sitemap.xml გამოქვეყნდეს GitHub-ზე?')) return;
      const btn = $('#publish-sitemap');
      btn.disabled = true;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg> იტვირთება...';
      try {
        const xml = generateSitemapXml();
        let sha = null;
        try {
          const curr = await githubAPI(`contents/sitemap.xml?ref=${GITHUB_BRANCH}`);
          sha = curr.sha;
        } catch (e) { if (!e.message.startsWith('NOT_FOUND')) throw e; }
        const body = { message: 'Update sitemap.xml', content: toBase64(xml), branch: GITHUB_BRANCH };
        if (sha) body.sha = sha;
        await githubAPI('contents/sitemap.xml', { method: 'PUT', body: JSON.stringify(body) });
        toast('✅ Sitemap გამოქვეყნებულია!', 'success');
        logActivity('publish', 'Sitemap.xml', 'sitemap');
      } catch (err) {
        toast('❌ ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> Publish to Site';
      }
    });
  }

  // ====== ANALYTICS ======
  function renderAnalytics() {
    return `
      <div class="page-header">
        <div>
          <h1>Analytics</h1>
          <p>ვიზიტორების სტატისტიკა და Google Analytics ინტეგრაცია</p>
        </div>
      </div>

      <div class="info-banner" style="background: #f0fdf4; border-left-color: #10B981;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <div>
          <strong>ცოცხალი:</strong> როცა Measurement ID-ს ჩაწერ (მაგ. <code>G-XXXXXXXXXX</code>), gtag.js ავტომატურად ჩაიტვირთება ყველა public გვერდზე. Publish-ის შემდეგ ანალიტიკა ამუშავდება 30 წამში.
          <div style="margin-top: 8px; font-size: 13px;">
            • <strong>Google Analytics 4</strong> — მიიღე Measurement ID <a href="https://analytics.google.com" target="_blank" style="color: var(--ink); font-weight: 700;">analytics.google.com</a>-დან<br>
            • <strong>Vercel Analytics</strong> — ალტერნატივა, ავტომატურად Vercel-ს აქვს ჩაშენებული უფასო Hobby გეგმაზე<br>
            • <strong>Plausible</strong> / <strong>Fathom</strong> — კონფიდენციალურობაზე ორიენტირებული (ფასიანი) ალტერნატივები
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📊 Google Analytics 4</h3>
          <p class="card-subtitle">დააყენე Measurement ID (G-XXXXXXXXXX)</p>
        </div>
        <div class="form-grid" style="max-width: 520px;">
          <div class="form-group">
            <label>Measurement ID</label>
            <input type="text" data-field="analytics.gaId" value="${escapeHtml(state.content.analytics?.gaId || '')}" placeholder="G-XXXXXXXXXX" />
            <small class="hint">მიიღე <a href="https://analytics.google.com/analytics/web/#/a/admin/account/create" target="_blank" style="color: var(--ink); font-weight: 700;">analytics.google.com</a>-დან</small>
          </div>
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" data-field="analytics.enabled" ${state.content.analytics?.enabled ? 'checked' : ''} />
              <span class="switch-slider"></span>
              <span class="switch-label">GA ტრექინგი ჩართულია</span>
            </label>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">⚡ Vercel Analytics (რეკომენდებული)</h3>
          <p class="card-subtitle">ავტომატურად ხელმისაწვდომია</p>
        </div>
        <p style="color: var(--gray-700); margin-bottom: 16px;">
          Vercel-ს აქვს ჩაშენებული Analytics უფასო Hobby გეგმაზე. ჩართე <strong>Vercel Dashboard → Analytics → Enable</strong>.
        </p>
        <a href="https://vercel.com/chabas-projects-c40e9f58/audit-company/analytics" target="_blank" class="btn btn-dark">
          გახსენი Vercel Analytics →
        </a>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📈 მიახლოებითი საიტის სტატისტიკა</h3>
        </div>
        <div class="analytics-grid">
          <div class="analytics-tile">
            <div class="analytics-tile-label">სერვისები</div>
            <div class="analytics-tile-value">${state.content.services?.length || 0}</div>
          </div>
          <div class="analytics-tile">
            <div class="analytics-tile-label">ბლოგი</div>
            <div class="analytics-tile-value">${state.content.blog?.length || 0}</div>
          </div>
          <div class="analytics-tile">
            <div class="analytics-tile-label">FAQ</div>
            <div class="analytics-tile-value">${state.content.faq?.length || 0}</div>
          </div>
          <div class="analytics-tile">
            <div class="analytics-tile-label">გუნდი</div>
            <div class="analytics-tile-value">${state.content.team?.length || 0}</div>
          </div>
          <div class="analytics-tile">
            <div class="analytics-tile-label">გამოხმაურებები</div>
            <div class="analytics-tile-value">${state.content.testimonials?.length || 0}</div>
          </div>
          <div class="analytics-tile">
            <div class="analytics-tile-label">ინდუსტრიები</div>
            <div class="analytics-tile-value">${state.content.industries?.length || 0}</div>
          </div>
        </div>
      </div>
    `;
  }

  function attachAnalytics() {
    attachFieldListeners();
  }

  // ====== MEDIA LIBRARY ======
  function renderMedia() {
    const media = (Array.isArray(state.content.media) ? state.content.media : []);
    const hasSecret = !!getSharedSecret();
    const hasToken = !!getGithubToken();
    const canUpload = hasSecret || hasToken;

    return `
      <div class="page-header">
        <div>
          <h1>Media Library</h1>
          <p>ატვირთე სურათები — თითოეულს მიიღებ მუდმივ URL-ს რომელსაც გამოიყენებ მთელ საიტზე</p>
        </div>
        <div class="page-header-actions">
          ${canUpload ? `<button class="btn btn-outline btn-sm" id="test-upload-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Test connection
          </button>` : ''}
        </div>
      </div>

      ${!canUpload ? `
        <div class="info-banner" style="background: #fef2f2; border-left-color: #EF4444;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/></svg>
          <div>
            <strong>ჯერ ვერ აიტვირთება.</strong> 2 ნაბიჯი გამარტივებისთვის:
            <ol style="margin: 8px 0 0 20px; padding: 0; line-height: 1.8;">
              <li>გახსენი <a href="#settings" onclick="location.hash='#settings'" style="color: var(--ink); font-weight: 700;">Settings</a> → "👥 Shared Publish (Multi-user)" ბლოკი</li>
              <li>ჩაწერე <strong>Shared Secret</strong> (იგივე პაროლი რაც Vercel-ში <code>ADMIN_SECRET</code> env var-ად). დააჭირე "შენახვა". დაბრუნდი აქ.</li>
            </ol>
            <div style="margin-top: 8px; font-size: 13px; color: var(--gray-700);">💡 თუ Publish ღილაკი უკვე მუშაობს — ესე იგი Secret უკვე გაქვს სადღაც. Settings-ში გადაამოწმე "ACTIVE" მწვანე ნიშანი.</div>
          </div>
        </div>
      ` : `
        <div class="info-banner" style="background: #f0fdf4; border-left-color: #10B981;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          <div>
            <strong>მზადაა ასატვირთად.</strong> ${hasSecret ? 'Shared Secret' : 'GitHub Token'} გაქვს დაყენებული.
            <div style="margin-top: 6px; font-size: 13px; color: var(--gray-700);">
              🖼 <strong>როგორ მუშაობს:</strong> ატვირთე ფოტო (drag-drop ან click-to-browse) → მე ვტვირთავ GitHub-ზე → უკან გიბრუნებ <strong>მუდმივ URL-ს</strong>. ფოტოს ქვემოთ "Copy URL" ღილაკი აკოპირებს URL-ს. პასტე ნებისმიერ ველში (Hero, Services, Team, Blog, Favicon...) — URL არასდროს არ გაქრება.
            </div>
            <div style="margin-top: 6px; font-size: 13px;">
              ❓ <strong>არ მუშაობს?</strong> დააჭირე "Test connection" ღილაკს — მოვარგებ რას ვუკრავდე.
            </div>
          </div>
        </div>
      `}

      <div class="media-upload-zone" id="upload-zone" ${!canUpload ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
        <div class="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </div>
        <h3>ატვირთე სურათი</h3>
        <p>გადმოიტანე ფაილი აქ ან დააჭირე ასარჩევად. Max 8MB · JPG / PNG / WebP / GIF / SVG</p>
        <input type="file" id="upload-input" accept="image/*" style="display: none;" multiple />
      </div>

      ${media.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </div>
          <h3>ჯერ სურათები არ გაქვს</h3>
          <p>ატვირთე პირველი სურათი ზემოდან</p>
        </div>
      ` : `
        <div class="media-grid">
          ${media.map((m, i) => {
            // GitHub raw URL as fallback — loads immediately while Vercel propagates the file
            const rawFallback = m.path ? `https://raw.githubusercontent.com/chaba17/audit-company/main/${m.path}` : (m.url || '');
            return `
            <div class="media-item" data-i="${i}">
              <img src="${escapeHtml(m.url)}"
                   data-fallback="${escapeHtml(rawFallback)}"
                   alt="${escapeHtml(m.name || '')}"
                   loading="lazy"
                   onerror="
                     const fb = this.getAttribute('data-fallback');
                     if (fb && this.src !== fb) { this.src = fb; this.setAttribute('data-retry','1'); return; }
                     if (!this.getAttribute('data-retry-done')) {
                       this.setAttribute('data-retry-done','1');
                       const orig = this.getAttribute('data-original-src') || this.src.split('?')[0];
                       this.setAttribute('data-original-src', orig);
                       setTimeout(() => { this.src = orig + '?v=' + Date.now(); }, 3000);
                     } else {
                       this.style.display='none';
                       const parent = this.parentElement;
                       if (parent && !parent.querySelector('.media-placeholder')) {
                         const ph = document.createElement('div');
                         ph.className = 'media-placeholder';
                         ph.style.cssText = 'display: grid; place-items: center; aspect-ratio: 1; background: var(--gray-100); color: var(--gray-500); font-size: 11px; padding: 12px; text-align: center;';
                         ph.textContent = '⏳ იტვირთება...';
                         parent.insertBefore(ph, this);
                       }
                     }
                   " />
              <div class="media-item-info" title="${escapeHtml(m.url)}">${escapeHtml(m.name || 'image')}</div>
              <div class="media-item-actions">
                <button data-copy-url="${escapeHtml(m.url)}" title="Copy URL">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
                <button data-delete-media="${i}" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
              </div>
            </div>
          `;}).join('')}
        </div>
      `}
    `;
  }

  function attachMedia() {
    const zone = $('#upload-zone');
    const input = $('#upload-input');
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
    });
    input.addEventListener('change', () => {
      if (input.files.length) handleUpload(input.files);
      input.value = '';
    });

    $$('[data-copy-url]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copyUrl);
        toast('✓ URL დაკოპირდა', 'success');
      });
    });

    $$('[data-delete-media]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.deleteMedia);
        if (!confirm('წაიშალოს სურათი ბიბლიოთეკიდან? (ფაილი GitHub-იდან არ წაიშლება)')) return;
        if (!state.content.media) state.content.media = [];
        state.content.media.splice(i, 1);
        markDirty();
        renderSection('media');
        logActivity('delete', 'სურათი', 'media');
      });
    });

    // Test connection button — sends a tiny "ping" to /api/upload and reports result
    $('#test-upload-btn')?.addEventListener('click', async () => {
      const btn = $('#test-upload-btn');
      btn.disabled = true;
      const orig = btn.innerHTML;
      btn.innerHTML = 'ტესტირება...';
      try {
        const secret = getSharedSecret();
        if (!secret) {
          toast('❌ Shared Secret არ არის დაყენებული Settings-ში', 'error', 5000);
          return;
        }
        // 1x1 transparent PNG base64 payload
        const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret, name: '_test-connection.png', contentBase64: tinyPng, mime: 'image/png' })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast('✅ კავშირი მუშაობს! Test ფაილი აიტვირთა: ' + data.url, 'success', 7000);
          // Refresh media list to show the test file
          if (!state.content.media) state.content.media = [];
          state.content.media.unshift({
            name: '_test-connection.png',
            url: data.url,
            size: 95,
            type: 'image/png',
            uploaded: Date.now()
          });
          markDirty();
          renderSection('media');
        } else {
          toast(`❌ ${res.status} — ${data.error || 'უცნობი შეცდომა'}${data.detail ? ': '+data.detail : ''}`, 'error', 8000);
        }
      } catch (e) {
        toast('❌ Network error: ' + e.message, 'error', 6000);
      } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    });
  }

  async function handleUpload(files) {
    const hasSharedSecret = !!getSharedSecret();
    const hasToken = !!getGithubToken();
    if (!hasSharedSecret && !hasToken) {
      toast('❌ ჯერ Shared Secret-ი (ან GitHub Token) დააყენე Settings-ში', 'error', 5000);
      return;
    }
    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) {
        toast(`❌ ${file.name} > 8MB`, 'error');
        continue;
      }
      await uploadFile(file);
    }
  }

  // Client-side image optimizer — upload pipeline:
  // - Every bitmap image (PNG/JPEG/any raster) is transcoded to WebP q=0.8
  //   and downsized to max 2000px wide. WebP handles alpha, so PNG
  //   transparency is preserved and file size typically drops 30-70%.
  // - SVG / GIF pass through unchanged (SVG is vector, GIF may be animated).
  // - If the resulting WebP is larger than the original (rare), we keep the original.
  // - If the browser can't encode WebP (ancient browser), we fall back to JPEG q=0.82.
  // Goal: stop 2-10MB admin-uploaded bitmaps from becoming hero LCP weights and
  // serve the smallest format browsers support universally in 2026 (WebP).
  async function maybeOptimizeImage(file, { force = false } = {}) {
    if (!file.type || !file.type.startsWith('image/')) return file;
    if (/svg|gif/.test(file.type)) return file;
    // Skip tiny files unless forced (Media Library batch mode)
    if (!force && file.size < 250 * 1024) return file;

    try {
      const bmp = await (typeof createImageBitmap === 'function'
        ? createImageBitmap(file)
        : (async () => {
            const url = URL.createObjectURL(file);
            const img = await new Promise((resolve, reject) => {
              const i = new Image();
              i.onload = () => resolve(i);
              i.onerror = reject;
              i.src = url;
            });
            URL.revokeObjectURL(url);
            return { width: img.naturalWidth, height: img.naturalHeight, _img: img, close(){} };
          })());

      const maxW = 2000;
      const scale = bmp.width > maxW ? maxW / bmp.width : 1;
      const w = Math.round(bmp.width * scale);
      const h = Math.round(bmp.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      // WebP preserves alpha, no white-fill needed.
      ctx.drawImage(bmp._img || bmp, 0, 0, w, h);
      if (bmp.close) bmp.close();

      // Try WebP first. If canvas.toBlob with image/webp returns null (browser
      // doesn't support WebP encoding), fall back to JPEG.
      let blob = await new Promise(res => canvas.toBlob(res, 'image/webp', 0.80));
      let outType = 'image/webp';
      let outExt = '.webp';
      if (!blob) {
        blob = await new Promise(res => {
          // For JPEG fall-back paint white under any transparency
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          canvas.toBlob(res, 'image/jpeg', 0.82);
        });
        outType = 'image/jpeg';
        outExt = '.jpg';
      }
      if (!blob) return file;

      // Only replace if meaningfully smaller (skip when already well-compressed)
      if (!force && blob.size >= file.size * 0.9) return file;

      const baseName = file.name.replace(/\.[^.]+$/, '');
      const optimized = new File([blob], baseName + outExt, { type: outType });
      const savedPct = Math.max(0, Math.round((1 - blob.size / file.size) * 100));
      toast(`🗜 ${file.name} → ${outExt.slice(1).toUpperCase()} (${savedPct}% ნაკლები, ${(blob.size/1024).toFixed(0)}KB)`, 'info', 3500);
      return optimized;
    } catch (e) {
      console.warn('Image optimize failed, uploading original:', e);
      return file;
    }
  }

  // Expose for Media Library's batch "Re-compress all" button
  window.__maybeOptimizeImage = maybeOptimizeImage;

  async function uploadFile(originalFile) {
    const file = await maybeOptimizeImage(originalFile);
    toast(`ატვირთვა: ${file.name}...`, 'info', 2000);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Prefer shared API (no GitHub token required) → fall back to personal token
      let url, urlPath;
      const secret = getSharedSecret();
      if (secret) {
        const apiRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret, name: file.name, contentBase64: base64, mime: file.type })
        });
        const data = await apiRes.json().catch(() => ({}));
        if (!apiRes.ok) throw new Error(data.error || data.detail || `HTTP ${apiRes.status}`);
        url = data.url; urlPath = data.path;
      } else {
        // Fallback: personal GitHub token
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `assets/images/uploads/${timestamp}-${safeName}`;
        await githubAPI(`contents/${path}`, {
          method: 'PUT',
          body: JSON.stringify({ message: `Upload ${safeName}`, content: base64, branch: GITHUB_BRANCH })
        });
        url = `https://gubermangeo.com/${path}`;
        urlPath = path;
      }

      if (!state.content.media) state.content.media = [];
      if (!Array.isArray(state.content.media)) state.content.media = [];
      state.content.media.unshift({
        name: file.name,
        url,
        path: urlPath,
        size: file.size,
        type: file.type,
        uploaded: Date.now()
      });
      markDirty();
      logActivity('create', file.name, 'media');
      toast(`✓ ${file.name} ატვირთულია`, 'success');
      renderSection('media');
    } catch (err) {
      toast(`❌ ${err.message}`, 'error', 5000);
    }
  }

  // ====== THEME CUSTOMIZER ======
  function renderTheme() {
    const theme = state.content.theme || { yellow: '#FFE600', ink: '#2E2E38' };
    return `
      <div class="page-header">
        <div>
          <h1>Theme & Colors</h1>
          <p>საიტის ძირითადი ფერები და შრიფტი</p>
        </div>
      </div>

      <div class="info-banner" style="background: #f0fdf4; border-left-color: #10B981;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <div><strong>ცოცხალი:</strong> ფერების ცვლილება Publish-ის შემდეგ ავტომატურად ინერგება საიტზე (CSS variables-ით). Refresh-ის გარეშეც იმუშავებს ყველა ვიზიტორზე.</div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">🎨 ძირითადი ფერები</h3></div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div class="color-swatch">
            <input type="color" data-field="theme.yellow" value="${escapeHtml(theme.yellow)}" />
            <div class="color-swatch-info">
              <div class="color-swatch-label">Primary (ყვითელი) — CTA ღილაკები, highlights</div>
              <div class="color-swatch-value">${escapeHtml(theme.yellow)}</div>
            </div>
            <input type="text" data-field="theme.yellow" value="${escapeHtml(theme.yellow)}" />
          </div>
          <div class="color-swatch">
            <input type="color" data-field="theme.ink" value="${escapeHtml(theme.ink)}" />
            <div class="color-swatch-info">
              <div class="color-swatch-label">Dark (ფონი) — header + footer</div>
              <div class="color-swatch-value">${escapeHtml(theme.ink)}</div>
            </div>
            <input type="text" data-field="theme.ink" value="${escapeHtml(theme.ink)}" />
          </div>
        </div>
        <div style="margin-top: 16px; padding: 16px; background: var(--gray-50); border-left: 3px solid ${escapeHtml(theme.yellow)};">
          <div style="font-size: 12px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Preview</div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button style="padding: 10px 18px; background: ${escapeHtml(theme.yellow)}; color: ${escapeHtml(theme.ink)}; font-weight: 700; border: none; cursor: default;">Primary Button</button>
            <button style="padding: 10px 18px; background: ${escapeHtml(theme.ink)}; color: ${escapeHtml(theme.yellow)}; font-weight: 700; border: none; cursor: default;">Dark Button</button>
            <span style="padding: 10px 18px; background: white; color: ${escapeHtml(theme.ink)}; border: 2px solid ${escapeHtml(theme.ink)}; font-weight: 700;">Outline</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">🔤 შრიფტები</h3></div>
        <div class="font-preview">
          <div class="font-preview-label">სათაური (Archivo)</div>
          <div class="font-preview-sample">გამჭვირვალე ფასები.</div>
        </div>
        <div class="font-preview">
          <div class="font-preview-label">Body (Inter + Noto Sans Georgian)</div>
          <div class="font-preview-sample body">ბუღალტრული, საგადასახადო, აუდიტის და საკონსულტაციო მომსახურება საქართველოში.</div>
        </div>
      </div>
    `;
  }

  function attachTheme() {
    attachFieldListeners();
    // Sync color picker with text input
    $$('[data-field^="theme."]').forEach(input => {
      input.addEventListener('input', () => {
        const siblingInputs = $$(`[data-field="${input.dataset.field}"]`);
        siblingInputs.forEach(sib => { if (sib !== input) sib.value = input.value; });
        const label = input.closest('.color-swatch')?.querySelector('.color-swatch-value');
        if (label) label.textContent = input.value;
      });
    });
  }

  // ====== ACTIVITY LOG ======
  function renderActivity() {
    const log = getActivityLog();
    const iconMap = {
      create: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>',
      update: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
      delete: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
      publish: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
    };
    const actionNames = { create: 'შეიქმნა', update: 'შეიცვალა', delete: 'წაიშალა', publish: 'გამოქვეყნდა' };

    return `
      <div class="page-header">
        <div>
          <h1>Activity Log</h1>
          <p>ბოლო 100 ცვლილება. მხოლოდ შენს ბრაუზერში.</p>
        </div>
        ${log.length > 0 ? `<div class="page-header-actions"><button class="btn btn-outline" id="clear-log">წაშლა</button></div>` : ''}
      </div>

      ${log.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h3>ჯერ აქტივობები არ არის</h3>
          <p>ცვლილებები აქ გამოჩნდება ავტომატურად</p>
        </div>
      ` : `
        <div class="activity-log">
          ${log.map(e => `
            <div class="activity-item">
              <div class="activity-icon ${e.action}">${iconMap[e.action] || iconMap.update}</div>
              <div class="activity-body">
                <div class="activity-title">${escapeHtml(e.title)} — ${actionNames[e.action] || e.action}</div>
                <div class="activity-desc">სექცია: ${escapeHtml(e.section)}</div>
              </div>
              <div class="activity-time" title="${new Date(e.time).toLocaleString('ka-GE')}">${timeAgo(e.time)}</div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachActivity() {
    $('#clear-log')?.addEventListener('click', () => {
      if (!confirm('ყველა აქტივობის წაშლა?')) return;
      clearActivityLog();
      renderSection('activity');
      toast('Activity log გასუფთავდა', 'info');
    });
  }

  // ====== SHORTCUTS HELP ======
  function renderShortcuts() {
    const shortcuts = [
      { label: 'ცვლილებების შენახვა', keys: ['Ctrl', 'S'] },
      { label: 'Publish Live', keys: ['Ctrl', 'Shift', 'P'] },
      { label: 'Dashboard-ზე გადასვლა', keys: ['G', 'D'] },
      { label: 'Services-ზე გადასვლა', keys: ['G', 'S'] },
      { label: 'Blog-ზე გადასვლა', keys: ['G', 'B'] },
      { label: 'Settings-ზე გადასვლა', keys: ['G', 'T'] },
      { label: 'Modal-ის დახურვა', keys: ['Esc'] },
      { label: 'Sidebar-ის გახსნა/დახურვა (mobile)', keys: ['Ctrl', 'M'] },
      { label: 'Preview საიტი', keys: ['Ctrl', 'E'] },
      { label: 'Export JSON', keys: ['Ctrl', 'Shift', 'E'] }
    ];
    return `
      <div class="page-header">
        <div>
          <h1>Keyboard Shortcuts</h1>
          <p>სწრაფი მუშაობისთვის</p>
        </div>
      </div>
      <div class="shortcut-grid">
        ${shortcuts.map(s => `
          <div class="shortcut-row">
            <span class="shortcut-label">${escapeHtml(s.label)}</span>
            <div class="shortcut-keys">${s.keys.map(k => `<kbd>${escapeHtml(k)}</kbd>`).join('')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ====== HELPERS ======
  function emptyState(title, desc, btnId) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(desc)}</p>
        <button class="btn btn-yellow" id="${btnId}">+ დაამატე</button>
      </div>
    `;
  }

  function attachFieldListeners() {
    $$('[data-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const path = input.dataset.field.split('.');
        let obj = state.content;
        for (let i = 0; i < path.length - 1; i++) {
          if (!obj[path[i]]) obj[path[i]] = {};
          obj = obj[path[i]];
        }
        let val = input.value;
        if (input.dataset.list !== undefined) {
          val = val.split('\n').map(l => l.trim()).filter(Boolean);
        }
        if (input.type === 'checkbox') val = input.checked;
        obj[path[path.length - 1]] = val;
        markDirty();
      });
    });
  }

  // ====== REUSABLE LANGUAGE TABS FOR ITEM MODALS ======
  // Use at the top of a modal body. translatableIds maps fieldName -> DOM element id.
  // Example: { name: 'mem-name', role: 'mem-role', bio: 'mem-bio' }
  // Non-translatable fields (photo, URL, etc) stay separate and don't need to be listed here.
  const MODAL_LANG_TABS_HTML = (() => {
    const LANGS = ['ka','en','ru','he'];
    const LBL = { ka: '🇬🇪 ქართული', en: '🇬🇧 English', ru: '🇷🇺 Русский', he: '🇮🇱 עברית' };
    return `
      <div class="modal-lang-tabs" style="display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--gray-200);">
        ${LANGS.map(l => `<button type="button" class="modal-lang-tab ${l==='ka'?'active':''}" data-modal-lang="${l}" style="padding: 10px 14px; background: ${l==='ka'?'var(--gray-100)':'transparent'}; border: none; border-bottom: 3px solid ${l==='ka'?'var(--yellow)':'transparent'}; font-weight: 600; cursor: pointer; font-family: inherit; font-size: 13px; color: ${l==='ka'?'var(--ink)':'var(--gray-500)'}; margin-bottom: -1px;">${LBL[l]}</button>`).join('')}
      </div>
    `;
  })();

  // Initialize modal lang tabs. Returns object with readDraft() and save-helper.
  function initModalLangTabs(item, translatableIds) {
    if (!item) return;
    item.i18n = item.i18n || {};
    let currentLang = 'ka';

    const readCurrentLangToDraft = () => {
      const snapshot = {};
      Object.entries(translatableIds).forEach(([field, id]) => {
        const el = document.getElementById(id);
        if (el) snapshot[field] = el.value;
      });
      if (currentLang === 'ka') {
        Object.assign(item, snapshot);
      } else {
        item.i18n[currentLang] = { ...(item.i18n[currentLang] || {}), ...snapshot };
      }
    };

    const loadLangToForm = (lang) => {
      const source = lang === 'ka' ? item : (item.i18n[lang] || {});
      Object.entries(translatableIds).forEach(([field, id]) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = source[field] || '';
          el.dir = lang === 'he' ? 'rtl' : 'ltr';
        }
      });
      document.querySelectorAll('.modal-lang-hint').forEach(el => { el.textContent = lang.toUpperCase(); });
    };

    document.querySelectorAll('.modal-lang-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        readCurrentLangToDraft();
        currentLang = btn.getAttribute('data-modal-lang');
        document.querySelectorAll('.modal-lang-tab').forEach(b => {
          const isActive = b === btn;
          b.classList.toggle('active', isActive);
          b.style.background = isActive ? 'var(--gray-100)' : 'transparent';
          b.style.borderBottomColor = isActive ? 'var(--yellow)' : 'transparent';
          b.style.color = isActive ? 'var(--ink)' : 'var(--gray-500)';
        });
        loadLangToForm(currentLang);
      });
    });

    return {
      readCurrentLangToDraft,
      // Call this before save: captures final tab state + strips empty i18n overrides
      finalize: () => {
        readCurrentLangToDraft();
        Object.keys(item.i18n).forEach(l => {
          const o = item.i18n[l];
          if (!o) { delete item.i18n[l]; return; }
          const hasAny = Object.values(o).some(v => (v || '').toString().trim());
          if (!hasAny) delete item.i18n[l];
        });
        if (!Object.keys(item.i18n).length) delete item.i18n;
      }
    };
  }

  // ====== SECTION-LEVEL LANGUAGE TABS ======
  // Usage: place a bar with `data-lang-tabs="sectionPath"` at top of a card,
  // and mark translatable inputs with `data-lang-field="field.subfield"`.
  // Non-translatable fields keep using plain `data-field`.
  //
  // Example: <input data-lang-field="title" data-section="hero" />
  // KA tab → writes to state.content.hero.title
  // EN tab → writes to state.content.hero.i18n.en.title
  function renderSectionLangTabBar(sectionPath, label) {
    const LANGS = ['ka', 'en', 'ru', 'he'];
    const FLAGS = { ka: '🇬🇪', en: '🇬🇧', ru: '🇷🇺', he: '🇮🇱' };
    const NAMES = { ka: 'ქართული (ძირითადი)', en: 'English', ru: 'Русский', he: 'עברית' };
    return `
      <div class="section-lang-bar" data-lang-tabs="${escapeHtml(sectionPath)}" style="background: var(--gray-50); border: 1px solid var(--gray-200); padding: 6px; display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 16px; align-items: center;">
        <span style="font-size: 11px; color: var(--gray-500); padding: 0 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;">${label || 'ენა'}</span>
        ${LANGS.map(l => `
          <button type="button" class="lang-btn ${l === 'ka' ? 'active' : ''}" data-lang="${l}" style="padding: 6px 12px; background: ${l === 'ka' ? 'var(--ink)' : 'white'}; color: ${l === 'ka' ? 'white' : 'var(--gray-700)'}; border: 1px solid ${l === 'ka' ? 'var(--ink)' : 'var(--gray-200)'}; font-weight: 600; font-size: 12px; cursor: pointer; font-family: inherit;">${FLAGS[l]} ${NAMES[l]}</button>
        `).join('')}
      </div>
    `;
  }

  // Hook up language tabs: rewrites data-field of translatable inputs on tab click,
  // and loads the appropriate value from state.
  function attachSectionLangTabs() {
    $$('[data-lang-tabs]').forEach(bar => {
      const sectionPath = bar.getAttribute('data-lang-tabs');
      let currentLang = 'ka';

      const getSectionObj = () => {
        const keys = sectionPath.split('.');
        let obj = state.content;
        for (const k of keys) {
          if (!obj) return null;
          obj = obj[k];
        }
        return obj || (() => {
          // Initialize if missing
          let o = state.content;
          for (const k of keys) { if (!o[k]) o[k] = {}; o = o[k]; }
          return o;
        })();
      };

      const setValueForLang = (input, lang) => {
        const fieldSub = input.getAttribute('data-lang-field');
        // Compute the actual data-field target based on current lang
        const actualPath = lang === 'ka'
          ? sectionPath + '.' + fieldSub
          : sectionPath + '.i18n.' + lang + '.' + fieldSub;
        input.setAttribute('data-field', actualPath);
        // Load current value
        const parts = actualPath.split('.');
        let v = state.content;
        for (const p of parts) { if (v == null) break; v = v[p]; }
        input.value = v == null ? '' : v;
        input.dir = lang === 'he' ? 'rtl' : 'ltr';
      };

      const applyLang = (lang) => {
        currentLang = lang;
        // Update button styles
        $$('.lang-btn', bar).forEach(b => {
          const isActive = b.getAttribute('data-lang') === lang;
          b.classList.toggle('active', isActive);
          b.style.background = isActive ? 'var(--ink)' : 'white';
          b.style.color = isActive ? 'white' : 'var(--gray-700)';
          b.style.borderColor = isActive ? 'var(--ink)' : 'var(--gray-200)';
        });
        // Reload all translatable inputs in this section
        // Scope: find the next siblings / parent's translatable inputs after this bar
        const scope = bar.parentElement;
        $$('[data-lang-field]', scope).forEach(input => setValueForLang(input, lang));
        // Hint badges (small label showing current lang)
        $$('.lang-hint-badge', scope).forEach(el => {
          el.textContent = lang.toUpperCase();
        });
      };

      // Initialize all inputs to KA
      const scope = bar.parentElement;
      $$('[data-lang-field]', scope).forEach(input => setValueForLang(input, 'ka'));

      $$('.lang-btn', bar).forEach(btn => {
        btn.addEventListener('click', () => applyLang(btn.getAttribute('data-lang')));
      });
    });
  }

  function attachImagePreview() {
    $$('[data-preview]').forEach(input => {
      input.addEventListener('input', () => {
        const preview = document.getElementById(input.dataset.preview);
        if (preview) preview.src = input.value;
      });
    });
  }

  function setupDragReorder(listId, contentKey) {
    const list = document.getElementById(listId);
    if (!list) return;
    let dragIdx = null;
    $$('.list-item', list).forEach(item => {
      item.setAttribute('draggable', 'true');
      item.addEventListener('dragstart', (e) => {
        dragIdx = parseInt(item.dataset.index);
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const targetIdx = parseInt(item.dataset.index);
        if (dragIdx === null || dragIdx === targetIdx) return;
        const arr = contentKey === 'services' ? state.content.services :
                    contentKey === 'team' ? state.content.team :
                    contentKey === 'testimonials' ? state.content.testimonials :
                    contentKey === 'faq' ? state.content.faq :
                    contentKey === 'blog' ? state.content.blog :
                    contentKey === 'industries' ? state.content.industries :
                    contentKey === 'stats' ? state.content.stats : null;
        if (!arr) return;
        const [moved] = arr.splice(dragIdx, 1);
        arr.splice(targetIdx, 0, moved);
        markDirty();
        renderSection(state.currentSection);
        toast('რიგითობა განახლდა', 'info');
      });
    });
  }

  // ====== MODAL ======
  function openModal(title, html) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = html;
    $('#modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    $$('[data-modal-cancel]').forEach(b => b.addEventListener('click', closeModal));
  }

  function closeModal() {
    $('#modal').classList.add('hidden');
    document.body.style.overflow = '';
    $('#modal-body').innerHTML = '';
  }

  // ====== INIT ======
  async function init() {
    if (!(await isAuthenticated())) {
      showLogin();
    } else {
      showApp();
    }
  }

  function showLogin() {
    $('#login-screen').classList.remove('hidden');
    $('#admin-app').classList.add('hidden');
    $('#login-password').focus();
    $('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = $('#login-password').value;
      const success = await login(pw);
      if (success) {
        showApp();
      } else {
        $('#login-error').classList.remove('hidden');
        $('#login-password').value = '';
      }
    });
  }

  async function showApp() {
    $('#login-screen').classList.add('hidden');
    $('#admin-app').classList.remove('hidden');
    state.content = loadContent();

    // ALWAYS sync from live on admin load — get latest state (preserving local changes)
    const res = await syncFromLive();
    if (res.success) {
      lastKnownUpdate = res.liveUpdated;
      if (res.hadLocalChanges) {
        toast('📥 Live sync + შენი ცვლილებები შენარჩუნდა', 'success', 4000);
      } else {
        toast('📥 Live content სინქრონიზდა', 'info', 3000);
      }
    } else {
      // Sync failed — ensure baseline exists at least
      if (!getBaseline()) setBaseline(deepClone(state.content));
      toast('⚠️ Live სინქრონიზაცია ვერ მოხერხდა. ოფლაინ რეჟიმი.', 'warning', 4000);
    }

    updateBadges();
    setupTopbar();
    setupSidebar();
    setupTopbarSheet();
    handleRoute();

    // Start auto-polling for other users' updates
    startAutoPolling();

    window.addEventListener('hashchange', handleRoute);
    // No need for beforeunload warning — changes auto-save to localStorage
  }

  function setupTopbar() {
    $('#save-btn').addEventListener('click', saveContent);
    $('#publish-btn')?.addEventListener('click', async () => {
      if (!confirm('გამოვაქვეყნო ცვლილებები საიტზე?\n\n• ფაილი შეივსება GitHub-ში\n• Vercel ავტომატურად განაახლებს საიტს\n• 30-60 წამში ცვლილებები ხილვადი იქნება ყველასთვის')) return;
      await publishToGitHub();
    });
    $('#export-btn').addEventListener('click', exportJSON);
    $('#preview-btn').addEventListener('click', () => window.open('index.html', '_blank'));
    $('#sync-btn')?.addEventListener('click', async () => {
      const btn = $('#sync-btn');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg> Sync...';
      const res = await syncFromLive();
      btn.disabled = false;
      btn.innerHTML = orig;
      if (res.success) {
        if (res.hadLocalChanges) {
          toast('✅ Sync + შენი ცვლილებები შენარჩუნდა', 'success');
        } else {
          toast('✅ Live content ჩამოიტვირთა', 'success');
        }
        renderSection(state.currentSection);
        lastKnownUpdate = res.liveUpdated;
        // Dismiss banner if any
        document.getElementById('update-banner')?.remove();
      } else {
        toast('❌ Sync ვერ მოხერხდა', 'error');
      }
    });
    $('#logout-btn').addEventListener('click', () => {
      if (state.isDirty && !confirm('გაქვს უნახავი ცვლილებები. გამოსვლა?')) return;
      logout();
    });
    $('#modal-close').addEventListener('click', closeModal);
    $('.modal-backdrop').addEventListener('click', closeModal);

    $('#import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importJSON(file);
      e.target.value = '';
    });

    // Keyboard shortcuts
    let gPressed = false;
    let gTimer = null;
    document.addEventListener('keydown', (e) => {
      const isInput = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;

      // Ctrl+S = Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        saveContent();
        return;
      }

      // Ctrl+Shift+P = Publish
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        $('#publish-btn')?.click();
        return;
      }

      // Ctrl+Shift+E = Export
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        exportJSON();
        return;
      }

      // Ctrl+E = Preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !e.shiftKey) {
        e.preventDefault();
        $('#preview-btn')?.click();
        return;
      }

      // Ctrl+M = Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        $('#sidebar-toggle')?.click();
        return;
      }

      // ESC = close modal
      if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) {
        closeModal();
        return;
      }

      // G-prefix navigation (not in inputs)
      if (isInput) return;
      if (e.key === 'g' || e.key === 'G') {
        gPressed = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => { gPressed = false; }, 1500);
        return;
      }
      if (gPressed) {
        const map = { d: 'dashboard', s: 'services', b: 'blog', t: 'settings', h: 'hero', p: 'pricing', m: 'media', e: 'seo', a: 'activity' };
        const target = map[e.key.toLowerCase()];
        if (target) {
          e.preventDefault();
          location.hash = '#' + target;
          gPressed = false;
        }
      }
    });
  }

  function setupSidebar() {
    const toggle = $('#sidebar-toggle');
    const sidebar = $('#admin-sidebar');
    const backdrop = $('#sidebar-backdrop');

    const openSidebar = () => {
      sidebar.classList.add('open');
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    };
    const closeSidebar = () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () => {
      if (sidebar.classList.contains('open')) closeSidebar(); else openSidebar();
    });
    backdrop.addEventListener('click', closeSidebar);

    // Close sidebar when a nav link is tapped on mobile
    $$('.sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const section = link.dataset.section;
        if (section) {
          location.hash = '#' + section;
        }
        if (window.innerWidth <= 1024) closeSidebar();
      });
    });

    // Close on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && sidebar.classList.contains('open')) {
        closeSidebar();
      }
    });

    // Escape key closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
    });

    // Swipe-left-to-close gesture on mobile
    let touchStartX = 0;
    let touchStartY = 0;
    sidebar.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    sidebar.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
      if (dx < -60 && dy < 40) closeSidebar();
    }, { passive: true });
  }

  function setupTopbarSheet() {
    const moreBtn = $('#topbar-more-btn');
    const sheet = $('#topbar-sheet');
    const sheetList = $('#topbar-sheet-list');
    if (!moreBtn || !sheet || !sheetList) return;

    // Build the sheet items mirroring topbar actions
    const items = [
      { id: 'sync-btn', label: 'Sync — ჩატვირთე Live-დან', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>' },
      { id: 'preview-btn', label: 'Preview — ნახე ცვლილებები', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' },
      { id: 'save-btn', label: 'Save Local — შეინახე ბრაუზერში', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' },
      { id: 'export-btn', label: 'Export JSON — ჩამოტვირთე', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>' },
      { id: 'publish-btn', label: 'Publish Live — გამოაქვეყნე საიტზე', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>', primary: true },
      { id: 'logout-btn', label: 'Logout — გამოსვლა', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>', danger: true }
    ];

    sheetList.innerHTML = items.map(it => {
      const cls = ['topbar-sheet-item'];
      if (it.primary) cls.push('is-primary');
      if (it.danger) cls.push('is-danger');
      return `<button type="button" class="${cls.join(' ')}" data-target="${it.id}">${it.icon}<span>${it.label}</span></button>`;
    }).join('');

    const openSheet = () => {
      sheet.classList.add('open');
      sheet.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const closeSheet = () => {
      sheet.classList.remove('open');
      sheet.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    moreBtn.addEventListener('click', openSheet);
    sheet.querySelectorAll('[data-close-sheet]').forEach(el => el.addEventListener('click', closeSheet));

    // Proxy clicks to the real topbar buttons
    sheetList.querySelectorAll('.topbar-sheet-item').forEach(item => {
      item.addEventListener('click', () => {
        const targetId = item.dataset.target;
        closeSheet();
        // Slight delay so the sheet animation feels responsive before the action modal appears
        setTimeout(() => {
          const target = document.getElementById(targetId);
          if (target) target.click();
        }, 150);
      });
    });

    // Swipe-down-to-close
    let touchY = 0;
    const panel = sheet.querySelector('.topbar-sheet-panel');
    if (panel) {
      panel.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
      panel.addEventListener('touchend', (e) => {
        const dy = e.changedTouches[0].clientY - touchY;
        if (dy > 80) closeSheet();
      }, { passive: true });
    }

    // Escape closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet();
    });
  }

  init();
})();
