// src/lib/pusherClient.js
import Pusher from "pusher-js";

// Singleton — if every component created its own Pusher instance,
// you'd get multiple duplicate WebSocket connections to the same channels.
let pusherClientInstance;

export function getPusherClient() {
  if (!pusherClientInstance) {
    pusherClientInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
  }
  return pusherClientInstance;
}