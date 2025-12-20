# Legal Considerations for Web Scraping

**Document Purpose:** Legal analysis and risk assessment for VoseMovies' web scraping practices
**Last Updated:** November 11, 2025
**Status:** Advisory / Risk Assessment

⚠️ **DISCLAIMER:** This document provides general information and risk assessment. It is NOT legal advice. Consult a qualified intellectual property lawyer in Spain/EU for specific legal counsel before public release.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Legal Framework](#legal-framework)
3. [Risk Assessment](#risk-assessment)
4. [Mitigation Strategies](#mitigation-strategies)
5. [Recommendations by Risk Tolerance](#recommendations-by-risk-tolerance)
6. [Pre-Launch Action Items](#pre-launch-action-items)
7. [Post-Launch Strategy](#post-launch-strategy)
8. [Worst-Case Scenarios](#worst-case-scenarios)
9. [Legal Precedents](#legal-precedents)
10. [Resources](#resources)

---

## Executive Summary

### Current Legal Status: 🟡 **GRAY AREA**

Web scraping for VoseMovies sits in a legal gray zone. While likely permissible under current law, it carries some risk.

**Quick Assessment:**
- **Legality**: Likely legal (public data, no explicit laws violated)
- **Risk Level**: Low-to-Medium
- **Primary Risks**: Terms of Service violations, Database Rights claims (EU)
- **Recommended Approach**: Moderate precautions with ethical practices
- **Legal Action Likelihood**: Low (but cease & desist possible)

**Bottom Line:** Proceed with caution, implement ethical scraping, be prepared to pivot if challenged.

---

## Legal Framework

### Applicable Laws

#### 1. EU/Spain (Primary Jurisdiction)

**Database Directive (96/9/EC)**
- Protects databases created with "substantial investment"
- Cinema showtime databases may qualify
- **Risk**: Claims of "substantial extraction" of data
- **Defense**: Public information, insubstantial extraction, transformative use

**Copyright Law**
- Cinema names, showtime arrangements might be argued as copyrighted
- **Risk**: Weak - factual information not typically copyrightable
- **Defense**: Facts not copyrightable, fair use, attribution provided

**GDPR (General Data Protection Regulation)**
- **Risk**: None - No personal data scraped
- **Status**: ✅ Compliant (privacy-first design)

**Spanish Intellectual Property Law**
- Similar to EU framework
- Public information generally accessible
- **Risk**: Database rights, potential unfair competition claims

#### 2. Contract Law (Terms of Service)

**Binding Agreements**
- Website Terms of Service may prohibit automated access
- Violating ToS = breach of contract
- **Risk**: Cease & desist letters, injunctions (rare: damages)
- **Defense**: No account created, shrink-wrap terms questionable enforceability

#### 3. Computer Misuse Laws

**EU Cybercrime Directive**
- Prohibits unauthorized access to computer systems
- **Risk**: Low - publicly accessible data, no authentication bypass
- **Defense**: No unauthorized access, publicly available information

---

## Risk Assessment

### ✅ Factors in Your Favor

#### 1. Public Information
- Showtimes intentionally made public
- No authentication/login required
- Same data visible to any website visitor
- **Legal Basis**: Public domain information

#### 2. Non-Commercial Purpose
- Free app, no subscription fees
- Not competing with cinemas
- Not selling tickets (just linking)
- **Legal Basis**: Transformative use, public benefit

#### 3. Respectful Scraping Practices
- Rate limiting implemented (15 req/min, recommend lower)
- Delays between requests
- Caching to minimize server load
- User-Agent identifies as browser
- **Legal Basis**: Good faith, no server damage

#### 4. Attribution and Links
- Direct links to cinema websites
- Proper attribution of data sources
- Drives traffic BACK to cinemas
- **Legal Basis**: Fair dealing, no passing off

#### 5. Consumer Benefit
- Provides public service
- Aggregates fragmented information
- Helps underserved VOSE audience
- **Legal Basis**: Public interest, informational purpose

#### 6. No Personal Data
- Only public showtime data
- GDPR not applicable
- No user tracking
- **Legal Basis**: GDPR compliance

### ⚠️ Risk Factors

#### 1. Terms of Service Violations
**Status:** ⚠️ **UNKNOWN - MUST CHECK**

Need to verify:
```
CineCiutat ToS: https://cineciutat.org/[terms-page]
Aficine ToS: https://aficine.com/[terms-page]
```

Common prohibitions:
- "No automated access"
- "No scraping or bots"
- "No data extraction"

**If prohibited:**
- Clear ToS violation
- Breach of contract claim possible
- Injunction risk (though rare)

**Mitigation:**
- Check ToS before launch
- Contact cinemas for permission
- Implement opt-out mechanism

#### 2. No Permission Obtained
**Risk:** Medium

- Haven't asked cinemas for consent
- Could be perceived as hostile
- May damage potential partnerships

**Mitigation:**
- Email cinemas explaining project
- Emphasize mutual benefits
- Offer formal data sharing agreement

#### 3. Database Rights (EU Directive 96/9/EC)
**Risk:** Medium-Low

Cinema databases may be protected if:
- "Substantial investment" in creation
- Regular updates and maintenance
- Organized structure

**Defense:**
- Insubstantial extraction (small portion)
- Public information nature
- No commercial competition

**Precedent:** Ryanair v PR Aviation (2015) - EU Court limited database rights for public data

#### 4. Technical Measures Circumvention
**Risk:** Low-Medium

Using Selenium to render JavaScript:
- Could be seen as bypassing technical measures
- Not as clear-cut as breaking encryption

**Defense:**
- Standard browser behavior simulation
- No actual security bypass
- Publicly accessible content

#### 5. Economic Impact
**Risk:** Low

Cinemas might claim:
- Loss of website traffic
- Reduced ad revenue
- Unfair competition

**Defense:**
- Linking back to cinema websites
- Driving VOSE-interested traffic
- No ticket sales competition

---

## Mitigation Strategies

### Immediate Pre-Launch Actions

#### 1. Check robots.txt (CRITICAL)
```bash
curl https://cineciutat.org/robots.txt
curl https://aficine.com/robots.txt
```

**What to look for:**
```
User-agent: *
Disallow: /en/movies
Disallow: /billboard
```

**Action:**
- If scraping is disallowed → MUST respect or risk clear violation
- If allowed or silent → Proceed with caution
- Document findings

**Current scrapers to check:**
- CineCiutat: `/en/movies`
- Aficine: `/en/billboard/original-version-v-o-s-e/`

#### 2. Review Terms of Service
**Required reading:**
- [ ] CineCiutat Terms of Service
- [ ] Aficine Terms of Service

**Look for clauses:**
- Automated access
- Scraping or bots
- Data extraction
- Commercial use restrictions

**Document findings:**
- Screenshot relevant sections
- Note date reviewed
- Keep record of ToS version

#### 3. Implement Stricter Rate Limiting
**Current:** 15 requests/minute
**Recommended:** 6 requests/minute (1 every 10 seconds)

```python
# scrapers/aficine_scraper.py (line 40)
self.rate_limiter = RateLimiter(requests_per_minute=6)  # Was 15

# Add to all scrapers
import time
time.sleep(10)  # 10 seconds between requests
```

**Rationale:**
- More respectful to servers
- Shows good faith
- Reduces detection risk

#### 4. Increase Scraper Interval
**Current:** Every 4 hours
**Recommended:** Every 6-8 hours

```bash
# In cron job or scheduler
# Old: 0 */4 * * * ./run-scrapers.sh
# New: 0 */6 * * * ./run-scrapers.sh
```

**Rationale:**
- Showtimes don't change hourly
- Reduces server load
- Demonstrates necessity (not excessive scraping)

#### 5. Add Aggressive Caching
```python
# api/routers/showtimes.py
# Increase cache TTL from 1 hour to 6 hours
@lru_cache(maxsize=128, ttl=21600)  # 6 hours
```

**Rationale:**
- Minimize scraping frequency
- Serve cached data to users
- Reduce dependency on live scraping

#### 6. Add Legal Disclaimers

**Update TERMS_OF_SERVICE.md:**
```markdown
## Data Sources and Web Scraping

VoseMovies aggregates publicly available cinema showtime information
from the following sources:
- CineCiutat (https://cineciutat.org)
- Aficine (https://aficine.com)

### Scraping Practices
This data is:
- Publicly accessible to all internet users
- Not behind authentication or paywalls
- Used for informational purposes only
- Properly attributed with links to original sources

We implement ethical scraping practices:
✅ Respect robots.txt directives
✅ Rate limiting to avoid server overload (6 requests/minute max)
✅ Aggressive caching to minimize requests
✅ User-Agent identification (not hiding automation)
✅ No circumvention of technical protection measures
✅ Scraping frequency limited to every 6 hours

### Opt-Out for Cinema Operators
If you represent a cinema and wish to have your data removed
from VoseMovies, please contact: legal@vosemovies.com

We will remove your data within 24 hours of request.
```

**Update README.md:**
```markdown
## Legal Compliance

### Web Scraping Ethics
This app aggregates publicly available showtime data using ethical practices:

- ✅ **Respect robots.txt** - Honor all directives
- ✅ **Polite scraping** - Rate limits (6 req/min), delays, caching
- ✅ **Attribution** - Direct links to cinema websites
- ✅ **No authentication bypass** - Public data only
- ✅ **Opt-out mechanism** - Cinema operators can request removal

**Cinema operators:** Contact legal@vosemovies.com if you have concerns.

**Data sources:**
- CineCiutat: https://cineciutat.org
- Aficine: https://aficine.com
```

#### 7. Add Prominent Attribution in App

**In ShowtimesScreen.tsx:**
```typescript
// Add footer to showtime list
<View style={styles.attribution}>
  <Text style={styles.attributionText}>
    Data provided by CineCiutat and Aficine
  </Text>
  <TouchableOpacity onPress={() => Linking.openURL('https://cineciutat.org')}>
    <Text style={styles.link}>Visit CineCiutat →</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={() => Linking.openURL('https://aficine.com')}>
    <Text style={styles.link}>Visit Aficine →</Text>
  </TouchableOpacity>
</View>
```

---

## Recommendations by Risk Tolerance

### Option 1: Conservative Approach (Lowest Risk)

**Philosophy:** Get explicit permission before scraping

**Steps:**
1. ✅ Email each cinema BEFORE launch with formal request:
   ```
   Subject: Permission Request - VOSE Movie Aggregation App

   Dear [Cinema Management],

   We are developing VoseMovies, a free mobile app to help
   English-speaking residents and tourists in the Balearic
   Islands find VOSE (original version) movie showtimes.

   We would like to feature [Cinema Name] by aggregating your
   publicly available showtime information. This would:
   - Drive VOSE-interested customers to your cinema
   - Provide free marketing to the English-speaking community
   - Include direct links to your website for ticket purchases

   May we have your permission to include your showtime data?

   We are open to:
   - Formal data sharing agreement
   - API access (if available)
   - Partnership opportunities

   Thank you for your consideration.

   Best regards,
   [Your Name]
   VoseMovies
   ```

2. ✅ Wait for responses (2-4 weeks)
3. ✅ Only scrape cinemas that approve
4. ✅ Get written agreements if possible
5. ✅ Consider API partnerships

**Pros:**
- ✅ Legally bulletproof
- ✅ Potential for partnerships
- ✅ Formal relationships with cinemas
- ✅ No risk of legal action

**Cons:**
- ❌ Delays launch significantly
- ❌ May be denied/ignored
- ❌ Administrative burden
- ❌ Reduces cinema coverage

**Recommended for:** Commercial ventures, enterprise deployment, risk-averse developers

---

### Option 2: Moderate Approach (Balanced) ⭐ **RECOMMENDED**

**Philosophy:** Proceed ethically, seek forgiveness not permission, be responsive

**Steps:**

**Pre-Launch:**
1. ✅ Check robots.txt and respect fully (CRITICAL)
2. ✅ Review ToS and note any restrictions
3. ✅ Implement stricter rate limiting (6 req/min)
4. ✅ Reduce scraper frequency (every 6-8 hours)
5. ✅ Add prominent attribution in app and docs
6. ✅ Add legal disclaimers to Terms of Service
7. ✅ Implement opt-out mechanism
8. ✅ Document all practices

**At Launch:**
9. ✅ Launch with ethical scraping practices
10. ✅ Monitor for any complaints/requests

**Post-Launch (Week 2-4):**
11. ✅ Email cinemas with courtesy notification:
    ```
    Subject: VoseMovies - Featuring [Cinema Name]

    Dear [Cinema Management],

    We recently launched VoseMovies, a free mobile app that helps
    English-speaking residents and tourists find VOSE movies in
    the Balearic Islands.

    We're featuring [Cinema Name] and your VOSE showings. The app:
    - Drives VOSE-interested customers to your cinema
    - Provides direct links to your website
    - Properly attributes all data

    We aggregate publicly available showtime information using
    ethical practices (rate limiting, caching, respecting robots.txt).

    We'd love to:
    - Formalize this relationship
    - Discuss API access if available
    - Explore partnership opportunities
    - Feature your cinema more prominently

    If you have any concerns or would prefer not to be included,
    please let us know and we'll remove your data within 24 hours.

    Thank you for offering VOSE films to our community!

    Best regards,
    [Your Name]
    VoseMovies
    ```

12. ✅ Be prepared to remove cinema data if requested
13. ✅ Offer partnerships/API access discussions

**Pros:**
- ✅ Faster to market
- ✅ Shows good faith
- ✅ Reasonable risk
- ✅ Potential for partnerships
- ✅ Responsive to concerns

**Cons:**
- ⚠️ Small risk of cease & desist
- ⚠️ May need to remove cinemas
- ⚠️ Uncertainty period

**Recommended for:** Independent developers, open source projects, community-focused apps

---

### Option 3: Aggressive Approach (Highest Risk) ❌ **NOT RECOMMENDED**

**Philosophy:** Launch first, deal with complaints later

**Steps:**
1. ❌ Launch without checking ToS
2. ❌ Ignore robots.txt directives
3. ❌ High scraping frequency (no rate limiting)
4. ❌ Minimal attribution
5. ❌ Wait for complaints to react

**Pros:**
- Fastest to market
- No delays

**Cons:**
- ❌ Legal exposure
- ❌ Ethical concerns
- ❌ Reputation damage
- ❌ Potential injunctions
- ❌ May need to shut down entirely
- ❌ Difficult to build partnerships after
- ❌ Bad precedent for community

**Recommended for:** Nobody - this is irresponsible

---

## Pre-Launch Action Items

### Critical (Must Do Before Launch)

- [ ] **Check robots.txt for all cinemas**
  ```bash
  curl https://cineciutat.org/robots.txt
  curl https://aficine.com/robots.txt
  # Document results with date checked
  ```

- [ ] **Review Terms of Service**
  - [ ] CineCiutat ToS
  - [ ] Aficine ToS
  - [ ] Screenshot relevant sections
  - [ ] Note any scraping prohibitions

- [ ] **Update rate limiting**
  ```python
  # Change from 15 to 6 requests/minute
  RateLimiter(requests_per_minute=6)
  ```

- [ ] **Add legal disclaimers**
  - [ ] Update TERMS_OF_SERVICE.md
  - [ ] Update README.md
  - [ ] Add opt-out section

- [ ] **Add attribution in app**
  - [ ] Footer with "Data provided by..."
  - [ ] Links to cinema websites
  - [ ] Visible on main screen

- [ ] **Implement opt-out mechanism**
  - [ ] Create legal@vosemovies.com email
  - [ ] Document removal process (24-hour SLA)
  - [ ] Prepare removal script

### High Priority (Strongly Recommended)

- [ ] **Reduce scraper frequency**
  - [ ] Change from 4 hours to 6-8 hours
  - [ ] Update cron jobs
  - [ ] Update documentation

- [ ] **Increase caching**
  - [ ] Backend API cache: 6 hours
  - [ ] Frontend cache: 24 hours stale
  - [ ] Serve stale data when possible

- [ ] **Create response templates**
  - [ ] Cease & desist response
  - [ ] Opt-out confirmation
  - [ ] Partnership inquiry response

- [ ] **Consult lawyer (optional but wise)**
  - [ ] Find IP lawyer in Spain/Mallorca
  - [ ] Cost: €300-500 for opinion
  - [ ] Ask specific questions about your implementation

### Medium Priority (Good Practice)

- [ ] **Prepare partnership outreach**
  - [ ] Draft courtesy email to cinemas
  - [ ] Create partnership proposal deck
  - [ ] Identify contact persons at each cinema

- [ ] **Monitor for contact attempts**
  - [ ] Set up legal@vosemovies.com
  - [ ] Check daily for first 2 weeks
  - [ ] Respond within 24 hours

- [ ] **Document everything**
  - [ ] Keep logs of all scraping activity
  - [ ] Screenshot robots.txt at launch
  - [ ] Save ToS versions
  - [ ] Record any communications

---

## Post-Launch Strategy

### Week 1: Monitor
- Check legal@vosemovies.com daily
- Monitor for any complaints
- Watch for unusual traffic patterns
- Check if any cinema has blocked your scraper

### Week 2-4: Courtesy Outreach
- Email all cinemas with courtesy notification (see template above)
- Emphasize benefits: free marketing, VOSE audience
- Offer partnerships and API discussions
- Be gracious and respectful

### Month 2+: Build Relationships
- Follow up with responsive cinemas
- Offer "Featured Cinema" promotions
- Discuss formal data sharing agreements
- Explore API access opportunities
- Consider revenue sharing models (if monetizing)

### Ongoing: Compliance
- Re-check robots.txt quarterly
- Review ToS updates
- Maintain ethical scraping practices
- Respond to all requests within 24 hours
- Keep legal documentation current

---

## Worst-Case Scenarios & Response Plans

### Scenario 1: Cease & Desist Letter

**What it is:**
- Formal legal demand to stop scraping
- Usually from cinema's lawyer
- Threatens legal action if non-compliant

**Response Plan:**
1. **Immediate (Same Day):**
   - Stop scraping that cinema immediately
   - Remove their data from database
   - Update frontend to exclude them
   - Deploy backend changes

2. **Within 24 Hours:**
   - Respond professionally to sender:
     ```
     Dear [Lawyer/Cinema],

     Thank you for bringing this to our attention. We have
     immediately ceased all data collection from [Cinema]
     and removed all existing data from our platform.

     VoseMovies is a non-commercial project aimed at helping
     the VOSE-interested community. We apologize for any
     concern this may have caused.

     We would be happy to discuss alternative arrangements,
     including API access or formal data sharing agreements.

     Sincerely,
     [Your Name]
     ```
   - Document all actions taken
   - Consult lawyer if threats are serious

3. **Follow-Up:**
   - Offer to meet/discuss
   - Propose partnership alternative
   - Request specific concerns
   - Keep communication open

**Cost:** €0 (compliance) to €1,000+ (if lawyer needed)

---

### Scenario 2: Terms of Service Violation Claim

**What it is:**
- Cinema claims you violated their website ToS
- Breach of contract allegation
- May demand damages or injunction

**Response Plan:**
1. **Assess Claim:**
   - Review ToS section cited
   - Determine if violation is clear
   - Check if ToS was visible/agreed to

2. **Respond Professionally:**
   ```
   We acknowledge your concern regarding Terms of Service
   compliance. We have immediately ceased data collection
   from your website.

   We note that:
   - We never created an account or logged in
   - Data scraped was publicly accessible
   - We implemented ethical practices (rate limiting, attribution)

   However, we respect your position and have removed all
   your data from our platform.

   We'd welcome discussion of alternative arrangements that
   comply with your preferences.
   ```

3. **Pivot:**
   - Remove cinema data
   - Document ToS terms for future reference
   - Consult lawyer if damages claimed

**Defense:**
- No account created (questionable ToS acceptance)
- Public information exception
- Good faith compliance efforts

---

### Scenario 3: Database Rights Claim (EU)

**What it is:**
- Cinema claims database protection under EU Directive 96/9/EC
- Alleges "substantial investment" in creating database
- Claims your scraping is "substantial extraction"

**Response Plan:**
1. **Initial Assessment:**
   - Is the database truly substantial?
   - Is your extraction substantial?
   - Consult IP lawyer (critical for this scenario)

2. **Legal Defense Arguments:**
   - Data is publicly available factual information
   - Extraction is insubstantial (small portion)
   - Transformative use (different purpose)
   - Public interest / consumer benefit
   - Precedent: Ryanair v PR Aviation (EU case)

3. **Settlement Options:**
   - Cease scraping and remove data
   - Negotiate licensing agreement
   - Pay nominal fee for access
   - Develop API partnership

**Cost:** €2,000-10,000+ for legal defense

**Likelihood:** Low (expensive for cinema, uncertain outcome)

---

### Scenario 4: Criminal Complaint (Extremely Unlikely)

**What it is:**
- Cinema files criminal complaint for unauthorized computer access
- Claims violation of Computer Misuse Act / Cybercrime laws

**Response Plan:**
1. **Immediate:**
   - Stop ALL scraping immediately
   - Retain criminal defense lawyer
   - Do NOT communicate without lawyer

2. **Defense:**
   - Publicly accessible data (no unauthorized access)
   - No authentication bypass
   - No security circumvention
   - Good faith belief in legality

**Cost:** €5,000-20,000+ for criminal defense

**Likelihood:** Extremely Low (disproportionate, unlikely to succeed)

---

## Legal Precedents

### Key Cases Supporting Data Scraping

#### 1. hiQ Labs v. LinkedIn (US, 2019-2022)
**Facts:**
- hiQ scraped public LinkedIn profiles
- LinkedIn sent cease & desist, claiming CFAA violation
- hiQ sued for declaratory judgment

**Holding:**
- 9th Circuit ruled scraping public data is NOT unauthorized access
- LinkedIn lost attempt to block hiQ
- CFAA does not prohibit scraping publicly available information

**Relevance to VoseMovies:**
- ✅ Public data scraping more defensible
- ✅ No authentication = no unauthorized access
- ⚠️ US case, not binding in EU

**Citation:** hiQ Labs, Inc. v. LinkedIn Corp., 31 F.4th 1180 (9th Cir. 2022)

---

#### 2. Ryanair v. PR Aviation (EU, 2015)
**Facts:**
- PR Aviation scraped Ryanair flight data
- Ryanair claimed database rights protection
- Alleged substantial extraction of database

**Holding:**
- EU Court limited scope of database rights
- Public information doesn't lose protection status
- But extraction must not be "substantial"
- Database rights don't give absolute control

**Relevance to VoseMovies:**
- ✅ Public data scraping has limits but is permissible
- ✅ Insubstantial extraction likely OK
- ⚠️ Must avoid extracting "substantial part" of database

**Citation:** C-30/14, Ryanair Ltd v PR Aviation BV, ECLI:EU:C:2015:10

---

#### 3. Meta v. BrandTotal (US, 2020)
**Facts:**
- BrandTotal scraped Facebook ads for market research
- Meta sued for ToS violations and CFAA
- BrandTotal users installed browser extension

**Holding:**
- Meta won preliminary injunction
- Court focused on ToS violations and technical circumvention
- Bypassing Facebook's anti-scraping measures was key factor

**Relevance to VoseMovies:**
- ⚠️ ToS violations can lead to injunctions
- ⚠️ Respecting technical barriers matters
- ⚠️ Don't bypass anti-bot measures aggressively

**Citation:** Facebook, Inc. v. BrandTotal, Inc., 487 F. Supp. 3d 955 (N.D. Cal. 2020)

---

#### 4. eBay v. Bidder's Edge (US, 2000)
**Facts:**
- Bidder's Edge scraped eBay auction listings
- eBay claimed trespass to chattels (server burden)
- Aggregated data from multiple auction sites

**Holding:**
- Court granted preliminary injunction
- Server load and ToS violations were key factors
- eBay had right to control access to servers

**Relevance to VoseMovies:**
- ⚠️ Minimize server burden (rate limiting critical)
- ⚠️ ToS violations can be enforceable
- ✅ But case is old (2000) and less persuasive now

**Citation:** eBay, Inc. v. Bidder's Edge, Inc., 100 F. Supp. 2d 1058 (N.D. Cal. 2000)

---

### Cases Against Aggressive Scraping

#### 5. Clearview AI (Multiple Jurisdictions)
**Facts:**
- Scraped billions of photos from social media
- Used for facial recognition without consent
- Multiple lawsuits and regulatory actions

**Holding/Status:**
- Banned in multiple jurisdictions (Italy, France, UK)
- Massive GDPR fines
- Ongoing litigation in US

**Relevance to VoseMovies:**
- ⚠️ Scraping at scale with sensitive data = high risk
- ✅ You're not scraping personal data (good!)
- ✅ Your scale is tiny by comparison

---

## Resources

### Legal Consultation

**Find IP Lawyer in Spain/Mallorca:**
- Colegio de Abogados de Baleares: https://www.icaib.org
- Search for: "Propiedad Intelectual" or "Derecho Digital"
- Expected cost: €300-500 for consultation, €1,000-2,000 for opinion letter

**Questions to Ask Lawyer:**
1. Is scraping publicly available showtime data legal in Spain/EU?
2. What are our specific risks given our implementation?
3. Should we obtain permission before scraping?
4. How should we respond to a cease & desist?
5. What clauses should we add to our Terms of Service?

### Technical Resources

**Check robots.txt:**
```bash
curl https://cineciutat.org/robots.txt
curl https://aficine.com/robots.txt
```

**Web Scraping Best Practices:**
- Robots Exclusion Standard: https://www.robotstxt.org
- Scrapy Best Practices: https://docs.scrapy.org/en/latest/topics/practices.html
- Respect Web Crawlers: https://developers.google.com/search/docs/crawling-indexing/robots/intro

### Legal Information (Not Legal Advice)

**EU Database Directive:**
- Full text: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:31996L0009
- Analysis: https://www.wipo.int/edocs/lexdocs/laws/en/eu/eu129en.pdf

**GDPR Resources:**
- Official text: https://gdpr.eu
- Data scraping implications: https://gdpr.eu/what-is-data-scraping/

**Terms of Service Enforcement:**
- EFF analysis: https://www.eff.org/issues/terms-of-service
- Contract law basics: https://en.wikipedia.org/wiki/Browsewrap

---

## Decision Framework

### Should You Proceed with Scraping?

**Ask Yourself:**

1. **Is the data truly public?**
   - ✅ Yes → Lower risk
   - ❌ No (requires login) → High risk, don't proceed

2. **Have you checked robots.txt?**
   - ✅ Allowed/Silent → Proceed
   - ❌ Disallowed → STOP, respect directive

3. **Have you read the Terms of Service?**
   - ✅ No scraping prohibition → Proceed with caution
   - ❌ Explicitly prohibits scraping → High risk, seek permission first

4. **Are you implementing ethical practices?**
   - ✅ Rate limiting, caching, attribution → Good
   - ❌ Aggressive scraping, no limits → Don't proceed

5. **What's your risk tolerance?**
   - ✅ Can pivot if challenged → Moderate approach OK
   - ❌ Can't afford legal issues → Conservative approach (get permission)

6. **Do you have a response plan?**
   - ✅ Prepared to remove data if requested → OK
   - ❌ No plan for complaints → Not ready to launch

### Risk Matrix

| Factor | Risk Level | Proceed? |
|--------|------------|----------|
| Public data + ethical scraping + attribution + responsive | 🟢 Low | ✅ Yes |
| Public data + ethical scraping + no ToS check | 🟡 Medium | ⚠️ Caution |
| Public data + aggressive scraping + ignores ToS | 🔴 High | ❌ No |
| Login-required data + any scraping | 🔴 Very High | ❌ Never |

**Your Current Status:** 🟡 Medium → ✅ Can proceed with moderate approach

---

## Final Recommendation

### Proceed with Moderate Approach

**What to do:**
1. ✅ Complete all "Critical" pre-launch action items
2. ✅ Implement ethical scraping practices
3. ✅ Add legal disclaimers and attribution
4. ✅ Launch with monitoring plan
5. ✅ Email cinemas within 2-4 weeks post-launch
6. ✅ Be prepared to remove data if requested
7. ✅ Consult lawyer if any legal threats received

**Why this approach:**
- Balances speed to market with legal prudence
- Shows good faith and ethical practices
- Minimizes risk while not being paralyzed by fear
- Allows for pivoting if challenged
- Industry-standard for similar aggregation apps

**Risk Assessment:** Low-to-Medium, manageable with proper precautions

**Expected Outcome:** Likely no legal issues; if contacted, handle professionally and remove data

---

## Appendix: Email Templates

### Template 1: Pre-Launch Permission Request

```
Subject: Partnership Request - VOSE Movie Aggregation App

Dear [Cinema Name] Management,

I am writing to request permission to feature [Cinema Name] in
VoseMovies, a free mobile app launching soon in the Balearic Islands.

ABOUT VOSEMOVIES:
VoseMovies helps English-speaking residents and tourists find VOSE
(Version Original Subtitulada en Español) movie showtimes across
Mallorca, Menorca, and Ibiza.

HOW IT WORKS:
- Aggregates publicly available showtime information
- Displays VOSE-only movies with dates and times
- Provides direct links to cinema websites for ticket purchases
- Free app with no advertisements

BENEFITS TO [CINEMA NAME]:
✅ Free marketing to English-speaking VOSE audience
✅ Increased visibility for your VOSE offerings
✅ Direct traffic to your website for ticket purchases
✅ Prominent feature in app with your logo (if provided)

WHAT WE'RE REQUESTING:
Permission to aggregate your publicly available VOSE showtime data
using ethical web scraping practices:
- Rate limiting to avoid server burden
- Infrequent updates (every 6-8 hours)
- Proper attribution and links back to your website

ALTERNATIVE OPTIONS:
If you prefer, we would be happy to:
- Use an API if available
- Receive manual data updates
- Establish a formal data sharing agreement
- Explore partnership opportunities

We would love to feature [Cinema Name] and help promote VOSE cinema
in the Balearic Islands. May we have your permission?

I'm happy to answer any questions or discuss this further.

Thank you for your time and consideration.

Best regards,
[Your Name]
[Your Email]
VoseMovies
[Website/GitHub Link]
```

---

### Template 2: Post-Launch Courtesy Notification

```
Subject: VoseMovies - Now Featuring [Cinema Name]

Dear [Cinema Name] Management,

I wanted to personally inform you that we recently launched
VoseMovies, a free mobile app for finding VOSE movies in the
Balearic Islands.

[Cinema Name] is featured in our app, showcasing your excellent
VOSE film offerings to the English-speaking community.

WHAT VOSEMOVIES DOES:
- Aggregates VOSE showtime information from cinemas across the islands
- Helps residents and tourists find original version films
- Provides direct links to your website for ticket purchases
- Free app with no advertisements (non-commercial project)

HOW WE FEATURE [CINEMA NAME]:
✅ Display your VOSE showtimes with proper attribution
✅ Direct links to your website for more info and purchases
✅ Prominent listing alongside other major cinemas
✅ Helping drive VOSE-interested customers to your venue

OUR ETHICAL PRACTICES:
- Aggregate only publicly available information
- Implement rate limiting and caching
- Respect robots.txt directives
- Update infrequently (every 6-8 hours)
- Minimal server impact

WE'D LOVE TO:
- Formalize this relationship with a data sharing agreement
- Discuss API access if available
- Feature you more prominently as a partner cinema
- Explore promotional opportunities

OPT-OUT OPTION:
If you prefer not to be included in VoseMovies, please let us know
and we will remove your data within 24 hours. No questions asked.

We believe this benefits both the VOSE-loving community and cinemas
like yours that support original version films. Thank you for bringing
quality VOSE cinema to the Balearic Islands!

I'm happy to discuss this further or answer any questions.

Best regards,
[Your Name]
[Your Email]
VoseMovies
Website: [URL]
Legal inquiries: legal@vosemovies.com
```

---

### Template 3: Response to Cease & Desist

```
Subject: RE: [Their Subject Line] - Immediate Compliance

Dear [Sender Name / Cinema / Law Firm],

Thank you for bringing your concerns to our attention regarding
VoseMovies' use of [Cinema Name]'s showtime information.

IMMEDIATE ACTION TAKEN:
We have immediately ceased all data collection from [Cinema Name]
and removed all existing data from our platform as of [Date/Time].

Specifically:
✅ Web scraping stopped as of [timestamp]
✅ All cached data deleted from database
✅ [Cinema Name] removed from app interface
✅ Changes deployed to production

ABOUT VOSEMOVIES:
VoseMovies is a non-commercial, open-source project designed to help
the English-speaking community in the Balearic Islands find VOSE films.
We aimed to provide a public service while driving traffic back to
participating cinemas.

We apologize for any concern this may have caused [Cinema Name]. It was
never our intention to cause harm or violate any rights.

ALTERNATIVE ARRANGEMENTS:
We would be happy to discuss alternative arrangements that would allow
us to feature [Cinema Name] in a manner acceptable to you, including:
- Manual data entry (no scraping)
- API access (if available)
- Formal data sharing agreement
- Partnership opportunities

We respect your position entirely. If you prefer not to be featured
at all, we will permanently exclude [Cinema Name] from our platform.

Please confirm receipt of this message and that our compliance actions
are satisfactory. We are committed to resolving this matter amicably.

Thank you for your understanding.

Sincerely,
[Your Name]
[Title]
VoseMovies
[Contact Information]
```

---

### Template 4: Response to Opt-Out Request

```
Subject: RE: Data Removal Request - [Cinema Name]

Dear [Cinema Name],

Thank you for contacting us regarding your preference not to be
included in VoseMovies.

DATA REMOVAL COMPLETED:
As per your request, we have removed all [Cinema Name] data from
VoseMovies. This includes:
✅ All showtime information deleted from database
✅ [Cinema Name] excluded from app interface
✅ Permanent exclusion added (will not scrape again)
✅ Changes deployed as of [date/time]

Your cinema will no longer appear in the VoseMovies app.

We respect your decision and apologize for any inconvenience. If you
change your mind in the future, please don't hesitate to reach out.

Thank you,
[Your Name]
VoseMovies
```

---

**END OF DOCUMENT**

---

**Document Control:**
- Version: 1.0
- Date: November 11, 2025
- Author: VoseMovies Legal Team
- Next Review: Before public launch
- Distribution: Internal use, consult with legal counsel

**Disclaimer:** This document provides general information and risk assessment only. It is NOT legal advice. Consult a qualified attorney licensed in Spain/EU for legal counsel specific to your situation before taking any action.
