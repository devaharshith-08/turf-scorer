// src/hooks/useOfflineSync.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { enqueue, getQueue, clearFlushed } from '@/lib/offlineQueue';

/**
 * Manages the offline queue + sync-on-reconnect for one match's scoring UI.
 *
 * Usage in the umpire scoring page:
 *   const { isOnline, pendingCount, enqueueEvent, flushNow } = useOfflineSync(matchId);
 *   ...
 *   enqueueEvent({ type: 'run', runs: 1, batsmanOnStrike, bowler });
 *
 * DESIGN NOTE: this hook owns BOTH enqueueing and flushing (not just
 * flushing) so that `pendingCount` always stays accurate. If you call
 * offlineQueue.enqueue() directly from somewhere else, this hook's
 * pendingCount won't know about it until the next flush/poll - so prefer
 * calling enqueueEvent() from here instead, in the scoring UI.
 */
export function useOfflineSync(matchId) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Initialize state on mount (avoids SSR mismatch - navigator/localStorage
  // don't exist on the server).
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPendingCount(getQueue(matchId).length);
  }, [matchId]);

  const flushNow = useCallback(async () => {
    const queue = getQueue(matchId);
    if (queue.length === 0) return;

    const umpireToken = localStorage.getItem(`umpireToken_${matchId}`);
    if (!umpireToken) {
      // No token means we're not the umpire on this device - don't attempt.
      return;
    }

    try {
      const response = await fetch(`/api/match/${matchId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ umpireToken, events: queue }),
      });

      if (!response.ok) {
        // Server rejected the batch (bad token, validation error, etc).
        // Leave the queue intact - don't lose taps - and let the umpire UI
        // surface the error from the response if it wants to.
        return;
      }

      const data = await response.json();

      // Server is expected to echo back which sequenceIds it actually
      // applied (see Step 5 API route). Fall back to "assume all applied"
      // if that field is missing, to avoid an infinite re-send loop.
      const appliedIds = data.appliedSequenceIds || queue.map((e) => e.sequenceId);

      const remaining = clearFlushed(matchId, appliedIds);
      setPendingCount(remaining.length);
      return data;
    } catch {
      // Network dropped again mid-flush - queue stays as-is, next online
      // event or manual flushNow() call will retry.
    }
  }, [matchId]);

  const enqueueEvent = useCallback(
    async (event) => {
      enqueue(matchId, event);
      setPendingCount(getQueue(matchId).length);

      if (navigator.onLine) {
       return await flushNow();
      }
    },
    [matchId, flushNow]
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      flushNow();
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Catch the case where the page loads already online with a stale
    // queue from a previous offline session.
    if (navigator.onLine) {
      flushNow();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushNow]);

  return { isOnline, pendingCount, enqueueEvent, flushNow };
}