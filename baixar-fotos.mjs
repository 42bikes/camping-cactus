#!/usr/bin/env node
/**
 * baixar-fotos.mjs
 * Baixa as fotos públicas do Camping Cactus usadas nos principais guias de
 * campings (MaCamp e 77camps) para uma pasta local de análise.
 *
 * Uso:
 *   node baixar-fotos.mjs
 *   node baixar-fotos.mjs --force   # baixa de novo mesmo se o arquivo existir
 *
 * Saída:
 *   midia/camping-cactus/77camps/*.jpg
 *   midia/camping-cactus/macamp/*.jpg
 *   midia/camping-cactus/manifest.json
 *   analise-fotos.html              (folha de contato para revisão visual)
 *
 * Observação: as imagens são de anúncios públicos do próprio camping em
 * sites de terceiros. Servem para análise interna. A publicação no site
 * exige autorização dos proprietários (ver dossie.md, checklist final).
 */

import { mkdir, writeFile, readFile, access, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, "midia", "camping-cactus");
const FORCE = process.argv.includes("--force");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const SOURCES = [
  {
    id: "77camps",
    label: "77camps",
    page: "https://www.77camps.com/camping/13516/camping-cactus",
    note: "Fotos enviadas ao guia 77camps (out/2025).",
    urls: [
      "https://ojxhebkoyscpobabbdil.supabase.co/storage/v1/object/public/camping-images/db8fa586-10a6-481e-b456-3648cb126756/13516/1761919855772-vrpayd.jpg",
      "https://ojxhebkoyscpobabbdil.supabase.co/storage/v1/object/public/camping-images/db8fa586-10a6-481e-b456-3648cb126756/13516/1761919856729-zstbka.jpg",
      "https://ojxhebkoyscpobabbdil.supabase.co/storage/v1/object/public/camping-images/db8fa586-10a6-481e-b456-3648cb126756/13516/1761919857393-wdq8xn.jpg",
      "https://ojxhebkoyscpobabbdil.supabase.co/storage/v1/object/public/camping-images/db8fa586-10a6-481e-b456-3648cb126756/13516/1761919858043-6unyrx.jpg",
    ],
  },
  {
    id: "google-maps",
    label: "Google Maps",
    page: "https://www.google.com/maps/search/?api=1&query=Camping+Cactus+Itacare",
    note: "Foto pública do perfil do camping no Google Maps (via worldorgs). Original em alta resolução.",
    urls: [
      "https://lh5.googleusercontent.com/p/AF1QipOcpxyUFA-Z7BSBcwH3uFqxVL8haRqfQlQe57Ml=s0",
    ],
  },
  {
    id: "macamp",
    label: "MaCamp",
    page: "https://macamp.com.br/guia/guia/campings/brasil/bahia/itacare/camping-cactus-do-rustico/",
    note: "Galeria do perfil no guia MaCamp (fotos de 2020).",
    urls: [
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-R%C3%BAstico-itacar%C3%A9-ba.jpg",
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-R%C3%BAstico-itacar%C3%A9-ba-2.jpg",
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-R%C3%BAstico-itacar%C3%A9-ba-3.jpeg",
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-R%C3%BAstico-itacar%C3%A9-ba-4.jpeg",
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-R%C3%BAstico-itacar%C3%A9-ba-2.jpeg",
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-R%C3%BAstico-itacar%C3%A9-ba-6.jpeg",
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-R%C3%BAstico-itacar%C3%A9-ba-7.jpg",
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-R%C3%BAstico-itacar%C3%A9-ba-60.jpeg",
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-Rustico-itacare-ba-10-scaled.jpeg",
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-Rustico-itacare-ba-11-scaled.jpeg",
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-Rustico-itacare-ba-12-scaled.jpeg",
      "https://macamp.com.br/guia/wp-content/uploads/2020/02/Camping-Cactus-do-Rustico-itacare-ba-14-scaled.jpeg",
    ],
  },
];

