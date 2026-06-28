// src/hooks/usePusherChannel.js
"use client";

import { useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusherClient";

/**
 * Subscribes to a Pusher channel and binds event handlers for the
 * lifetime of the component. Unbinds and unsubscribes automatically
 * on unmount or when channelName changes.
 *
 * @param {string} channelName - e.g. `match-${matchId}` or `global-matches`
 * @param {Object} eventHandlers - map of eventName -> handler function
 *   e.g. { "match-update": (payload) => { ... } }
 */
export function usePusherChannel(channelName, eventHandlers) {
  // Keep the latest handlers in a ref so the effect below doesn't need
  // to re-run (and re-subscribe) just because a handler function's
  // identity changed on re-render — only channelName re-running matters.
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    if (!channelName) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    const eventNames = Object.keys(handlersRef.current);

    // Bind a stable wrapper per event name, so unbind() in cleanup
    // removes exactly what we bound, even though handlersRef.current
    // may have changed by the time cleanup runs.
    const boundWrappers = {};
    eventNames.forEach((eventName) => {
      const wrapper = (payload) => {
        const currentHandler = handlersRef.current[eventName];
        if (currentHandler) currentHandler(payload);
      };
      boundWrappers[eventName] = wrapper;
      channel.bind(eventName, wrapper);
    });

    return () => {
      eventNames.forEach((eventName) => {
        channel.unbind(eventName, boundWrappers[eventName]);
      });
      pusher.unsubscribe(channelName);
    };
  }, [channelName]);
}