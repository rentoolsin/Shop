import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            // "prompt": a new service worker installs and waits in the background;
            // the app decides when to activate it (see usePwaUpdate.ts, which shows
            // a "New version available" toast instead of silently reloading under
            // the user mid-session).
            registerType: "prompt",
            includeAssets: ["favicon.ico", "apple-touch-icon.png"],
            manifest: {
                name: "RenTools — Construction Tool & Equipment Rental",
                short_name: "RenTools",
                description: "Rent construction tools and equipment in Coimbatore. Browse tools, check daily rates, and enquire by call or WhatsApp.",
                start_url: "/",
                scope: "/",
                display: "standalone",
                // Matches the app's light-mode background (see index.css / tailwind graphite-50);
                // the OS uses this behind the splash screen before the app's own theme resolves.
                background_color: "#F7F7F5",
                theme_color: "#121214",
                icons: [
                    { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                    { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
                    { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
                ],
            },
            workbox: {
                // Public catalog pages are safe to precache/serve-stale; admin routes hit
                // Supabase directly and are excluded from the SW's own asset glob (the JS
                // chunks are still cached for offline app-shell load, only navigation
                // fallback is scoped to avoid serving a stale admin shell over live data).
                navigateFallbackDenylist: [/^\/admin/],
                globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
            },
            devOptions: {
                enabled: false,
            },
        }),
    ],
    server: {
        port: 5173,
    },
    build: {
        target: "es2020",
        sourcemap: true,
        rollupOptions: {
            output: {
                // Keep the big, rarely-changing libraries in their own chunks so the
                // entry chunk stays small (under Vite's 500 kB warning) and returning
                // visitors only re-download app code after a deploy, not React or
                // Supabase. Phosphor icons are deliberately left out: the admin area
                // is lazy-loaded, and forcing every icon into one shared chunk would
                // make public visitors download admin-only icons too.
                manualChunks: function (id) {
                    var path = id.replace(/\\/g, "/");
                    if (!path.includes("/node_modules/"))
                        return undefined;
                    if (/\/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(path)) {
                        return "react-vendor";
                    }
                    if (/\/node_modules\/(@supabase\/|iceberg-js\/)/.test(path)) {
                        return "supabase";
                    }
                    return undefined;
                },
            },
        },
    },
});
