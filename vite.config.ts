import tailwindcss from "@tailwindcss/vite";
import { config as loadEnv } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import metadata from "./public/oauth-client-metadata.json";

// Load environment variables from .env file
loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));

const SERVER_HOST = process.env.SERVER_HOST || "127.0.0.1";
const SERVER_PORT = parseInt(process.env.SERVER_PORT || "13213");
const PUBLIC_HOSTNAME = process.env.PUBLIC_HOSTNAME;

export default defineConfig({
  resolve: {
    alias: {
      // Allow importing from @atcute/oauth-browser-client/dist/dpop.js
      "@atcute/oauth-browser-client/dist/dpop.js": fileURLToPath(
        new URL("./node_modules/@atcute/oauth-browser-client/dist/dpop.js", import.meta.url),
      ),
    },
  },
  plugins: [
    tailwindcss(),
    solidPlugin(),
    // Injects OAuth-related variables
    {
      name: "oauth",
      config(_conf, { command }) {
        // Require PUBLIC_HOSTNAME for production builds
        if (command === "build" && !PUBLIC_HOSTNAME) {
          throw new Error("PUBLIC_HOSTNAME environment variable is required for production builds");
        }

        if (PUBLIC_HOSTNAME) {
          // Use public hostname (production or tunneled dev)
          const clientIdUrl = `https://${PUBLIC_HOSTNAME}/oauth-client-metadata.json`;
          const redirectUrl = `https://${PUBLIC_HOSTNAME}/`;

          process.env.VITE_OAUTH_CLIENT_ID = clientIdUrl;
          process.env.VITE_OAUTH_REDIRECT_URL = redirectUrl;
          process.env.VITE_CLIENT_URI = `https://${PUBLIC_HOSTNAME}`;
        } else {
          // Use localhost loopback for local dev
          const redirectUri = `http://${SERVER_HOST}:${SERVER_PORT}/`;

          const clientId =
            `http://localhost` +
            `?redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=${encodeURIComponent(metadata.scope)}`;

          process.env.VITE_DEV_SERVER_PORT = "" + SERVER_PORT;
          process.env.VITE_OAUTH_CLIENT_ID = clientId;
          process.env.VITE_OAUTH_REDIRECT_URL = redirectUri;
          process.env.VITE_CLIENT_URI = `http://${SERVER_HOST}:${SERVER_PORT}`;
        }

        process.env.VITE_OAUTH_SCOPE = metadata.scope;
      },
    },
    // Transform oauth-client-metadata.json to replace placeholder
    {
      name: "transform-oauth-metadata",
      configureServer(server) {
        // Serve transformed oauth-client-metadata.json in dev mode
        server.middlewares.use((req, res, next) => {
          if (req.url === "/oauth-client-metadata.json") {
            const filePath = join(__dirname, "public", "oauth-client-metadata.json");
            let content = readFileSync(filePath, "utf-8");

            if (PUBLIC_HOSTNAME) {
              content = content.replace(
                /PUBLIC_HOSTNAME_PLACEHOLDER/g,
                `https://${PUBLIC_HOSTNAME}`,
              );
            }

            res.setHeader("Content-Type", "application/json");
            res.end(content);
            return;
          }
          next();
        });
      },
      closeBundle() {
        // Replace in built file for production
        if (!PUBLIC_HOSTNAME) return;

        const distPath = join(__dirname, "dist", "oauth-client-metadata.json");
        try {
          const content = readFileSync(distPath, "utf-8");
          const replaced = content.replace(
            /PUBLIC_HOSTNAME_PLACEHOLDER/g,
            `https://${PUBLIC_HOSTNAME}`,
          );
          writeFileSync(distPath, replaced, "utf-8");
        } catch (err) {
          console.warn("Could not update oauth-client-metadata.json:", err);
        }
      },
    },
  ],
  server: {
    host: SERVER_HOST,
    port: SERVER_PORT,
    fs: {
      strict: false,
    },
    allowedHosts: PUBLIC_HOSTNAME ? [PUBLIC_HOSTNAME] : [],
  },
  build: {
    target: "esnext",
  },
});
