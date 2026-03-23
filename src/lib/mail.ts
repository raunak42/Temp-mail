import { nanoid } from "nanoid";
import { env } from "@/lib/env";

const adjectives = [
  "amber",
  "atlas",
  "brisk",
  "cinder",
  "clear",
  "delta",
  "ember",
  "fable",
  "glint",
  "harbor",
  "lumen",
  "mosaic",
  "north",
  "signal",
  "tidal",
  "velvet",
];

const nouns = [
  "bay",
  "deck",
  "forge",
  "frame",
  "grid",
  "inbox",
  "jet",
  "relay",
  "room",
  "stack",
  "thread",
  "vault",
  "vector",
  "watch",
  "wire",
  "yard",
];

export function buildEmailAddress(localPart: string) {
  return `${localPart}@${env.emailDomain}`;
}

export function normalizeLocalPart(value: string) {
  return value.trim().toLowerCase();
}

export function isValidLocalPart(value: string) {
  return /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(value);
}

export function generateLocalPart() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = nanoid(4).toLowerCase();

  return `${adjective}.${noun}.${suffix}`;
}

export function parseAddress(input: string) {
  const match = input.match(/^(?:"?([^"]*)"?\s)?<?([^<>@\s]+@[^<>@\s]+)>?$/);

  if (!match) {
    return {
      name: null,
      email: input.trim().toLowerCase(),
    };
  }

  const name = match[1]?.trim() || null;
  const email = match[2].trim().toLowerCase();

  return { name, email };
}

export function extractSnippet(text: string | null, html: string | null) {
  const source =
    text?.replace(/\s+/g, " ").trim() ??
    html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ??
    "";

  return source.slice(0, 180);
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function makeId() {
  return crypto.randomUUID();
}
