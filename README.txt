FINRISE ASSETS ADMIN PWA

Upload every file in this folder to the SAME directory on your HTTPS website:
- admin.html
- manifest.webmanifest
- service-worker.js
- offline.html
- finrise-logo.png
- favicon.ico and PNG icon files

Open https://your-domain/admin.html in a supported browser. On Android Chrome, use the browser menu and choose "Install app" or "Add to Home screen" when offered.

Important:
- The PWA uses the exact original FINRISE ASSETS logo embedded in the uploaded admin.html.
- The service worker caches only the static app shell and logo/icon files. It does NOT cache Supabase requests, authentication traffic, or live admin data.
- The admin panel still requires internet access for sign-in and live data. Offline mode shows an explanatory page.
- Serve the site over HTTPS. Keep all package files together in the same directory.
