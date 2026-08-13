import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Plugin } from "vite";

const WEB_PUBLIC_UNIVERSITIES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../web/public/universities",
);

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg|avif)$/i;

/** Dev-only: serve catalog logos from apps/web/public/universities */
function universityMediaStaticPlugin(): Plugin {
  return {
    name: "university-media-static",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!url.startsWith("/universities/") || !IMAGE_EXT.test(url)) {
          next();
          return;
        }

        const filePath = path.join(WEB_PUBLIC_UNIVERSITIES, url.replace(/^\/universities\//, ""));
        if (!filePath.startsWith(WEB_PUBLIC_UNIVERSITIES) || !fs.existsSync(filePath)) {
          next();
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const types: Record<string, string> = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
          ".gif": "image/gif",
          ".svg": "image/svg+xml",
          ".avif": "image/avif",
        };
        res.setHeader("Content-Type", types[ext] ?? "application/octet-stream");
        res.setHeader("Cache-Control", "no-cache");
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

/** Dev-only middleware: POST /__dev/scaffold-university-media */
function universityMediaScaffoldPlugin(): Plugin {
  return {
    name: "university-media-scaffold",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/__dev/scaffold-university-media" || req.method !== "POST") {
          next();
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const { scaffoldUniversityFolders } = await import(
              "../../web/scripts/lib/ensure-university-folders.mjs"
            );
            const parsed = JSON.parse(body || "{}") as { name?: string; slug?: string };
            const result = scaffoldUniversityFolders({
              name: parsed.name ?? "",
              slug: parsed.slug ?? "",
            });
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
          }
        });
      });
    },
  };
}

export { universityMediaScaffoldPlugin, universityMediaStaticPlugin };
