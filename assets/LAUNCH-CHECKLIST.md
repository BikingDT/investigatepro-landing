# InvestigatePro Marketing Launch Checklist

## Quick Reference: What's Ready & How to Deploy

---

## Phase 1: Immediate (This Week)

### Email Infrastructure ✅ Already Done
- [x] Resend configured
- [x] hello@investigatepro.app working
- [x] Webhook receiving replies

### Website Updates
- [ ] Add FAQ content to site (`faq-content.md`)
- [ ] Add pricing page content (`pricing-page-content.md`)
- [ ] Add "Why InvestigatePro" page (`why-investigatepro-page.md`)
- [ ] Upload ROI Calculator (`lead-magnets/roi-calculator.html`)
- [ ] Add case studies section

### Lead Magnets Live
- [ ] Host ROI Calculator at `/calculator`
- [ ] Verify ICAM Toolkit PDF download works
- [ ] Verify PEEPO Quick Reference download works

---

## Phase 2: Week 1 Launch

### Cold Outreach (Start Immediately)
**File:** `email-sequences/cold-outreach-sequence.md`

1. [ ] Load 226 existing leads into sending tool
2. [ ] Segment by industry (Mining, Construction, Manufacturing)
3. [ ] Personalize Email 1 with industry/company details
4. [ ] Schedule send: Tuesday-Thursday, 8-10 AM recipient time
5. [ ] Set up reply monitoring

**Target:** 50 leads/week, 7-email sequence over 25 days

### LinkedIn Launch
**File:** `social/linkedin-posts.md`

1. [ ] Schedule Post #1 for Monday 8 AM
2. [ ] Schedule Post #2 for Wednesday 8 AM
3. [ ] Schedule Post #3 for Friday 9 AM
4. [ ] Set 30-min engagement block after each post
5. [ ] Repeat weekly

**Posting Schedule:**
- Mon/Wed/Fri for first 2 weeks
- Carousels on Wednesdays
- Threads on Thursdays (Twitter)

### Twitter/X Launch
**File:** `social/twitter-threads-expanded.md`

1. [ ] Post Thread #1 on Thursday
2. [ ] Space tweets 1-2 minutes apart
3. [ ] Engage with replies
4. [ ] Post 1 thread per week

---

## Phase 3: Week 2-4

### Trial Onboarding Automation
**File:** `email-sequences/trial-onboarding-sequence.md`

1. [ ] Set up automation trigger: New trial signup
2. [ ] Load 11-email sequence
3. [ ] Configure send timing (Days 0,1,2,3,4,5,6,7,10,13,14)
4. [ ] Test full sequence with dummy account

### Lead Nurture Automation
**File:** `email-sequences/lead-nurture-sequence.md`

1. [ ] Set up automation trigger: Downloaded resource but no trial
2. [ ] Load 12-week sequence
3. [ ] Configure weekly sends (Tuesday 9 AM)
4. [ ] Set up move to monthly newsletter after Week 12

### Industry Pages
**Files:** `industry-pages/*.md`

1. [ ] Build Mining landing page at `/mining`
2. [ ] Build Construction landing page at `/construction`
3. [ ] Build Manufacturing landing page at `/manufacturing`
4. [ ] Build Oil & Gas landing page at `/oil-gas`
5. [ ] Link from main navigation

---

## Phase 4: Month 2

### Paid Advertising
**Files:** `ads/linkedin-ad-copy.md`, `ads/google-ad-copy.md`

**LinkedIn Ads:**
1. [ ] Create Campaign Manager account
2. [ ] Set up conversion tracking (trial signup, demo booking)
3. [ ] Create 3 ad variations for A/B test
4. [ ] Target: Safety Directors, HSE Managers, 200-10K employees
5. [ ] Budget: $50/day initial test
6. [ ] Run 2 weeks, optimize winners

**Google Ads:**
1. [ ] Create Google Ads account
2. [ ] Set up conversion tracking
3. [ ] Campaign 1: ICAM Software (high intent)
4. [ ] Campaign 2: Incident Investigation Software (broad)
5. [ ] Budget: $50/day initial test

