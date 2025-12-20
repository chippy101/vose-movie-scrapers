# Release Checklist for VoseMovies

Use this checklist before releasing to production or submitting to app stores.

## Pre-Release Preparation

### Documentation
- [ ] README.md complete with all sections
- [ ] PRIVACY_POLICY.md reviewed and legally compliant
- [ ] TERMS_OF_SERVICE.md reviewed
- [ ] CHANGELOG.md updated with version changes
- [ ] DEPLOYMENT.md has clear instructions
- [ ] API documentation up to date
- [ ] All placeholder emails replaced with real contacts

### Code Quality
- [ ] All TODO comments addressed or documented
- [ ] No hardcoded secrets (API keys, passwords)
- [ ] `.env.example` files updated with all variables
- [ ] Unused code removed
- [ ] Console.log statements removed or minimized
- [ ] Error handling implemented for all network requests
- [ ] Loading states implemented for all async operations

### Backend
- [ ] All scrapers tested and working
- [ ] Database migrations tested
- [ ] API endpoints return correct data
- [ ] CORS configured for production domain (not `*`)
- [ ] Rate limiting implemented
- [ ] Health check endpoint functional: `/health`
- [ ] PostgreSQL configured (or production-ready database)
- [ ] Environment variables documented in `.env.example`
- [ ] Scraper automation configured (cron job)
- [ ] Logs configured and accessible
- [ ] Error tracking set up (Sentry or alternative)

### Frontend
- [ ] Backend API URL updated to production
- [ ] App version incremented in `app.json`
- [ ] All development-only features removed
- [ ] Offline mode tested
- [ ] Pull-to-refresh tested
- [ ] Empty states tested (no data scenarios)
- [ ] Error states tested (network failure)
- [ ] Loading states tested
- [ ] App icon finalized (512x512 PNG)
- [ ] Splash screen configured
- [ ] App name confirmed

### Security
- [ ] HTTPS enforced (backend)
- [ ] Secrets stored in environment variables only
- [ ] No sensitive data logged
- [ ] Input validation implemented
- [ ] SQL injection prevention (using ORM)
- [ ] XSS prevention implemented
- [ ] CORS restricted to frontend domain
- [ ] Dependencies updated (no known vulnerabilities)
  ```bash
  npm audit
  pip check
  ```

### Testing

#### Backend Testing
- [ ] Manual API testing:
  ```bash
  curl https://api.vosemovies.com/health
  curl https://api.vosemovies.com/showtimes/today
  curl https://api.vosemovies.com/cinemas/
  ```
- [ ] Scraper tested (recent data):
  ```bash
  ./run-scrapers.sh
  # Check logs for errors
  ```
- [ ] Database queries tested (performance)
- [ ] Load testing performed (optional but recommended)

#### Frontend Testing
- [ ] Tested on Android emulator
- [ ] Tested on physical Android device
- [ ] Tested on slow network (throttle to 3G)
- [ ] Tested offline functionality
- [ ] Tested app restart (state persistence)
- [ ] Tested different screen sizes
- [ ] Tested orientation changes (if supported)
- [ ] No crashes in normal usage
- [ ] All buttons and links functional

### Legal & Compliance

#### Privacy (GDPR)
- [ ] Privacy policy hosted and accessible
- [ ] Privacy policy URL added to app stores
- [ ] No personal data collected (confirmed)
- [ ] Data processing documented
- [ ] User rights explained (access, deletion)

#### App Store Requirements
- [ ] Google Play Developer account active ($25 paid)
- [ ] Privacy policy publicly accessible (URL required)
- [ ] Content rating completed
- [ ] Target audience specified
- [ ] App category selected: Entertainment
- [ ] Store assets prepared (see below)

#### Licensing
- [ ] MIT License file included
- [ ] Third-party attributions documented
- [ ] TMDB attribution displayed in app
- [ ] Cinema attributions included

### Google Play Store Assets

#### Required Graphics
- [ ] **App Icon:** 512x512 PNG (no transparency)
- [ ] **Feature Graphic:** 1024x500 PNG
- [ ] **Screenshots:** Minimum 2, maximum 8
  - Recommended: 1080x1920 (phone) or 1920x1080 (tablet)
  - Show: Home screen, showtime list, cinema filter, date selector

#### Optional Graphics
- [ ] Promo Video (YouTube URL)
- [ ] TV Banner: 1280x720 (if Android TV support)

#### Store Listing Text
- [ ] **App Name:** VoseMovies (or chosen name)
- [ ] **Short Description** (80 chars max):
  ```
  Find original version movies with Spanish subtitles in Balearic Islands
  ```
