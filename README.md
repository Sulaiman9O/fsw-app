# FSW workshop app

Phone app for Fast Service World (Ibra). First module: oil change price calculator.

- `src/` app source. Run `python3 build.py` to rebuild `docs/app/`.
- `docs/` is served from raw.githubusercontent.com. Installed apps download new code (`docs/app/`) and prices (`docs/data/prices.json`) from there and keep working offline with the last copy.
- `docs/data/prices.json` is written every morning from the workshop system. Selling prices only, no cost.
- APK: built by GitHub Actions. Latest: https://github.com/Sulaiman9O/fsw-app/releases/latest/download/fsw.apk
- A new APK is only needed when the Android shell changes (`docs/index.html`, icons, config).
