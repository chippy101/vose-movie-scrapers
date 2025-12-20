#!/usr/bin/env python3
"""
Stealth Configuration for Web Scrapers
Provides anti-detection settings to minimize footprint on target websites
"""

import random
import time
from typing import Dict, List


class StealthConfig:
    """Configuration for stealth web scraping"""

    # Rotate through current user agents (Updated Jan 2025)
    USER_AGENTS = [
        # Chrome on Windows (most common)
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',

        # Chrome on Mac
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',

        # Firefox on Windows
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',

        # Edge on Windows
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    ]

    # Realistic window sizes (common resolutions)
    WINDOW_SIZES = [
        (1920, 1080),  # Full HD
        (1366, 768),   # Common laptop
        (1536, 864),   # Common laptop
        (1440, 900),   # MacBook
        (2560, 1440),  # 2K
    ]

    # Browser languages (Spanish regions since targeting Spanish sites)
    LANGUAGES = [
        'es-ES,es;q=0.9,en;q=0.8',
        'es-ES,es;q=0.9',
        'ca-ES,ca;q=0.9,es;q=0.8,en;q=0.7',  # Catalan (Balearic Islands)
    ]

    @staticmethod
    def get_random_user_agent() -> str:
        """Get a random current user agent"""
        return random.choice(StealthConfig.USER_AGENTS)

    @staticmethod
    def get_random_window_size() -> tuple:
        """Get a random realistic window size"""
        return random.choice(StealthConfig.WINDOW_SIZES)

    @staticmethod
    def get_random_language() -> str:
        """Get a random language header"""
        return random.choice(StealthConfig.LANGUAGES)

    @staticmethod
    def get_realistic_headers(user_agent: str = None, language: str = None) -> Dict[str, str]:
        """
        Generate realistic browser headers
        These make the request look like it's from a real browser
        """
        if not user_agent:
            user_agent = StealthConfig.get_random_user_agent()
        if not language:
            language = StealthConfig.get_random_language()

        return {
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': language,
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',  # Do Not Track
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        }

    @staticmethod
    def random_delay(min_seconds: float = 1.5, max_seconds: float = 4.0):
        """
        Sleep for a random amount of time to mimic human behavior
        Avoids fixed timing patterns that can be detected
        """
        delay = random.uniform(min_seconds, max_seconds)
        time.sleep(delay)

    @staticmethod
    def get_stealth_chrome_options(headless: bool = True, debug_mode: bool = False):
        """
        Get Chrome options with comprehensive anti-detection settings

        Args:
            headless: Run in headless mode
            debug_mode: Enable screenshots and HTML dumps (disable in production)
        """
        from selenium.webdriver.chrome.options import Options

        chrome_options = Options()

        # Headless mode (new version is less detectable)
        if headless:
            chrome_options.add_argument('--headless=new')

        # Get random settings for this session
        width, height = StealthConfig.get_random_window_size()
        user_agent = StealthConfig.get_random_user_agent()

        # Basic anti-detection
        chrome_options.add_argument(f'--window-size={width},{height}')
        chrome_options.add_argument(f'--user-agent={user_agent}')

        # Anti-detection flags
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')

        # Additional stealth options
        chrome_options.add_argument('--disable-web-security')
        chrome_options.add_argument('--disable-features=IsolateOrigins,site-per-process')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')

        # Disable automation indicators
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        # Set preferences to appear more like a real browser
        prefs = {
            "profile.default_content_setting_values.notifications": 2,  # Block notifications
            "profile.managed_default_content_settings.images": 1,  # Load images
        }
        chrome_options.add_experimental_option("prefs", prefs)

        return chrome_options, user_agent

    @staticmethod
    def apply_stealth_scripts(driver):
        """
        Apply JavaScript-based anti-detection measures after driver initialization
        These hide automation indicators and add realistic browser properties
        """
        # Hide webdriver property
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        # Override the navigator.plugins to make it look real
        driver.execute_script("""
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    {
                        0: {type: "application/pdf", suffixes: "pdf", description: "Portable Document Format"},
                        description: "Portable Document Format",
                        filename: "internal-pdf-viewer",
                        length: 1,
                        name: "Chrome PDF Plugin"
                    },
                    {
                        0: {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format"},
                        description: "Portable Document Format",
                        filename: "internal-pdf-viewer",
                        length: 1,
                        name: "Chrome PDF Viewer"
                    }
                ]
            });
        """)

        # Add languages property
        driver.execute_script("""
            Object.defineProperty(navigator, 'languages', {
                get: () => ['es-ES', 'es', 'en-US', 'en']
            });
        """)

        # Override the navigator.permissions
        driver.execute_script("""
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        """)

        # Add chrome object (make it look like a real Chrome browser)
        driver.execute_script("""
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {}
            };
        """)

        # Override WebGL vendor and renderer (avoids headless detection)
        driver.execute_script("""
            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
                if (parameter === 37445) {
                    return 'Intel Inc.';
                }
                if (parameter === 37446) {
                    return 'Intel Iris OpenGL Engine';
                }
                return getParameter.call(this, parameter);
            };
        """)

        # Randomize canvas fingerprint slightly (advanced anti-fingerprinting)
        driver.execute_script("""
            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function(type) {
                const shift = Math.random() * 0.0000001;
                const context = this.getContext('2d');
                const imageData = context.getImageData(0, 0, this.width, this.height);
                for (let i = 0; i < imageData.data.length; i++) {
                    imageData.data[i] = imageData.data[i] + shift;
                }
                context.putImageData(imageData, 0, 0);
                return originalToDataURL.apply(this, arguments);
            };
        """)


class RateLimiter:
    """
    Intelligent rate limiting to avoid detection and be respectful
    """

    def __init__(self, requests_per_minute: int = 15):
        """
        Initialize rate limiter

        Args:
            requests_per_minute: Maximum requests per minute (default: 15 = very polite)
        """
        self.requests_per_minute = requests_per_minute
        self.min_delay = 60.0 / requests_per_minute
        self.last_request_time = 0

    def wait(self):
        """Wait if necessary to maintain rate limit with random jitter"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time

        if time_since_last < self.min_delay:
            # Add random jitter (±20%) to avoid predictable patterns
            jitter = random.uniform(0.8, 1.2)
            sleep_time = (self.min_delay - time_since_last) * jitter
            time.sleep(sleep_time)

        self.last_request_time = time.time()


# Production vs Debug mode
DEBUG_MODE = False  # Set to False in production to disable HTML dumps and screenshots


def get_debug_mode() -> bool:
    """Check if debug mode is enabled"""
    import os
    return os.environ.get('SCRAPER_DEBUG', 'false').lower() == 'true' or DEBUG_MODE