- [ ] **Full Description** (4000 chars max):
  - What problem it solves
  - Key features
  - Supported cinemas
  - How to use
  - TMDB attribution
- [ ] **Keywords/Tags:** VOSE, movies, cinema, Mallorca, Balearic Islands, original version, subtitles

### Deployment

#### Backend Deployment
- [ ] Production server configured (Railway, DigitalOcean, AWS, etc.)
- [ ] Domain name configured (api.vosemovies.com)
- [ ] SSL certificate installed (HTTPS)
- [ ] Environment variables set on server
- [ ] Database created and connected
- [ ] Scrapers scheduled (cron job every 4 hours)
- [ ] Monitoring configured (UptimeRobot or similar)
- [ ] Backup strategy implemented
- [ ] Deployment tested (can access API from internet)

#### Frontend Deployment (Play Store)
- [ ] Production build generated:
  ```bash
  eas build --platform android --profile production
  ```
- [ ] APK/AAB tested on physical device
- [ ] Version number incremented
- [ ] Build uploaded to Google Play Console
- [ ] Store listing completed (all required fields)
- [ ] Screenshots uploaded (minimum 2)
- [ ] Privacy policy URL added
- [ ] Content rating completed
- [ ] Pricing set to Free
- [ ] Release notes written
- [ ] Countries/regions selected (or Worldwide)
- [ ] App submitted for review

### Monitoring Setup
- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Error tracking configured (Sentry)
- [ ] Log aggregation set up
- [ ] Alerts configured (email/SMS for downtime)
- [ ] Dashboard accessible for monitoring

### Post-Deployment Verification
- [ ] Backend health check passing
- [ ] Scrapers running automatically
- [ ] API returning fresh data
- [ ] App connects to production backend
- [ ] All features working in production
- [ ] No errors in logs
- [ ] Database backup verified

## Version Release Process

### Pre-Release (1 week before)
1. [ ] Code freeze announced
2. [ ] Testing phase begins
3. [ ] Documentation updated
4. [ ] Changelog finalized
5. [ ] Release notes drafted

### Release Day
1. [ ] Final testing completed
2. [ ] Version number updated
3. [ ] Git tag created: `v1.0.0`
4. [ ] GitHub release created
5. [ ] Backend deployed to production
6. [ ] Frontend build generated
7. [ ] Play Store submission

### Post-Release (First 24 hours)
1. [ ] Monitor crash reports
2. [ ] Check user reviews
3. [ ] Verify scraper automation
4. [ ] Monitor API performance
5. [ ] Respond to early feedback

### Post-Release (First week)
1. [ ] Review analytics (installs, crashes)
2. [ ] Address critical bugs immediately
3. [ ] Plan hotfix if needed
4. [ ] Gather user feedback
5. [ ] Update roadmap based on feedback

## Emergency Rollback Plan

If critical issues found post-release:

### Backend
1. [ ] Revert to previous git commit
2. [ ] Redeploy previous version
3. [ ] Verify health check passing
4. [ ] Notify users (if affected)

### Frontend
1. [ ] Use Play Store staged rollout (if configured)
2. [ ] Halt rollout at current percentage
3. [ ] Upload patched APK/AAB
4. [ ] Resume rollout after fix

## Final Sign-Off

Before submitting to Play Store:

- [ ] **Project Lead** approval
- [ ] **QA Testing** completed
- [ ] **Legal Review** completed (privacy, terms)
- [ ] **Security Audit** passed
- [ ] **Backup Strategy** verified

**Release Manager Signature:**
Name: ___________________
Date: ___________________

**Approval:**
- [ ] Approved for production deployment
- [ ] Approved for Play Store submission

---

## Version-Specific Notes

### v1.0.0 (Initial Release)
- First public release
- 7 cinemas supported
- Android only
- No user accounts
- Basic VOSE filtering

### v1.1.0 (Planned)
- Add user favorites
- Push notifications
- Dark mode

---

## Resources

- **Backend Logs:** [URL to logs dashboard]
- **Monitoring:** [UptimeRobot dashboard URL]
- **Play Console:** https://play.google.com/console
- **Error Tracking:** [Sentry dashboard URL]
- **Deployment Docs:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**This checklist should be completed for every release.**

Save a copy of this checklist for each version:
```bash
cp RELEASE_CHECKLIST.md RELEASE_CHECKLIST_v1.0.0.md
```

Mark items as completed and commit before release.
