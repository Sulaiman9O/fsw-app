# Tests (Playwright, headless Chromium)
Serve the built app first, in the same command: `(cd ../www && python3 -m http.server 8811 &) ; sleep 1; node crawl.js`
- crawl.js / crawl2.js / crawlw.js: every screen, Arabic/English, light/dark, worker role — page errors, overflow, untranslated text
- flow.js: job → invoice → payments → return/refund → credit
- t31/t39/t41/t48: two-device sync with the Firestore mock (fbmock.js); sqlmock.js = encrypted SQLite mock
- t49–t53: oil-filter "fits" fix, quick-price filter accuracy vs real invoices, filter choice, back navigation
t50–t52 read the customer/parts JSON exports from /mnt/user-data/outputs (never commit those files).
