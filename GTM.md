# SchemGuard — Go-To-Market Plan

## Product Summary
**@sethclawd/schemaguard** — CLI tool that detects breaking changes in OpenAPI specs. Free, open source, npm-installable.

- **npm:** https://www.npmjs.com/package/@sethclawd/schemaguard
- **GitHub:** https://github.com/sethclawd-prog/schemaguard
- **Install:** `npm install -g @sethclawd/schemaguard`

## How It Works (User Journey)

1. Dev team has an OpenAPI spec (most do — Swagger docs generate from these)
2. They add one line to CI: `npx @sethclawd/schemaguard ci --spec ./openapi.yaml --baseline ./baseline.yaml`
3. Every PR that touches the API gets auto-checked
4. Breaking changes → build fails with clear explanation
5. Safe changes → build passes with info summary
6. No more "oops we broke the mobile app" moments

**For AI agents:** `npm install`, call programmatically, JSON output mode. Agents validate API contracts before deploying.

## Competitive Landscape

| Tool | Price | Approach | Our Advantage |
|------|-------|----------|---------------|
| Optic | $249/mo | GUI dashboard, cloud | We're free, CLI-first, no account needed |
| Bump.sh | $149/mo | Hosted docs + diff | We run locally, no data leaves your machine |
| Akita | Deprecated | Traffic-based | We're spec-based, simpler |
| Manual review | Free | Human eyeballs | We're automated, catches what humans miss |

## Monetization Path (Future)

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | CLI tool, local use, CI integration |
| Pro | $29/mo | Hosted API, Slack alerts, changelog generation, 10 specs |
| Team | $79/mo | Org-wide monitoring, dashboard, agent API, webhook pipelines |
| Enterprise | Custom | SSO, audit logs, SLA, dedicated support |

**Free tier is the growth engine. Pro converts when teams need alerts + dashboards.**

---

## Launch Plan

### Week 1 — Seed (Awareness)

**Goal:** 500 GitHub stars, 200 npm installs

- [ ] **Reddit posts** (organic, Show-Don't-Sell style):
  - r/programming — "I built a CLI to catch API breaking changes before they hit production"
  - r/webdev — "How I stopped breaking my API consumers with one CI line"
  - r/devops — "Free tool: detect OpenAPI breaking changes in your pipeline"
  - r/node — "New npm package: OpenAPI schema drift monitor"
  - Format: Problem story → solution → terminal screenshot → link
  
- [ ] **Hacker News** — "Show HN: SchemGuard — detect breaking API changes in CI"
  - Post at 9am EST (peak HN traffic)
  - Have 2-3 accounts ready to engage in comments (NOT upvote ring — genuine discussion)
  - Respond to every comment within 1 hour

- [ ] **Dev.to article** — "Stop Breaking Your API Consumers: A CLI Approach"
  - Tutorial format with code examples
  - Show before/after terminal output
  - Include GitHub Actions setup guide

- [ ] **X/Twitter thread** — Terminal screenshot thread
  - Screenshot 1: Breaking changes detected (red ⛔)
  - Screenshot 2: Safe changes (green ✅)
  - Screenshot 3: One-line CI setup
  - Screenshot 4: "It's free, open source, npm install"
  - Tag: #openapi #devtools #cli

### Week 2 — Ecosystem (Distribution)

**Goal:** GitHub Action in marketplace, 1000 npm installs

- [ ] **GitHub Action** — `schemaguard/action@v1`
  - One-liner setup in workflows
  - Auto-detects OpenAPI spec location
  - PR comments with diff summary
  - Marketplace listing with screenshots
  - **This is the #1 growth lever** — devs discover tools through Actions marketplace

- [ ] **Curated lists:**
  - PR to awesome-openapi
  - PR to awesome-cli-apps
  - PR to awesome-devtools
  - Add to OpenAPI.tools directory

- [ ] **StackOverflow seeding:**
  - Answer questions about "detect OpenAPI breaking changes"
  - Answer "how to validate API compatibility in CI"
  - Answer "OpenAPI diff tool" questions
  - Natural, helpful answers with SchemGuard as one option

- [ ] **npm README optimization:**
  - Add badges (build, coverage, npm version)
  - Add GIF showing terminal output
  - Ensure "openapi diff breaking changes cli" keywords present

### Week 3 — Content Flywheel (SEO + Authority)

**Goal:** Organic search traffic, newsletter mentions

- [ ] **Blog post:** "OpenAPI Breaking Changes Cheat Sheet"
  - Comprehensive reference of what's breaking vs non-breaking
  - Great for SEO (people search this)
  - Naturally references SchemGuard

- [ ] **Comparison post:** "SchemGuard vs Optic vs Bump.sh"
  - Honest comparison, highlight free + CLI advantages
  - Target "optic alternative" and "openapi diff tool" keywords

- [ ] **Newsletter outreach:**
  - API Weekly
  - Postman blog / community
  - Node Weekly
  - DevOps Weekly
  - JavaScript Weekly
  - Console.dev (curated devtools)

- [ ] **Conference lightning talks:**
  - Submit to API-focused meetups
  - "5 API Breaking Changes You're Missing" format
  - Demo SchemGuard live

### Week 4+ — Conversion (Revenue)

- [ ] Add "schemaguard.dev" landing page (Pro tier waitlist)
- [ ] Implement Pro features (hosted API, Slack integration)
- [ ] Add telemetry (opt-in) to understand usage patterns
- [ ] Build dashboard for Pro users
- [ ] Stripe integration for subscriptions

---

## Key Metrics

| Metric | Week 1 | Week 4 | Month 3 |
|--------|--------|--------|---------|
| GitHub stars | 500 | 2,000 | 5,000 |
| npm weekly installs | 200 | 1,000 | 5,000 |
| GitHub Action users | — | 100 | 500 |
| Pro subscribers | — | — | 50 ($1,450 MRR) |

## The Growth Loop

```
Free CLI → GitHub Action → Runs on every PR → 
Team sees "schemaguard" in checks → More installs → 
Stars grow → HN/Reddit organic mentions → 
Pro conversion (teams wanting alerts/dashboard)
```

**The GitHub Action is the flywheel.** Once installed, it runs forever and advertises itself.
