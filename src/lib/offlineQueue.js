// src/lib/offlineQueue.js
//
// Client-side only. Stores queued ball events in localStorage so taps made
// while offline survive a page refresh and get flushed once back online.
// No npm package needed - crypto.randomUUID() is built into modern browsers.

function queueKey(matchId) {
  return `turfscore_queue_${matchId}`;
}

/**
 * Adds a new event to the local queue for a given match.
 * Generates a sequenceId for the event so the server can dedupe it later.
 * Returns the event that was queued (including its new sequenceId).
 */
export function enqueue(matchId, event) {
  const queue = getQueue(matchId);

  const queuedEvent = {
    ...event,
    sequenceId: event.sequenceId || crypto.randomUUID(),
  };

  queue.push(queuedEvent);
  localStorage.setItem(queueKey(matchId), JSON.stringify(queue));

  return queuedEvent;
}

/**
 * Returns the current queued events for a match (oldest first).
 * Returns an empty array if nothing is queued or localStorage is
 * unavailable (e.g. server-side render).
 */
export function getQueue(matchId) {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(queueKey(matchId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Removes events from the queue whose sequenceId is in flushedIds
 * (i.e. the server has confirmed it received and applied them).
 * Any event NOT in flushedIds stays in the queue for the next retry.
 */
export function clearFlushed(matchId, flushedIds) {
  const queue = getQueue(matchId);
  const remaining = queue.filter((event) => !flushedIds.includes(event.sequenceId));
  localStorage.setItem(queueKey(matchId), JSON.stringify(remaining));
  return remaining;
}

/**
 * Wipes the entire queue for a match. Use with care - mainly useful for
 * the "abandon match" / reset flows in later phases.
 */
export function clearQueue(matchId) {
  localStorage.removeItem(queueKey(matchId));
}