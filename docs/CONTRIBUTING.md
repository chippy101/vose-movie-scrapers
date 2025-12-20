# Contributing to VoseMovies

First off, thank you for considering contributing to VoseMovies! This app serves the English-speaking community in the Balearic Islands, and your contributions help make it better.

## Code of Conduct

This project adheres to a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@vosemovies.com.

## How Can I Contribute?

### 🐛 Reporting Bugs

**Before submitting a bug report:**
- Check the [existing issues](https://github.com/yourusername/vosemovies/issues) to avoid duplicates
- Update to the latest version to ensure the bug still exists
- Collect relevant information (device, Android version, steps to reproduce)

**Submitting a bug report:**
1. Use the [Bug Report template](https://github.com/yourusername/vosemovies/issues/new?template=bug_report.md)
2. Include:
   - Clear, descriptive title
   - Step-by-step reproduction steps
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Device info: Android version, device model
   - App version
3. Label as `bug`

### ✨ Suggesting Features

**Before suggesting a feature:**
- Check if it already exists in the [roadmap](https://github.com/yourusername/vosemovies/projects)
- Search existing [feature requests](https://github.com/yourusername/vosemovies/issues?q=label%3Aenhancement)

**Suggesting a feature:**
1. Use the [Feature Request template](https://github.com/yourusername/vosemovies/issues/new?template=feature_request.md)
2. Explain:
   - Problem you're trying to solve
   - Proposed solution
   - Alternative solutions considered
   - Who would benefit (all users, specific use case)
3. Label as `enhancement`

### 🎨 Improving Documentation

Documentation improvements are always welcome:
- Fix typos or clarify confusing sections
- Add missing setup instructions
- Translate to Spanish or Catalan
- Create video tutorials or guides

### 🏛️ Adding New Cinemas

To add support for a new cinema:

1. **Check if cinema offers VOSE** - Verify they regularly show original version movies
2. **Create a scraper** - Follow the pattern in `scrapers/cineciutat_scraper.py`
3. **Test thoroughly** - Ensure it captures all dates and cinemas correctly
4. **Add cinema metadata** - Update cinema ID mappings and location data
5. **Update documentation** - Add cinema to README and docs

**Template scraper:**
```python
# scrapers/newcinema_scraper.py
class NewCinemaScraper:
    def __init__(self, headless: bool = True):
        self.base_url = "https://cinema-website.com"
        self.vose_url = f"{self.base_url}/en/vose"
        # ... (follow existing scraper patterns)
```

See [SCRAPER_GUIDELINES.md](./SCRAPER_GUIDELINES.md) for detailed instructions.

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/vosemovies.git
cd vosemovies
git remote add upstream https://github.com/ORIGINAL_OWNER/vosemovies.git
```

### 2. Create a Branch

```bash
# Use descriptive branch names
git checkout -b feature/add-cinema-xyz
git checkout -b fix/showtime-parsing-bug
git checkout -b docs/update-setup-guide
```

**Branch naming convention:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes

### 3. Set Up Development Environment

**Backend:**
```bash
cd vosemovies-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r api/requirements.txt
cp .env.example .env
# Add your TMDB_API_KEY to .env
```

**Frontend:**
```bash
cd vosemovies-frontend
npm install
```

### 4. Make Your Changes

**Code Style:**

**Python (Backend):**
- Follow [PEP 8](https://peps.python.org/pep-0008/)
- Use type hints for function signatures
- Write docstrings for public functions
- Run `black` for formatting (if available)

**TypeScript (Frontend):**
- Use `prettier` for formatting
- Strict TypeScript (avoid `any`)
- Functional components with hooks
- Consistent naming: PascalCase for components, camelCase for functions

**Commit Messages:**
Use [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add Multicines Ibiza scraper
fix: handle empty showtime dates in parser
docs: update deployment guide with Railway instructions
refactor: extract date parsing to utility function
test: add unit tests for CineCiutat scraper
```

### 5. Test Your Changes

**Backend tests:**
```bash
cd vosemovies-backend
pytest  # (add tests first!)
```

**Frontend tests:**
```bash
cd vosemovies-frontend
npm test  # (add tests first!)
```

**Manual testing:**
- Run scrapers: `./run-scrapers.sh`
- Start backend: `./start-backend.sh`
- Start frontend: `npx expo start`
- Test on Android emulator and/or physical device

**Checklist before submitting:**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if needed)
- [ ] No new warnings or errors
- [ ] Tested on Android emulator
- [ ] Tested with slow/offline network (if applicable)

### 6. Submit a Pull Request

```bash
# Commit your changes
git add .
git commit -m "feat: add support for Cinema XYZ"

# Push to your fork
git push origin feature/add-cinema-xyz
```

**On GitHub:**
1. Navigate to your fork
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template:
   - Clear description of changes
   - Link to related issues (Fixes #123)
   - Screenshots (for UI changes)
   - Testing performed
5. Submit and wait for review

**PR Title Convention:**
```
feat: Add support for Cinema XYZ scraper
fix: Correct date parsing for Aficine showtimes
docs: Update README with new cinema list
```

## Review Process

1. **Automated checks** - CI/CD runs tests (when configured)
2. **Code review** - Maintainer reviews code quality, style, functionality
3. **Discussion** - Address feedback and make requested changes
4. **Approval** - Once approved, PR will be merged

**Review time:** We aim to review PRs within 7 days. Complex changes may take longer.

## Development Tips

### Running Scrapers in Debug Mode
```bash
cd vosemovies-backend
PYTHONPATH=. venv/bin/python3 scrapers/cineciutat_scraper.py
```

### Viewing API Docs
```bash
# Start backend, then visit:
http://localhost:8000/docs
```

### Clearing Frontend Cache
```bash
cd vosemovies-frontend
npx expo start -c
```

### Database Inspection
```bash
cd vosemovies-backend
sqlite3 vose_movies.db
sqlite> SELECT * FROM showtimes WHERE date = '2025-11-15';
```

## Areas Needing Contributions

### High Priority
- [ ] iOS app version
- [ ] Push notifications for new VOSE releases
- [ ] Unit tests for scrapers
- [ ] Spanish/Catalan translations
- [ ] Additional cinema scrapers (check [issues](https://github.com/yourusername/vosemovies/issues?q=label%3Acinema))

### Medium Priority
- [ ] Dark mode theme
- [ ] User favorites/bookmarks (requires backend changes)
- [ ] Calendar export (ICS format)
- [ ] Performance optimizations
- [ ] Accessibility improvements

### Low Priority
- [ ] Advanced filtering (genre, rating)
- [ ] Social sharing features
- [ ] Trailer integration

## Financial Contributions

VoseMovies is free and open source. If you'd like to support development:
- ☕ [Buy me a coffee](https://buymeacoffee.com/vosemovies) *(if configured)*
- ⭐ Star the repository
- 📢 Share with friends in the Balearic Islands

## Questions?

- **General questions:** [GitHub Discussions](https://github.com/yourusername/vosemovies/discussions)
- **Bug reports:** [GitHub Issues](https://github.com/yourusername/vosemovies/issues)
- **Email:** contribute@vosemovies.com

## Recognition

Contributors are recognized in:
- [CONTRIBUTORS.md](./CONTRIBUTORS.md)
- GitHub Contributors page
- App "About" section (for significant contributions)

Thank you for making VoseMovies better! 🎬🍿
