import crypto from "crypto";

/**
 * Generates a short, URL-friendly unique match ID.
 * Example: "a3f9c21b8e4d"
 */
export function generateMatchId() {
  return crypto.randomBytes(6).toString("hex");
}

/**
 * Generates a longer, secret umpire token.
 * This is never shown publicly — only the umpire's browser holds it.
 */
export function generateUmpireToken() {
  return crypto.randomBytes(24).toString("hex");
}