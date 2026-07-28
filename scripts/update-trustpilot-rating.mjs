#!/usr/bin/env node
/**
 * Refreshes the Trustpilot rating shown on the site.
 *
 * Reads the score from Trustpilot's official Business Units API and rewrites
 * the text of every element marked `data-trustpilot-rating` in the HTML.
 *
 * Why the API and not the public profile page: uk.trustpilot.com sits behind
 * a bot-protection challenge and returns 403 to any script, so scraping it
 * cannot work and getting round that is not something we should build. The
 * API is the supported route and needs a key from the Trustpilot business
 * account that owns the profile.
 *
 *   TRUSTPILOT_API_KEY=xxx node scripts/update-trustpilot-rating.mjs
 *
 * Env:
 *   TRUSTPILOT_API_KEY  required, from the Trustpilot business dashboard
 *   TRUSTPILOT_DOMAIN   optional, defaults to joinstored.com
 *   MIN_REVIEWS         optional, defaults to 1. Below this the run fails
 *                       rather than publishing a rating built on too few
 *                       reviews to mean anything.
 *   TRUSTPILOT_API_BASE optional, for pointing at a stub when testing
 *
 * Fails safe: on any error it writes nothing and exits non-zero, so a bad
 * API response can never blank or corrupt the rating on a live page.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOMAIN = process.env.TRUSTPILOT_DOMAIN || 'joinstored.com';
const API_KEY = process.env.TRUSTPILOT_API_KEY;
const MIN_REVIEWS = Number(process.env.MIN_REVIEWS || 1);
const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'assets', 'css', 'js', 'scripts']);

function die(message) {
  console.error(`trustpilot: ${message}`);
  process.exit(1);
}

/** Ask Trustpilot for the business unit and return its displayed score. */
async function fetchRating() {
  const base = process.env.TRUSTPILOT_API_BASE || 'https://api.trustpilot.com';
  const url = `${base}/v1/business-units/find?name=${encodeURIComponent(DOMAIN)}&apikey=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });

  if (!res.ok) {
    die(`API returned HTTP ${res.status}. Nothing was changed.`);
  }

  const data = await res.json();
  // Trustpilot shows trustScore (e.g. 4.8); stars is the rounded half-star.
  const score = data?.score?.trustScore;
  const reviews = data?.numberOfReviews?.total ?? 0;

  if (typeof score !== 'number' || !Number.isFinite(score) || score < 1 || score > 5) {
    die(`API gave no usable score (got ${JSON.stringify(score)}). Nothing was changed.`);
  }
  if (reviews < MIN_REVIEWS) {
    die(`only ${reviews} review(s), below MIN_REVIEWS=${MIN_REVIEWS}. Nothing was changed.`);
  }

  return { rating: score.toFixed(1), reviews };
}

/** Every .html file in the site, ignoring build and asset directories. */
async function htmlFiles(dir = ROOT, found = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await htmlFiles(path, found);
    else if (entry.name.endsWith('.html')) found.push(path);
  }
  return found;
}

// Matches the text inside any element carrying the marker attribute.
const MARKER = /(<([a-zA-Z][\w-]*)[^>]*\sdata-trustpilot-rating[^>]*>)([^<]*)(<\/\2>)/g;

async function main() {
  if (!API_KEY) die('TRUSTPILOT_API_KEY is not set. Nothing was changed.');

  const { rating, reviews } = await fetchRating();
  const files = await htmlFiles();
  const changed = [];
  let marked = 0;

  for (const file of files) {
    const before = await readFile(file, 'utf8');
    if (!before.includes('data-trustpilot-rating')) continue;

    const after = before.replace(MARKER, (match, open, tag, text, close) => {
      marked += 1;
      return text.trim() === rating ? match : `${open}${rating}${close}`;
    });

    if (after !== before) {
      await writeFile(file, after);
      changed.push(relative(ROOT, file));
    }
  }

  if (!marked) die('no data-trustpilot-rating markers found. Nothing was changed.');

  console.log(`trustpilot: ${DOMAIN} is ${rating} from ${reviews} review(s)`);
  console.log(changed.length ? `trustpilot: updated ${changed.join(', ')}` : 'trustpilot: already up to date');
}

main().catch((err) => die(err.message));
