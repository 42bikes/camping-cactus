#!/usr/bin/env node
/**
 * scrape-instagram.mjs
 * Coleta metadados públicos de um perfil do Instagram.
 *
 * Uso:
 *   node scrape-instagram.mjs camping_cactus
 *   node scrape-instagram.mjs camping_cactus --html
 *
 * Requer Node 18+.
 *
 * Limitações (importantes):
 * - O Instagram bloqueia IPs de datacenter com frequência (401/429).
 * - Este script lê apenas o que é público: nome, bio, seguidores, foto e
 *   shortcodes dos posts recentes. Legendas completas exigem login ou API paga.
 * - Rode da sua máquina/residência, não de servidor.
 * - Para uso comercial em escala, use a API oficial ou um serviço (Apify, RapidAPI).
 */

import { writeFile } from "node:fs/promises";

const username = (process.argv[2] || "").replace(/^@/, "").trim();
const saveHtml = process.argv.includes("--html");

if (!username) {
  console.error("Uso: node scrape-instagram.mjs <usuario> [--html]");
  process.exit(1);
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const url = `https://www.instagram.com/${username}/`;

function decodeEntities(s = "") {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\\u00e9/g, "é")
    .replace(/\\u00e1/g, "á")
    .replace(/\\u00ed/g, "í")
    .replace(/\\u00f3/g, "ó")
    .replace(/\\u00fa/g, "ú")
    .replace(/\\u00e3/g, "ã")
    .replace(/\\u00f5/g, "õ")
    .replace(/\\u00e7/g, "ç")
    .replace(/\\n/g, "\n");
}

function meta(html, prop) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
    "i"
  );
  const m = html.match(re) || html.match(alt);
  return m ? decodeEntities(m[1]) : null;
}

function firstMatch(html, patterns) {
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

function uniq(arr) {
  return [...new Set(arr)];
}

async function main() {
  console.log(`→ Buscando @${username}...`);

  const res = await fetch(url, {
    headers: {
      "user-agent": UA,
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    console.error(`✗ Instagram respondeu ${res.status} ${res.statusText}.`);
    console.error(
      "  Provável bloqueio de IP. Tente da sua rede residencial, com outro user-agent, ou use a API oficial."
    );
    process.exit(2);
  }

  const html = await res.text();

  if (saveHtml) {
    await writeFile(`instagram-${username}.html`, html, "utf8");
    console.log(`  HTML salvo em instagram-${username}.html`);
  }

  const blocked = /httpErrorPage|LoginAndSignupPage/i.test(html);
  if (blocked) {
    console.warn(
      "⚠ O Instagram devolveu a página de erro/login (bloqueio de IP).\n" +
        "  O HTML foi salvo para diagnóstico, mas não há metadados para extrair.\n" +
        "  Alternativas:\n" +
        "   1. Rode da sua rede residencial (não de VPS/datacenter).\n" +
        "   2. Abra o perfil no navegador logado e copie a bio manualmente.\n" +
        "   3. Use uma API paga (Apify Instagram Scraper, RapidAPI) para posts e legendas.\n" +
        "   4. Use `instaloader --login SEU_USUARIO camping_cactus` (requer login)."
    );
  }

  const description = meta(html, "og:description");
  const title = meta(html, "og:title");
  const image = meta(html, "og:image");

  // Bio: aparece no JSON embutido em algumas versões da página pública.
  const bio = firstMatch(html, [
    /"biography":"((?:\\.|[^"\\])*)"/,
    /"biography":\s*"((?:\\.|[^"\\])*)"/,
  ]);

  // Seguidores: JSON estruturado ou texto do meta description.
  const followers =
    firstMatch(html, [
      /"edge_followed_by":\s*\{\s*"count":\s*(\d+)/,
      /([\d.,]+)\s*Followers/i,
      /([\d.,]+)\s*seguidores/i,
    ]) || null;

  const following =
    firstMatch(html, [
      /"edge_follow":\s*\{\s*"count":\s*(\d+)/,
      /([\d.,]+)\s*Following/i,
      /([\d.,]+)\s*seguindo/i,
    ]) || null;

  // Shortcodes de posts recentes (p/ e reel/).
  const posts = uniq(
    [...html.matchAll(/\/(?:p|reel)\/([A-Za-z0-9_-]{5,})/g)].map((m) => m[1])
  ).slice(0, 24);

  const data = {
    username,
    url,
    blocked,
    collectedAt: new Date().toISOString(),
    title: title ? decodeEntities(title) : null,
    description: description ? decodeEntities(description) : null,
    bio: bio ? decodeEntities(bio) : null,
    followers: followers ? Number(String(followers).replace(/[.,]/g, "")) : null,
    following: following ? Number(String(following).replace(/[.,]/g, "")) : null,
    profileImage: image ? decodeEntities(image) : null,
    recentPostShortcodes: posts,
    recentPostUrls: posts.map((code) => `https://www.instagram.com/p/${code}/`),
    note:
      "Metadados públicos. Legendas completas, comentários e insights exigem login ou API paga.",
  };

  const file = `instagram-${username}.json`;
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");

  console.log(`✓ Salvo em ${file}`);
  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error("✗ Erro:", err.message);
  process.exit(1);
});
