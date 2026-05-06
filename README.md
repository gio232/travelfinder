# Travel Intel (NOMAD OS)

**Status**: Lightweight API-First Architecture
**Goal**: Identify high-yield travel combos (Flights + Hotels) with zero local CPU overhead.

### 🚀 Architecture Strategy (v2.0)
1. **No Browser Automation**: Local Playwright/Puppeteer discarded due to resource intensity and CAPTCHA issues.
2. **API-First**: Focus on Direct HTTP Requests and specialized data aggregators (RapidAPI, Amadeus, etc.).
3. **Cloud-Native**: Scraper logic runs on external servers (Render/Railway) to keep the user's laptop cool.
4. **Intelligent Analysis**: Sentiment analysis of reviews and price prediction via lightweight logic.

