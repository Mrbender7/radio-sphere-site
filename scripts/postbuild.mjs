// Post-build script: copy 404.html, generate sitemap, copy .well-known
import { copyFileSync, mkdirSync, writeFileSync, existsSync, cpSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, "../dist");

// 1. Copy index.html -> 404.html for GitHub Pages SPA fallback
const indexHtml = resolve(dist, "index.html");
const notFoundHtml = resolve(dist, "404.html");
if (existsSync(indexHtml)) {
  copyFileSync(indexHtml, notFoundHtml);
  console.log("✓ Copied index.html → 404.html");
}

// 2. Copy .well-known directory
const wellKnownSrc = resolve(__dirname, "../public/.well-known");
const wellKnownDest = resolve(dist, ".well-known");
if (existsSync(wellKnownSrc)) {
  mkdirSync(wellKnownDest, { recursive: true });
  cpSync(wellKnownSrc, wellKnownDest, { recursive: true });
  console.log("✓ Copied .well-known/");
}

// 3. Generate sitemap.xml
const routes = ["/", "/search", "/library", "/about", "/privacy"];
const domain = "https://radiosphere.be";
const priorities = { "/": "1.0", "/search": "0.8", "/library": "0.7", "/about": "0.7", "/privacy": "0.3" };
const freqs = { "/": "daily", "/search": "daily", "/library": "weekly", "/about": "monthly", "/privacy": "yearly" };

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${domain}${r === "/" ? "/" : r}</loc>
    <changefreq>${freqs[r] || "monthly"}</changefreq>
    <priority>${priorities[r] || "0.5"}</priority>
  </url>`).join("\n")}
</urlset>
`;

writeFileSync(resolve(dist, "sitemap.xml"), sitemap);
console.log("✓ Generated sitemap.xml");

// 4. Copy CNAME if exists
const cname = resolve(__dirname, "../CNAME");
if (existsSync(cname)) {
  copyFileSync(cname, resolve(dist, "CNAME"));
  console.log("✓ Copied CNAME");
}

console.log("✓ Post-build complete!");
