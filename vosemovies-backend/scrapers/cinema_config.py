"""
Cinema Sources Configuration Loader
Loads cinema URLs and settings from cinema_sources.json
"""
import json
import os
from typing import Dict, List, Optional
from pathlib import Path


class CinemaConfig:
    """Centralized cinema configuration management"""

    def __init__(self, config_file: str = "cinema_sources.json"):
        self.config_path = Path(__file__).parent / config_file
        self.config = self._load_config()

    def _load_config(self) -> dict:
        """Load configuration from JSON file"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Config file not found: {self.config_path}")
            return {"cinemas": [], "scraper_settings": {}}
        except json.JSONDecodeError as e:
            print(f"Error parsing config file: {e}")
            return {"cinemas": [], "scraper_settings": {}}

    def get_all_cinemas(self) -> List[Dict]:
        """Get all cinema configurations"""
        return self.config.get("cinemas", [])

    def get_enabled_cinemas(self) -> List[Dict]:
        """Get only enabled cinema configurations"""
        return [c for c in self.get_all_cinemas() if c.get("enabled", False)]

    def get_cinema_by_id(self, cinema_id: str) -> Optional[Dict]:
        """Get cinema configuration by ID"""
        for cinema in self.get_all_cinemas():
            if cinema.get("id") == cinema_id:
                return cinema
        return None

    def get_cinema_url(self, cinema_id: str) -> Optional[str]:
        """Get cinema URL by ID"""
        cinema = self.get_cinema_by_id(cinema_id)
        return cinema.get("url") if cinema else None

    def get_scraper_settings(self) -> Dict:
        """Get global scraper settings"""
        return self.config.get("scraper_settings", {})

    def is_cinema_enabled(self, cinema_id: str) -> bool:
        """Check if a cinema is enabled"""
        cinema = self.get_cinema_by_id(cinema_id)
        return cinema.get("enabled", False) if cinema else False

    def add_cinema(self, cinema_data: Dict) -> bool:
        """Add a new cinema to configuration"""
        if "id" not in cinema_data:
            print("Error: Cinema must have an 'id' field")
            return False

        # Check if cinema already exists
        if self.get_cinema_by_id(cinema_data["id"]):
            print(f"Warning: Cinema with id '{cinema_data['id']}' already exists")
            return False

        self.config["cinemas"].append(cinema_data)
        return self._save_config()

    def update_cinema(self, cinema_id: str, updates: Dict) -> bool:
        """Update an existing cinema configuration"""
        for i, cinema in enumerate(self.config["cinemas"]):
            if cinema.get("id") == cinema_id:
                self.config["cinemas"][i].update(updates)
                return self._save_config()
        print(f"Cinema with id '{cinema_id}' not found")
        return False

    def enable_cinema(self, cinema_id: str) -> bool:
        """Enable a cinema"""
        return self.update_cinema(cinema_id, {"enabled": True})

    def disable_cinema(self, cinema_id: str) -> bool:
        """Disable a cinema"""
        return self.update_cinema(cinema_id, {"enabled": False})

    def _save_config(self) -> bool:
        """Save configuration back to JSON file"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving config: {e}")
            return False

    def print_summary(self):
        """Print a summary of all configured cinemas"""
        print("="*80)
        print("CINEMA SOURCES CONFIGURATION")
        print("="*80)
        print(f"Version: {self.config.get('version', 'unknown')}")
        print(f"Last Updated: {self.config.get('last_updated', 'unknown')}")
        print(f"\nTotal Cinemas: {len(self.get_all_cinemas())}")
        print(f"Enabled: {len(self.get_enabled_cinemas())}")
        print(f"Disabled: {len(self.get_all_cinemas()) - len(self.get_enabled_cinemas())}")
        print("\nConfigured Cinemas:")
        print("-"*80)

        for cinema in self.get_all_cinemas():
            status = "✓ ENABLED" if cinema.get("enabled") else "✗ DISABLED"
            print(f"\n{status}: {cinema.get('name')} ({cinema.get('id')})")
            print(f"  Location: {cinema.get('location')}, {cinema.get('island')}")
            print(f"  URL: {cinema.get('url')}")
            print(f"  Scraper: {cinema.get('scraper_file')}")
            if cinema.get('notes'):
                print(f"  Notes: {cinema.get('notes')}")


# Convenience function
def load_cinema_config() -> CinemaConfig:
    """Load cinema configuration"""
    return CinemaConfig()


if __name__ == "__main__":
    # Test the configuration loader
    config = load_cinema_config()
    config.print_summary()
