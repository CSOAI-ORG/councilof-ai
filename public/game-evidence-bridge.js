/* Council game -> workspace candidate bridge.
 *
 * Nothing runs automatically. A game calls `CouncilEvidence.offer()` only from
 * an explicit "review candidate" button. The small observation is posted to the
 * same-origin dashboard or held in same-origin localStorage for the next load.
 * No network request, GSPC write, signing claim, or training consent happens here.
 */
(function () {
  "use strict";

  var TYPE = "csoai:candidate-observation";
  var KEY = "coai.candidate.pending.v1";

  function text(value, cap) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, cap);
  }

  function finite(value, min, max) {
    return typeof value === "number" && isFinite(value) && value >= min && value <= max
      ? value
      : undefined;
  }

  function normalize(raw) {
    raw = raw && typeof raw === "object" ? raw : {};
    var surface = text(raw.surface, 80);
    var activity = text(raw.activity, 80);
    var sourcePath = text(raw.sourcePath || location.pathname, 180);
    var instrumentKey = text(raw.instrumentKey, 80);
    var instrumentId = text(raw.instrumentId, 180);
    var instrumentVersion = text(raw.instrumentVersion, 80);
    var instrumentDigest = text(raw.instrumentDigest, 64).toLowerCase();
    if (!surface || !activity || sourcePath.charAt(0) !== "/" || !instrumentKey ||
        !instrumentId || !instrumentVersion || !/^[0-9a-f]{64}$/.test(instrumentDigest)) return null;
    var observation = {
      surface: surface,
      activity: activity,
      sourcePath: sourcePath,
      instrumentKey: instrumentKey,
      instrumentId: instrumentId,
      instrumentVersion: instrumentVersion,
      instrumentDigest: instrumentDigest,
      completed: raw.completed === true,
    };
    var axis = text(raw.axis, 60);
    var mode = text(raw.mode, 40);
    var metric = text(raw.metric, 40);
    var score = finite(raw.score, 0, 1);
    var n = finite(raw.n, 0, 100000);
    var correct = finite(raw.correct, 0, 100000);
    var answered = finite(raw.answered, 0, 100000);
    var unparsed = finite(raw.unparsed, 0, 100000);
    if (axis) observation.axis = axis;
    if (mode) observation.mode = mode;
    if (metric) observation.metric = metric;
    if (score !== undefined) observation.score = score;
    if (n !== undefined) observation.n = n;
    if (correct !== undefined) observation.correct = correct;
    if (answered !== undefined) observation.answered = answered;
    if (unparsed !== undefined) observation.unparsed = unparsed;
    if (Array.isArray(raw.limitations)) {
      observation.limitations = raw.limitations
        .map(function (item) { return text(item, 120); })
        .filter(Boolean)
        .slice(0, 4);
    }
    return observation;
  }

  function offer(raw) {
    var observation = normalize(raw);
    if (!observation) return false;
    var message = { type: TYPE, observation: observation };
    if (window.parent !== window) {
      window.parent.postMessage(message, window.location.origin);
      return true;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(message));
      window.location.assign("/dashboard?tab=play&candidate=pending");
      return true;
    } catch (_) {
      return false;
    }
  }

  window.CouncilEvidence = Object.freeze({ offer: offer });
})();