function extFromUrl(url, contentType = "") {
  const clean = url.split("?")[0].toLowerCase();
  const m = clean.match(/\.(jpe?g|png|webp|gif)$/);
  if (m) return m[1] === "jpeg" ? "jpg" : m[1];
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

/** Lê largura/altura de JPEG, PNG, WebP e GIF sem dependências externas. */
function imageSize(buf) {
  try {
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        const len = buf.readUInt16BE(i + 2);
        if (
          marker >= 0xc0 && marker <= 0xcf &&
          marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
        ) {
          return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
        }
        i += 2 + len;
      }
    }
    if (buf.slice(1, 4).toString() === "PNG") {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") {
      const chunk = buf.slice(12, 16).toString();
      if (chunk === "VP8X") {
        return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
      }
      if (chunk === "VP8 ") {
        return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      }
      if (chunk === "VP8L") {
        const b = buf.readUInt32LE(21);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
    }
    if (buf.slice(0, 3).toString() === "GIF") {
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
  } catch {}
  return { width: null, height: null };
}

function aspectLabel(w, h) {
  if (!w || !h) return "—";
  const r = w / h;
  if (r > 1.45) return "paisagem";
  if (r < 0.85) return "retrato";
  return "quase quadrada";
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

function slug(url) {
  const base = decodeURIComponent(url.split("?")[0].split("/").pop() || "foto")
    .replace(/\.(jpe?g|png|webp|gif)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "foto";
}

async function download(source, url, index) {
  const dir = join(OUT_DIR, source.id);
  await mkdir(dir, { recursive: true });
  const ext = extFromUrl(url);
  const name = `${source.id}-${String(index + 1).padStart(2, "0")}-${slug(url).slice(0, 48)}.${ext}`;
  const dest = join(dir, name);

  if (!FORCE && await exists(dest)) {
    const buf = await readFile(dest);
    return { path: dest, buf, cached: true };
  }

  const res = await fetch(url, {
    headers: {
      "user-agent": UA,
      referer: source.page,
      "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
      accept: "image/avif,image/webp,image/*,*/*;q=0.8",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return { path: dest, buf, cached: false };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const entries = [];
  const errors = [];

  for (const source of SOURCES) {
    console.log(`\n→ ${source.label} (${source.urls.length} URLs)`);
    for (let i = 0; i < source.urls.length; i++) {
      const url = source.urls[i];
      process.stdout.write(`  [${i + 1}/${source.urls.length}] ${slug(url).slice(0, 60)}... `);
      try {
        const { path, buf, cached } = await download(source, url, i);
        const { width, height } = imageSize(buf);
        const sha256 = createHash("sha256").update(buf).digest("hex");
        entries.push({
          file: path.replace(ROOT + "\\", "").replace(/\\/g, "/"),
          source: source.id,
          sourceLabel: source.label,
          sourcePage: source.page,
          originalUrl: url,
          width,
          height,
          aspect: aspectLabel(width, height),
          bytes: buf.length,
          sha256,
          cached,
        });
        console.log(`${cached ? "já existia" : "ok"} — ${width}×${height}, ${Math.round(buf.length / 1024)} KB`);
      } catch (err) {
        console.log(`ERRO: ${err.message}`);
        errors.push({ url, source: source.id, error: err.message });
      }
    }
  }

  // Marca duplicatas (mesmo sha256) — útil para não repetir foto na galeria.
  const byHash = new Map();
  for (const e of entries) {
    if (!byHash.has(e.sha256)) byHash.set(e.sha256, []);
    byHash.get(e.sha256).push(e.file);
  }
  for (const e of entries) e.duplicates = byHash.get(e.sha256).filter((f) => f !== e.file);

  // Descobre quais fotos já estão aplicadas na prévia comparando o hash.
  const previewHashes = new Map();
  try {
    for (const name of await readdir(join(ROOT, "preview", "assets"))) {
      if (!/\.(jpe?g|png|webp)$/i.test(name)) continue;
      const buf = await readFile(join(ROOT, "preview", "assets", name));
      previewHashes.set(createHash("sha256").update(buf).digest("hex"), name);
    }
  } catch {}

  for (const e of entries) {
    e.naPrevia = previewHashes.get(e.sha256) || null;
    if (e.naPrevia) e.papelSugerido = `Já usada na prévia como ${e.naPrevia}`;
    else if (e.aspect === "paisagem" && (e.width || 0) >= 700) e.papelSugerido = "Hero / faixa larga";
    else if (e.aspect === "retrato") e.papelSugerido = "Card vertical / seção chalés";
    else e.papelSugerido = "Galeria / card de acomodação";
    e.baixaResolucao = (e.width || 0) < 1200;
  }

  const resumo = {
    total: entries.length,
    jaNaPrevia: entries.filter((e) => e.naPrevia).length,
    paisagem: entries.filter((e) => e.aspect === "paisagem").length,
    retrato: entries.filter((e) => e.aspect === "retrato").length,
    quadradas: entries.filter((e) => e.aspect === "quase quadrada").length,
    maiores1600: entries.filter((e) => (e.width || 0) >= 1200).length,
    resolucaoMaxima: entries.reduce((acc, e) => Math.max(acc, e.width || 0, e.height || 0), 0),
  };

  const manifest = {
    cliente: "Camping Cactus",
    coletadoEm: new Date().toISOString(),
    pasta: "midia/camping-cactus",
    totalArquivos: entries.length,
    resumo,
    fontes: SOURCES.map((s) => ({ id: s.id, label: s.label, page: s.page, note: s.note })),
    avisoDeUso:
      "Fotos públicas de anúncios do camping em sites de terceiros. Uso interno para análise e proposta. Publicar no site, Google Business ou redes exige autorização dos proprietários (Nanda e Max).",
    fotos: entries,
    erros: errors,
  };
  await writeFile(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  await writeFile(join(ROOT, "analise-fotos.html"), renderHtml(manifest), "utf8");

  console.log(`\n✓ ${entries.length} fotos em ${OUT_DIR}`);
  console.log(`✓ manifest.json e analise-fotos.html gerados`);
  if (errors.length) console.log(`⚠ ${errors.length} falha(s) — veja manifest.json`);
}

function renderHtml(manifest) {
  const fotos = manifest.fotos;
  const cards = fotos.map((f, i) => {
    const kb = Math.round(f.bytes / 1024);
    const dim = f.width && f.height ? `${f.width}×${f.height}` : "—";
    const mp = f.width && f.height ? ((f.width * f.height) / 1e6).toFixed(1) : "—";
    const dup = f.duplicates.length ? `<span class="tag warn">duplicada de ${f.duplicates.map((d) => d.split("/").pop()).join(", ")}</span>` : "";
    const previewTag = f.naPrevia ? `<span class="tag ok">já usada na prévia (${f.naPrevia})</span>` : "";
    const lowRes = f.baixaResolucao ? `<span class="tag warn">largura &lt; 1200 px</span>` : "";
    return `
      <article class="card" data-source="${f.source}" data-orient="${f.aspect}" data-width="${f.width || 0}">
        <a class="shot" href="${f.file}" target="_blank" rel="noopener">
          <img src="${f.file}" alt="Foto ${i + 1} do Camping Cactus — ${f.sourceLabel}" loading="lazy" />
        </a>
        <div class="meta">
          <div class="row"><strong>${f.file.split("/").pop()}</strong><span class="badge ${f.source === "77camps" ? "b77" : "bmac"}">${f.sourceLabel}</span></div>
          <p class="role">${f.papelSugerido}</p>
          <dl>
            <div><dt>Dimensões</dt><dd>${dim} <small>(${mp} MP)</small></dd></div>
            <div><dt>Formato</dt><dd>${f.aspect}</dd></div>
            <div><dt>Peso</dt><dd>${kb} KB</dd></div>
            <div><dt>Original</dt><dd><a href="${f.originalUrl}" target="_blank" rel="noopener">abrir fonte ↗</a></dd></div>
          </dl>
          ${previewTag}${lowRes}${dup}
        </div>
      </article>`;
  }).join("");

  const summary = manifest.resumo;
  const jaNaPrevia = fotos.filter((f) => f.naPrevia).map((f) => f.naPrevia);
  const altaResolucao = fotos.filter((f) => (f.width || 0) >= 1200);
  const heroCandidates = fotos.filter((f) => !f.naPrevia && f.aspect === "paisagem" && (f.width || 0) >= 700);
  const portraitCandidates = fotos.filter((f) => !f.naPrevia && f.aspect === "retrato");
  const squareCandidates = fotos.filter((f) => !f.naPrevia && f.aspect === "quase quadrada");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Camping Cactus — análise das fotos reais</title>
<style>
  :root{--ink:#1b241c;--forest:#1e3a2d;--paper:#fbf7ef;--sand:#f3ecdf;--line:rgba(27,36,28,.14);--clay:#c06a3f;--cactus:#7f9c5b}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
  header{background:var(--forest);color:#f3ecdf;padding:34px 28px}
  header h1{margin:0 0 6px;font-size:clamp(24px,4vw,38px);letter-spacing:-.02em}
  header p{margin:0;max-width:760px;color:#cdd8c9}
  .stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
  .stat{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:8px 12px;font-size:13px}
  .stat b{font-size:18px;display:block;line-height:1.2}
  .notice{margin:0;padding:14px 28px;background:#fff3e6;border-bottom:1px solid #eed6bf;font-size:13px;color:#6b3d22}
  .diag{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;padding:20px 28px 0;max-width:1500px;margin:0 auto}
  .diag-card{background:#fffdf8;border:1px solid var(--line);border-radius:14px;padding:18px 20px}
  .diag-card h2{margin:0 0 8px;font-size:16px}
  .diag-card ul{margin:0;padding-left:18px;font-size:13px;color:#3c473b}
  .diag-card li+li{margin-top:6px}
  .diag-card a{color:var(--clay)}
  .hero-test{padding:22px 28px 0;max-width:1500px;margin:0 auto}
  .hero-test-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:10px}
  .hero-test-head h2{margin:0;font-size:16px}
  .hero-test-head p{margin:0;font-size:13px;color:#5f6b5b}
  .hero-test-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .hero-pane{position:relative;margin:0;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background-size:cover;background-position:center;border:1px solid var(--line)}
  .hero-pane::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(21,42,32,.08) 20%,rgba(21,42,32,.86) 100%)}
  .hero-pane .copy{position:absolute;left:0;right:0;bottom:0;z-index:1;padding:20px;color:#fbf7ef}
  .hero-pane .copy span{display:inline-block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:4px 8px;margin-bottom:8px}
  .hero-pane .copy strong{display:block;font-family:Georgia,"Times New Roman",serif;font-size:clamp(20px,3vw,32px);line-height:1.05;font-weight:500}
  .hero-pane .copy em{font-style:italic;color:#d8e3c8}
  @media(max-width:760px){.hero-test-grid{grid-template-columns:1fr}}
  .toolbar{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 28px;background:rgba(251,247,239,.94);border-bottom:1px solid var(--line);backdrop-filter:blur(8px)}
  .toolbar button{border:1px solid var(--line);background:#fffdf8;color:inherit;border-radius:999px;padding:7px 14px;cursor:pointer;font:inherit;font-size:13px}
  .toolbar button[aria-pressed="true"]{background:var(--forest);color:#fffdf8;border-color:var(--forest)}
  .toolbar .hint{margin-left:auto;font-size:12px;color:#6a7366}
  main{padding:22px 28px 60px;max-width:1500px;margin:0 auto}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
  .card{background:#fffdf8;border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -26px rgba(27,36,28,.4)}
  .shot{display:block;background:#e9e4d6;aspect-ratio:4/3;overflow:hidden}
  .shot img{width:100%;height:100%;object-fit:contain;background:#e9e4d6}
  .meta{padding:12px 14px 14px;display:flex;flex-direction:column;gap:8px}
  .row{display:flex;align-items:center;gap:8px;justify-content:space-between}
  .row strong{font-size:12px;letter-spacing:.01em;word-break:break-all}
  .badge{font-size:10px;text-transform:uppercase;letter-spacing:.08em;padding:3px 7px;border-radius:999px;background:var(--sand);white-space:nowrap}
  .badge.bmac{background:#e4e9d8;color:#41522f}
  .badge.b77{background:#f0e1d6;color:#7b4326}
  dl{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px}
  dl div{display:flex;flex-direction:column}
  dt{color:#74806f;font-size:10px;text-transform:uppercase;letter-spacing:.07em}
  dd{margin:0}
  dd a{color:var(--clay)}
  .role{margin:0;font-size:10px;color:#5f6b5b;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
  .tag{font-size:11px;color:#7b4326;background:#f6e4d8;border-radius:6px;padding:3px 6px;display:inline-block}
  .tag.warn{background:#ffe9cf;color:#8a4b12}
  .tag.ok{background:#e3efdc;color:#2f5a2c}
  .empty{padding:40px;text-align:center;color:#74806f}
  @media(max-width:560px){header,.notice,.toolbar,main{padding-left:16px;padding-right:16px}.toolbar .hint{display:none}}
</style>
</head>
<body>
<header>
  <h1>Camping Cactus — fotos reais</h1>
  <p>Imagens públicas coletadas dos perfis do camping no MaCamp, no 77camps e no Google Maps. Use esta folha para escolher o que entra na prévia do site e o que precisa ser refeito no ensaio de 1h.</p>
  <div class="stats">
    <div class="stat"><b>${summary.total}</b>fotos baixadas</div>
    <div class="stat"><b>${summary.jaNaPrevia}</b>já estão na prévia</div>
    <div class="stat"><b>${summary.paisagem}</b>paisagem</div>
    <div class="stat"><b>${summary.retrato}</b>retrato</div>
    <div class="stat"><b>${summary.quadradas}</b>quase quadradas</div>
    <div class="stat"><b>${summary.resolucaoMaxima} px</b>maior lado disponível</div>
  </div>
</header>
<p class="notice"><strong>Uso interno.</strong> ${manifest.avisoDeUso}</p>
<section class="diag">
  <div class="diag-card">
    <h2>Diagnóstico técnico</h2>
    <ul>
      <li><strong>${summary.jaNaPrevia} fotos do 77camps já são as da prévia</strong> (hash idêntico): ${jaNaPrevia.join(", ")}.</li>
      <li>As demais vêm do MaCamp (2020), do 77camps e do Google Maps e ampliam a variedade. Maior lado disponível: <strong>${summary.resolucaoMaxima} px</strong>.</li>
      <li>${altaResolucao.length
        ? `<strong>${altaResolucao.length} foto em alta resolução</strong> (${altaResolucao[0].width}×${altaResolucao[0].height}, Google Maps) — única candidata real para hero em tela grande e Open Graph 1200×630. Confirmar autoria antes de publicar.`
        : "<strong>Nenhuma foto chega a 1200 px</strong> — não há imagem ideal para hero em telas grandes nem para Open Graph 1200×630."}</li>
      <li>As fotos de 512–800 px funcionam em cards e miniaturas; no hero aparecem suaves/pixelizadas em monitores grandes. O ensaio de 1h continua recomendado.</li>
      <li>Antes de publicar, conferir se o conteúdo de cada foto corresponde ao texto alternativo (barraca, chalé, motorhome).</li>
    </ul>
  </div>
  <div class="diag-card">
    <h2>Onde testar na prévia</h2>
    <ul>
      <li><strong>Hero:</strong> ${heroCandidates.length ? heroCandidates.map((f) => f.file.split("/").pop()).join(", ") : "sem candidata larga de 700 px+"}.</li>
      <li><strong>Cards de acomodação:</strong> ${squareCandidates.length ? squareCandidates.slice(0, 4).map((f) => f.file.split("/").pop()).join(", ") : "sem candidatas quadradas"}.</li>
      <li><strong>Seção chalés / cards verticais:</strong> ${portraitCandidates.length ? portraitCandidates.slice(0, 4).map((f) => f.file.split("/").pop()).join(", ") : "sem candidatas retrato"}.</li>
      <li><strong>Galeria nova:</strong> usar as ${fotos.length} fotos como teste de variedade, com legendas neutras até o ensaio.</li>
      <li><a href="preview/index.html" target="_blank" rel="noopener">Abrir a prévia do site ↗</a> (com o servidor local ligado).</li>
    </ul>
  </div>
</section>
${altaResolucao.length ? `
<section class="hero-test">
  <div class="hero-test-head">
    <h2>Teste de hero</h2>
    <p>Mesmo recorte 16:9, mesmo overlay e mesma headline — compare a nitidez e o enquadramento antes de trocar na prévia.</p>
  </div>
  <div class="hero-test-grid">
    <figure class="hero-pane" style="background-image:url('preview/assets/cactus-1.jpg')">
      <div class="copy"><span>Hoje · cactus-1 (512×384)</span><strong>Seu quintal<br /><em>em Itacaré.</em></strong></div>
    </figure>
    <figure class="hero-pane" style="background-image:url('${altaResolucao[0].file}')">
      <div class="copy"><span>Teste · Google Maps (${altaResolucao[0].width}×${altaResolucao[0].height})</span><strong>Seu quintal<br /><em>em Itacaré.</em></strong></div>
    </figure>
  </div>
</section>` : ""}
<div class="toolbar" role="group" aria-label="Filtrar fotos">
  <button type="button" data-filter="all" aria-pressed="true">Todas</button>
  <button type="button" data-filter="paisagem">Paisagem</button>
  <button type="button" data-filter="retrato">Retrato</button>
  <button type="button" data-filter="quase%20quadrada">Quase quadradas</button>
  <button type="button" data-filter="grandes">700 px+</button>
  <span class="hint">Clique numa foto para abrir em tamanho real</span>
</div>
<main>
  <div class="grid" id="grid">${cards || '<p class="empty">Nenhuma foto baixada.</p>'}</div>
</main>
<script>
  const grid = document.getElementById('grid');
  const buttons = [...document.querySelectorAll('[data-filter]')];
  buttons.forEach((btn) => btn.addEventListener('click', () => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    const f = btn.dataset.filter;
    [...grid.children].forEach((card) => {
      let show = true;
      if (f === 'grandes') show = Number(card.dataset.width) >= 700;
      else if (f !== 'all') show = card.dataset.orient === decodeURIComponent(f);
      card.style.display = show ? '' : 'none';
    });
  }));
</script>
</body>
</html>`;
}

main().catch((err) => {
  console.error("✗ Erro:", err.message);
  process.exit(1);
});
