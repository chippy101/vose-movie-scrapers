# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

**Recommendation:** Always use the latest version from the main branch or the most recent release.

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please help us protect our users by following responsible disclosure:

### 🔒 Private Reporting (Preferred)

**DO NOT create a public GitHub issue for security vulnerabilities.**

Instead, report privately via:

1. **Email:** security@vosemovies.com *(replace with actual email)*
   - Subject: "[SECURITY] Brief description"
   - Include: Detailed description, steps to reproduce, potential impact

2. **GitHub Security Advisories** (if enabled)
   - Navigate to: https://github.com/yourusername/vosemovies/security/advisories
   - Click "Report a vulnerability"

### 📋 What to Include

When reporting a vulnerability, please provide:

- **Type of vulnerability** (XSS, SQL injection, etc.)
- **Affected component** (backend API, frontend, scraper)
- **Attack scenario** (how it could be exploited)
- **Proof of concept** (code, screenshots, or detailed steps)
- **Potential impact** (data exposure, denial of service, etc.)
- **Suggested fix** (if you have one)
- **Your contact info** (for follow-up questions)

### ⏱️ Response Timeline

- **Initial response:** Within 72 hours
- **Status update:** Within 7 days
- **Fix timeline:** Varies by severity (see below)
- **Public disclosure:** After fix is released (coordinated disclosure)

### 🎯 Severity Levels

**Critical (Fix within 7 days)**
- Remote code execution
- Authentication bypass
- Data breach (user data exposure)

**High (Fix within 30 days)**
- Privilege escalation
- SQL injection
- Cross-site scripting (XSS)

**Medium (Fix within 90 days)**
- Denial of service (DoS)
- Information disclosure (non-sensitive)
- Security misconfiguration

**Low (Best effort)**
- Minor information leakage
- Missing security headers
- Non-exploitable bugs

### 🏆 Recognition

We appreciate security researchers who help us:

- **Hall of Fame:** Acknowledged in SECURITY_CREDITS.md (with your permission)
- **Early notification:** Informed when patch is released
- **CVE credit:** Credited in CVE if one is issued

**We do not offer monetary bug bounties at this time** (we're an open-source, non-profit project).

## Security Best Practices

### For Users

✅ **Keep the app updated** - Install updates promptly for security fixes
✅ **Download from official sources** - Google Play Store or GitHub releases only
✅ **Verify HTTPS** - Ensure backend uses HTTPS in production
✅ **Review permissions** - App should only request network access
❌ **Don't share TMDB API keys** - Keep your `.env` file private

### For Developers

✅ **Never commit secrets** - Use `.env` files (not tracked by git)
✅ **Validate all inputs** - Sanitize user input and external data
✅ **Use parameterized queries** - Prevent SQL injection
✅ **Enable CORS properly** - Don't use `*` in production
✅ **Keep dependencies updated** - Run `npm audit` and `pip check`
✅ **Review pull requests** - Check for security issues before merging

### For Backend Deployers

✅ **Use HTTPS only** - Never deploy HTTP in production
✅ **Set strong secrets** - Use random API keys and secrets
✅ **Limit CORS origins** - Whitelist only your frontend domain
✅ **Enable rate limiting** - Prevent API abuse
✅ **Use environment variables** - Never hardcode secrets
✅ **Regular backups** - Back up database regularly
✅ **Monitor logs** - Watch for suspicious activity
✅ **Update dependencies** - Keep Python/Node packages current

## Known Security Considerations

### Web Scraping
- **Ethical scraping:** We respect robots.txt and implement delays
- **Cinema website terms:** Review terms before deploying scrapers
- **Legal compliance:** Scraping may be subject to local laws

### No User Authentication
- **By design:** App has no login system (privacy-first approach)
- **Benefit:** No password breaches or account takeovers
- **Limitation:** No per-user features (favorites, notifications)

### Third-Party APIs
- **TMDB API:** Subject to TMDB security and availability
- **Cinema websites:** Data accuracy depends on upstream sources

### SQLite Database
- **Development:** SQLite is fine for development/small deployments
- **Production:** Consider PostgreSQL for larger-scale deployments
- **Backups:** SQLite file should be backed up regularly

## Security Features

### Backend
- ✅ FastAPI with automatic input validation
- ✅ Parameterized SQL queries (SQLAlchemy ORM)
- ✅ HTTPS support (when deployed with TLS)
- ✅ CORS configuration (customize for production)
- ✅ No password storage (no user authentication)

### Frontend
- ✅ React Native security defaults
- ✅ HTTPS-only API calls
- ✅ No embedded secrets (API keys in backend only)
- ✅ Minimal permissions requested
- ✅ No third-party tracking libraries

### Scrapers
- ✅ Rate limiting to prevent server overload
- ✅ User-Agent spoofing (to appear as regular browser)
- ✅ Error handling (graceful failures)
- ✅ No credentials or authentication required

## Out of Scope

The following are **not considered security vulnerabilities**:

- Incorrect movie showtime data (data accuracy issue, not security)
- Cinema website availability (upstream dependency)
- Social engineering attacks (user responsibility)
- Physical security of deployment servers
- Denial of service requiring >10k requests/minute (rate limit at infra level)
- Vulnerabilities in third-party dependencies (report to respective projects)

## Incident Response Plan

If a security incident occurs:

1. **Immediate action:** Take affected systems offline if necessary
2. **Assessment:** Evaluate scope and impact
3. **Notification:** Inform affected users (if any user data exposed)
4. **Fix deployment:** Release patched version
5. **Post-mortem:** Document incident and prevention measures
6. **Public disclosure:** Publish security advisory after fix

## Compliance

### GDPR (EU Data Protection)
- **No personal data collected:** App is GDPR-compliant by design
- **Data minimization:** Only public showtime data stored
- **Right to be forgotten:** Not applicable (no user accounts)

### Google Play Security
- App complies with [Google Play Developer Policy](https://play.google.com/about/developer-content-policy/)
- Regular security reviews before Play Store updates

## Security Audit History

| Date       | Type              | Findings | Status   |
|------------|-------------------|----------|----------|
| 2025-11-11 | Self-assessment   | 0 critical | ✅ Passed |
| TBD        | External audit    | Pending  | 🔜 Planned |

## Additional Resources

- [OWASP Mobile Security Project](https://owasp.org/www-project-mobile-security/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [React Native Security Guide](https://reactnative.dev/docs/security)
- [FastAPI Security Documentation](https://fastapi.tiangolo.com/tutorial/security/)

## Contact

- **Security issues:** security@vosemovies.com
- **General questions:** support@vosemovies.com
- **GitHub:** https://github.com/yourusername/vosemovies/security

---

**Last updated:** November 11, 2025
**Next review:** February 11, 2026 (quarterly reviews)