### Webinar
**File:** `webinar-outline.md`

1. [ ] Pick date (4 weeks out minimum)
2. [ ] Set up webinar platform (Zoom/WebinarJam)
3. [ ] Create registration page
4. [ ] Promote via email + social (2 weeks before)
5. [ ] Deliver webinar
6. [ ] Follow-up sequence to attendees

### Video Production
**Files:** `video-scripts/*.md`

1. [ ] Record 60-second explainer (animated or screen capture)
2. [ ] Record 3-minute product demo
3. [ ] Record 5 LinkedIn talking head videos
4. [ ] Edit and publish

---

## Phase 5: Month 3+

### Partnership Program
**Files:** `partnerships/*.md`

1. [ ] Build affiliate signup page
2. [ ] Set up tracking/attribution (Rewardful, FirstPromoter, or custom)
3. [ ] Create partner dashboard
4. [ ] Reach out to ICAM trainers, safety consultants
5. [ ] Launch customer referral program

### Case Studies (Real)
1. [ ] Identify 2-3 early customers willing to share results
2. [ ] Conduct interviews using `video-scripts/customer-testimonial-template.md`
3. [ ] Write up case studies
4. [ ] Replace/supplement example case studies

### Content Calendar Execution
**File:** `content-calendar-90-day.md`

1. [ ] Follow weekly content schedule
2. [ ] Track performance metrics
3. [ ] Double down on what works
4. [ ] Adjust based on results

---

## Quick Wins (Do Today)

1. **Post first LinkedIn post** — Copy from `linkedin-posts.md` Post #1
2. **Send cold email batch 1** — 10-20 personalized emails using sequence
3. **Upload ROI calculator** — Easy lead magnet, high value
4. **Schedule 5 LinkedIn posts** — Week 1 covered

---

## Tools Needed

| Purpose | Options | Status |
|---------|---------|--------|
| Email sending | Resend (configured) | ✅ |
| Email sequences | Resend + custom / Loops / Mailchimp | ⬜ |
| Social scheduling | Buffer / Hootsuite / Later | ⬜ |
| LinkedIn automation | Native scheduling (free) | ✅ |
| CRM | Notion / Airtable / HubSpot Free | ⬜ |
| Analytics | Google Analytics | ⬜ |
| Webinar | Zoom (existing?) / Cal.com | ⬜ |

---

## Success Metrics (30 Days)

| Metric | Target |
|--------|--------|
| Cold emails sent | 200 |
| Email reply rate | 15%+ |
| LinkedIn followers gained | 100 |
| LinkedIn post impressions | 5,000 |
| Website traffic increase | 50% |
| Trial signups | 15 |
| Demo bookings | 10 |
| Paid conversions | 2-3 |

---

## Files Reference

```
~/investigatepro-landing/assets/
├── ads/                      # LinkedIn + Google ad copy
├── case-studies/             # Mining, Construction, Manufacturing
├── email-sequences/          # Cold, Nurture, Welcome, Trial
├── industry-pages/           # 4 vertical landing pages
├── lead-magnets/             # ROI calc, PEEPO, ICAM toolkit
├── partnerships/             # Affiliate, Referral, Consultant
├── sales/                    # Battle cards, Demo script
├── social/                   # LinkedIn posts, carousels, Twitter
├── video-scripts/            # Explainer, Demo, Testimonial, Talking heads
├── content-calendar-90-day.md
├── faq-content.md
├── pricing-page-content.md
├── webinar-outline.md
└── why-investigatepro-page.md
```

---

## Questions Before Launch

1. Which email tool for sequences? (Loops, Mailchimp, custom?)
2. CRM preference? (Track leads, demo calls, pipeline)
3. LinkedIn - personal profile or company page first?
4. Budget for paid ads? ($0 organic only vs $50-100/day test?)
5. Webinar date target?

---

Ready when you are! 🚀
