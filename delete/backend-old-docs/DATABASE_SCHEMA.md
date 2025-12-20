# Database Schema for VOSE Movies API

## Tables

### 1. movies
Primary table for movie information (one record per unique movie)

```sql
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(title)  -- Prevent duplicate movies
);
```

### 2. cinemas
Cinema locations across the Balearic Islands

```sql
CREATE TABLE cinemas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    island VARCHAR(50) NOT NULL,  -- Mallorca, Menorca, Ibiza
    address TEXT,
    website TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, location)
);
```

### 3. showtimes
Junction table linking movies to cinemas with specific showtimes

```sql
CREATE TABLE showtimes (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    cinema_id INTEGER NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
    showtime_date DATE NOT NULL,
    showtime_time TIME NOT NULL,
    version VARCHAR(20) DEFAULT 'VOSE',  -- VOSE, VOS, etc.
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,  -- Mark old showtimes as inactive
    UNIQUE(movie_id, cinema_id, showtime_date, showtime_time)
);
```

### 4. scraper_runs (optional - for monitoring)
Track scraper execution history

```sql
CREATE TABLE scraper_runs (
    id SERIAL PRIMARY KEY,
    scraper_name VARCHAR(100) NOT NULL,  -- 'cineciutat', 'aficine', 'unified'
    status VARCHAR(20) NOT NULL,  -- 'success', 'failed', 'partial'
    movies_found INTEGER DEFAULT 0,
    showtimes_found INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_seconds INTEGER
);
```

## Indexes for Performance

```sql
-- Fast filtering by island
CREATE INDEX idx_cinemas_island ON cinemas(island);

-- Fast showtime lookups
CREATE INDEX idx_showtimes_date ON showtimes(showtime_date);
CREATE INDEX idx_showtimes_cinema ON showtimes(cinema_id);
CREATE INDEX idx_showtimes_movie ON showtimes(movie_id);
CREATE INDEX idx_showtimes_active ON showtimes(is_active);

-- Fast title searches
CREATE INDEX idx_movies_title ON movies(title);
```

## API Query Examples

### Get all VOSE movies for Mallorca today:
```sql
SELECT m.title, c.name, c.location, s.showtime_time
FROM showtimes s
JOIN movies m ON s.movie_id = m.id
JOIN cinemas c ON s.cinema_id = c.id
WHERE c.island = 'Mallorca'
  AND s.showtime_date = CURRENT_DATE
  AND s.is_active = TRUE
ORDER BY s.showtime_time;
```

### Get all showtimes for a specific movie:
```sql
SELECT c.name, c.island, c.location, s.showtime_date, s.showtime_time
FROM showtimes s
JOIN cinemas c ON s.cinema_id = c.id
WHERE s.movie_id = ?
  AND s.showtime_date >= CURRENT_DATE
  AND s.is_active = TRUE
ORDER BY s.showtime_date, s.showtime_time;
```

## Data Cleanup Strategy

Run daily cleanup job to mark old showtimes as inactive:

```sql
UPDATE showtimes
SET is_active = FALSE
WHERE showtime_date < CURRENT_DATE;
```

## Migration from JSON to Database

Current JSON structure:
```json
{
  "title": "Oppenheimer",
  "cinema": "CineCiutat",
  "location": "Palma de Mallorca",
  "island": "Mallorca",
  "version": "VOSE",
  "showtimes": ["18:00", "20:30", "23:00"],
  "link": "https://...",
  "scraped_at": "2025-10-28T14:30:00"
}
```

Database insert logic:
1. Insert/get movie by title
2. Insert/get cinema by name + location
3. For each showtime, insert into showtimes table
4. Mark old showtimes as inactive
