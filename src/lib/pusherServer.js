// src/lib/pusherServer.js
import Pusher from "pusher";

// Singleton pattern — same idea as dbConnect.js.
// Avoids creating a new Pusher instance on every API route invocation.
let pusherServerInstance;

function getPusherServer() {
  if (!pusherServerInstance) {
    pusherServerInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusherServerInstance;
}

/**
 * Broadcasts a match-specific update to spectators/umpire-panel
 * watching this match. Keep payload small (<5KB per NFR).
 */
export async function triggerMatchUpdate(matchId, payload) {
  const pusher = getPusherServer();
  await pusher.trigger(`match-${matchId}`, "match-update", payload);
}

/**
 * Broadcasts a status-change event to the dashboard so a match
 * can move between Live/Recent containers without a page refresh.
 * Only call this when status actually changes (not on every ball).
 */
export async function triggerGlobalUpdate(payload) {
  const pusher = getPusherServer();
  await pusher.trigger("global-matches", "global-update", payload);
}