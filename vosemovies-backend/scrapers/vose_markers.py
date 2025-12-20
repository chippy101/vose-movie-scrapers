"""
Comprehensive list of VOSE (Original Version with Spanish Subtitles) indicators
Used across all scrapers to detect VOSE movies

VOSE = Versión Original Subtitulada en Español
IMPORTANT: This app is specifically for ENGLISH movies with Spanish subtitles
"""

# Markers that explicitly indicate ENGLISH movies with Spanish subtitles
ENGLISH_VOSE_MARKERS = [
    # Standard VOSE abbreviation (by convention means English)
    'vose', 'v.o.s.e', 'v.o.s.e.', 'vo.se', 'v o s e',
    'vos.e', 'vo se', 'v-o-s-e',

    # Explicit English markers (most reliable)
    'ov english', 'ov inglés', 'ov ingles',
    'vo english', 'vo inglés', 'vo ingles',
    'english with spanish subtitles',
    'english with subtitles',
    'inglés con subtítulos español',
    'inglés con subtítulos castellano',
    'ingles con subtitulos español',
    'ingles con subtitulos castellano',
    'english subtitulada',
    'english subtitulado',

    # Explicit combinations
    'v.o. english', 'v.o english', 'v-o english',
    'original version english', 'versión original inglés',
    'version original ingles', 'versio original angles',

    # Generic OV with Spanish subtitles (often means English by convention in Spain)
    # IMPORTANT: This is checked AFTER non-English markers, so if movie is explicitly
    # labeled as French/Spanish/etc, it will be rejected before these match
    'ov with spanish subtitles',
    'vo with spanish subtitles',
    'v.o. with spanish subtitles',

    # Alternative generic terms used by some cinemas
    'otras lenguas',  # "Other languages" - Cines Moix Negre uses this for non-Spanish films
    'other languages',
]

# Markers that indicate NON-English movies (these should be REJECTED)
NON_ENGLISH_MARKERS = [
    # Spanish originals
    'ov spanish', 'ov español', 'ov castellano', 'ov castellà',
    'vo spanish', 'vo español', 'vo castellano',
    'ov catalán', 'ov català', 'ov catalan',
    'original spanish', 'español original', 'castellano original',

    # Other languages
    'ov french', 'ov francés', 'ov frances',
    'ov german', 'ov alemán', 'ov aleman',
    'ov italian', 'ov italiano',
    'ov japanese', 'ov japonés', 'ov japones',
    'ov russian', 'ov ruso',
    'ov korean', 'ov coreano',
    'ov chinese', 'ov chino',
    'ov portuguese', 'ov portugués', 'ov portugues',

    'vo french', 'vo francés', 'vo frances',
    'vo german', 'vo alemán', 'vo aleman',
    'vo italian', 'vo italiano',
    'vo japanese', 'vo japonés', 'vo japones',
    'vo russian', 'vo ruso',
    'vo korean', 'vo coreano',
    'vo chinese', 'vo chino',
    'vo portuguese', 'vo portugués', 'vo portugues',
]

# Legacy markers (kept for backwards compatibility)
VOSE_MARKERS = ENGLISH_VOSE_MARKERS

def is_vose(text: str) -> bool:
    """
    Check if text contains ENGLISH VOSE indicators

    This function specifically filters for ENGLISH movies with Spanish subtitles.
    It will REJECT Spanish, French, or other foreign language films.

    Args:
        text: Text to check (will be converted to lowercase)

    Returns:
        True if text contains English VOSE markers AND does not contain non-English markers
    """
    text_lower = text.lower()

    # First check if it's explicitly a non-English movie
    if any(marker in text_lower for marker in NON_ENGLISH_MARKERS):
        return False

    # Then check if it has English VOSE markers
    return any(marker in text_lower for marker in ENGLISH_VOSE_MARKERS)


def get_vose_confidence(text: str) -> float:
    """
    Get confidence score (0.0 to 1.0) that this is a VOSE movie
    Higher score = more confident

    Args:
        text: Text to analyze

    Returns:
        Confidence score between 0.0 and 1.0
    """
    text_lower = text.lower()

    # Count how many markers are present
    matches = sum(1 for marker in VOSE_MARKERS if marker in text_lower)

    # Higher priority markers (more explicit)
    high_priority = [
        'vose', 'v.o.s.e', 'versión original subtitulada',
        'versió original subtitulada', 'original version with spanish subtitles'
    ]

    has_high_priority = any(marker in text_lower for marker in high_priority)

    if has_high_priority:
        return min(1.0, 0.8 + (matches * 0.05))
    elif matches >= 3:
        return 0.9
    elif matches >= 2:
        return 0.7
    elif matches == 1:
        return 0.5
    else:
        return 0.0
