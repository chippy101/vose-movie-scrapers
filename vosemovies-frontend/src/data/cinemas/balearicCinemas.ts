import { Cinema } from '../../types/Cinema';

/**
 * Comprehensive Cinema Database for Balearic Islands
 * Updated: 2025-10-15
 * Covers: Mallorca, Menorca, Ibiza
 */

export const BALEARIC_CINEMAS: Cinema[] = [
  // ===============================================
  // MALLORCA - Palma
  // ===============================================
  {
    id: 'cine-ciutat-palma',
    name: 'CineCiutat',
    chain: 'Independent',
    logoUrl: 'https://cineciutat.org/themes/cineciutat/assets/images/logo.png',
    location: {
      lat: 39.5850,
      lng: 2.6494,
      address: "Carrer de l'Emperadriu Eugènia, 6",
      city: 'Palma',
      postalCode: '07010',
      region: 'Mallorca',
      district: "Camp Redó",
      landmarks: ['S\'Escorxador cultural center', 'Independent cinema cooperative']
    },
    voseSupport: 'specialist', // ALL movies in original version
    contact: {
      phone: '971 205 453',
      email: 'contact@cineciutat.org',
      website: 'https://cineciutat.org/en'
    },
    ticketPricing: {
      regular: 7.50,
      currency: 'EUR',
      discounts: [
        { day: 'Monday', price: 5.00, description: 'Monday discount' },
        { day: 'Wednesday', price: 3.90, description: 'Best deal - Wednesday special' }
      ]
    },
    features: {
      parking: false,
      restaurant: false
    },
    source: 'Manual',
    lastUpdated: '2025-10-15T00:00:00.000Z',
    verificationStatus: 'verified',
    metadata: {
      specialization: 'VOSE specialist - all movies in original version',
      island: 'Mallorca'
    }
  },
  {
    id: 'ocimax-palma',
    name: 'Ocimax Palma (Porto Pi)',
    chain: 'Aficine',
    logoUrl: 'https://www.aficine.com/wp-content/uploads/2016/01/logo-aficine-blanco.png',
    location: {
      lat: 39.5514,
      lng: 2.6210,
      address: 'Centro Comercial Porto Pi, Avenida Gabriel Roca, 54',
      city: 'Palma',
      postalCode: '07015',
      region: 'Mallorca',
      landmarks: ['Porto Pi Shopping Centre', 'Waterfront', 'Near marina']
    },
    voseSupport: 'frequent',
    contact: {
      website: 'https://aficine.com/en/cine/ocimaxpalma/'
    },
    features: {
      parking: true,
      restaurant: true
    },
    source: 'Manual',
    lastUpdated: '2025-10-15T00:00:00.000Z',
    verificationStatus: 'verified',
    metadata: {
      network: 'Aficine',
      island: 'Mallorca'
    }
  },
  {
    id: 'rivoli-palma',
    name: 'Rívoli',
    chain: 'Aficine',
    logoUrl: 'https://www.aficine.com/wp-content/uploads/2016/01/logo-aficine-blanco.png',
    location: {
      lat: 39.5788,
      lng: 2.6499,
      address: "Carrer d'Antoni Marquès, 25",
      city: 'Palma',
      postalCode: '07003',
      region: 'Mallorca',
      district: 'Bons Aires',
      landmarks: ['Historic cinema', 'Near city center']
    },
    voseSupport: 'frequent',
    contact: {
      website: 'https://aficine.com/taxonomy-cine/rivoli/'
    },
    features: {
      parking: false,
      restaurant: false
    },
    source: 'Manual',
    lastUpdated: '2025-10-15T00:00:00.000Z',
    verificationStatus: 'verified',
    metadata: {
      network: 'Aficine',
      historic: true,
      island: 'Mallorca'
    }
  },
  {
    id: 'augusta-palma',
    name: 'Augusta',
    chain: 'Aficine',
    logoUrl: 'https://www.aficine.com/wp-content/uploads/2016/01/logo-aficine-blanco.png',
    location: {
      lat: 39.5767,
      lng: 2.6535,
      address: 'Av. del Gran i General Consell, 2 (Plaza España)',
      city: 'Palma',
      postalCode: '07003',
      region: 'Mallorca',
      district: 'Canavall',
      landmarks: ['Plaza España', 'Central location']
    },
    voseSupport: 'frequent',
    contact: {
      website: 'https://aficine.com/en/cine/augusta/'
    },
    features: {
      parking: false,
      restaurant: false
    },
    source: 'Manual',
    lastUpdated: '2025-10-15T00:00:00.000Z',
    verificationStatus: 'verified',
    metadata: {
      network: 'Aficine',
      island: 'Mallorca'
    }
  },
  {
    id: 'artesiete-fan',
    name: 'Artesiete FAN Mallorca',
    chain: 'Artesiete',
    location: {
      lat: 39.5530,
      lng: 2.7068,
      address: 'FAN Mallorca Shopping Centre, Carrer del Cardenal Rossell, s/n',
      city: 'Palma',
      postalCode: '07007',
      region: 'Mallorca',
      landmarks: ['FAN Mallorca Shopping Centre', 'Near airport', 'Coll d\'en Rabassa']
    },
    voseSupport: 'frequent',
    features: {
      parking: true,
      restaurant: true,
      dolbyAtmos: true
    },
    contact: {
      phone: '971 424 971',
      email: 'fan@artesiete.es',
      website: 'https://fan.artesiete.es/'
    },
    source: 'Manual',
    lastUpdated: '2025-10-15T00:00:00.000Z',
    verificationStatus: 'verified',
    metadata: {
      screens: 8,
      island: 'Mallorca'
    }
  },

  // ===============================================
  // MALLORCA - Marratxi / Festival Park
  // ===============================================
  {
    id: 'cinesa-festival-park',
    name: 'Cinesa Festival Park 3D IMAX',
    chain: 'Cinesa',
    location: {
      lat: 39.6337,
      lng: 2.7319,
      address: 'Mallorca Fashion Outlet, Autopista Palma-Inca, km 7.1',
      city: 'Marratxi',
      postalCode: '07141',
      region: 'Mallorca',
      landmarks: ['Mallorca Fashion Outlet', 'Near airport', 'Festival Park']
    },
    voseSupport: 'occasional',
    features: {
      imax: true,
      parking: true,
      restaurant: true
    },
    contact: {
      website: 'https://www.cinesa.es/cines/festival-park'
    },
    source: 'Manual',
    lastUpdated: '2025-10-15T00:00:00.000Z',
    verificationStatus: 'verified',
    metadata: {
      note: 'Website protected by Cloudflare - scraping difficult',
      island: 'Mallorca'
    }
  },

  // ===============================================
  // MALLORCA - Manacor
  // ===============================================
  {
    id: 'manacor-aficine',
    name: 'Manacor',
    chain: 'Aficine',
    logoUrl: 'https://www.aficine.com/wp-content/uploads/2016/01/logo-aficine-blanco.png',
    location: {
      lat: 39.5649,
      lng: 3.2171,
      address: 'Carrer Bas, 7',
      city: 'Manacor',
      postalCode: '07500',
      region: 'Mallorca'
    },
    voseSupport: 'frequent',
    contact: {
      website: 'https://aficine.com/en/cine/manacor/'
    },
    features: {
      parking: true
    },
    source: 'Manual',
    lastUpdated: '2025-10-15T00:00:00.000Z',
    verificationStatus: 'verified',
    metadata: {
      network: 'Aficine',
      island: 'Mallorca'
    }
  },

  // ===============================================
  // MENORCA - Maó
  // ===============================================
  {
    id: 'ocimax-mao',
    name: 'Ocimax Maó',
    chain: 'Aficine',
    logoUrl: 'https://www.aficine.com/wp-content/uploads/2016/01/logo-aficine-blanco.png',
    location: {
      lat: 39.8856,
      lng: 4.2637,
      address: 'C. Santiago Ramón y Cajal, 15',
      city: 'Maó',
      postalCode: '07702',
      region: 'Menorca'
    },
    voseSupport: 'frequent',
    contact: {
      website: 'https://aficine.com/en/cine/ocimaxmahon/'
    },
    features: {
      parking: true,
      restaurant: false
    },
    source: 'Manual',
    lastUpdated: '2025-10-15T00:00:00.000Z',
    verificationStatus: 'verified',
    metadata: {
      network: 'Aficine',
      island: 'Menorca'
    }
  },

  // ===============================================
  // MENORCA - Ciutadella
  // ===============================================
  {
    id: 'moix-negre',
    name: 'Cines Moix Negre',
    chain: 'Independent',
    location: {
      lat: 40.0009,
      lng: 3.8459,
      address: 'Carrer de Sant Antoni Maria Claret, 1',
      city: 'Ciutadella',
      postalCode: '07760',
      region: 'Menorca'
    },
    voseSupport: 'occasional',
    contact: {
      website: 'http://www.cinesmoixnegre.org/'
    },
    features: {
      parking: true
    },
    source: 'Manual',
    lastUpdated: '2025-10-15T00:00:00.000Z',
    verificationStatus: 'verified',
    metadata: {
      type: 'independent',
      island: 'Menorca'
    }
  },

  // ===============================================
  // IBIZA - Eivissa
  // ===============================================
  {
    id: 'multicines-eivissa',
    name: 'Multicines Eivissa',
    chain: 'Aficine',
    logoUrl: 'https://www.aficine.com/wp-content/uploads/2016/01/logo-aficine-blanco.png',
    location: {
      lat: 38.9124,
      lng: 1.4227,
      address: 'Carrer des Cubells, s/n',
      city: 'Eivissa',
      postalCode: '07800',
      region: 'Ibiza'
    },
    voseSupport: 'frequent',
    contact: {
      website: 'https://aficine.com/en/cine/eivissa/'
    },
    features: {
      parking: true,
      restaurant: false
    },
    source: 'Manual',
    lastUpdated: '2025-10-15T00:00:00.000Z',
    verificationStatus: 'verified',
    metadata: {
      network: 'Aficine',
      island: 'Ibiza',
      note: 'Main cinema in Ibiza after competitor closed'
    }
  }
];

// Helper functions
export const getCinemasByIsland = (island: 'Mallorca' | 'Menorca' | 'Ibiza') => {
  return BALEARIC_CINEMAS.filter(cinema =>
    cinema.metadata?.island === island || cinema.location.region === island
  );
};

export const getCinemasByVOSESupport = (supportLevel: string) => {
  return BALEARIC_CINEMAS.filter(cinema => cinema.voseSupport === supportLevel);
};

export const getCinemasByChain = (chain: string) => {
  return BALEARIC_CINEMAS.filter(cinema =>
    cinema.chain?.toLowerCase() === chain.toLowerCase()
  );
};

export const getVOSESpecialistCinemas = () => {
  return BALEARIC_CINEMAS.filter(cinema => cinema.voseSupport === 'specialist');
};

export const getAficineCinemas = () => {
  return BALEARIC_CINEMAS.filter(cinema => cinema.chain === 'Aficine');
};

// Get cinemas within a radius (in km) from a given location
export const getCinemasWithinRadius = (
  latitude: number,
  longitude: number,
  radiusKm: number
): Cinema[] => {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  return BALEARIC_CINEMAS.filter(cinema => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(cinema.location.lat - latitude);
    const dLng = toRadians(cinema.location.lng - longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(latitude)) * Math.cos(toRadians(cinema.location.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusKm;
  }).sort((a, b) => {
    // Sort by distance
    const distanceA = Math.sqrt(
      Math.pow(a.location.lat - latitude, 2) +
      Math.pow(a.location.lng - longitude, 2)
    );
    const distanceB = Math.sqrt(
      Math.pow(b.location.lat - latitude, 2) +
      Math.pow(b.location.lng - longitude, 2)
    );
    return distanceA - distanceB;
  });
};

// Statistics
export const CINEMA_STATS = {
  total: BALEARIC_CINEMAS.length,
  byIsland: {
    Mallorca: getCinemasByIsland('Mallorca').length,
    Menorca: getCinemasByIsland('Menorca').length,
    Ibiza: getCinemasByIsland('Ibiza').length
  },
  byVOSESupport: {
    specialist: getCinemasByVOSESupport('specialist').length,
    frequent: getCinemasByVOSESupport('frequent').length,
    occasional: getCinemasByVOSESupport('occasional').length
  },
  byChain: {
    Aficine: getAficineCinemas().length,
    Independent: getCinemasByChain('Independent').length,
    Cinesa: getCinemasByChain('Cinesa').length,
    Artesiete: getCinemasByChain('Artesiete').length,
    Ocimax: getCinemasByChain('Ocimax').length
  }
};

// Cinema data for testing VOSE detection
export const SAMPLE_CINEMA_LISTINGS = [
  {
    cinema: 'CineCiutat',
    text: 'Poor Things - VOSE - 18:30, 21:00',
    expected: true,
    confidence: 0.85
  },
  {
    cinema: 'CineCiutat',
    text: 'The Zone of Interest - Original Version with Spanish subtitles - 19:15',
    expected: true,
    confidence: 0.85
  },
  {
    cinema: 'Ocimax Palma',
    text: 'Barbie - VOSE - 16:00, 18:30, 21:00',
    expected: true,
    confidence: 0.7
  },
  {
    cinema: 'Ocimax Palma',
    text: 'Oppenheimer - Doblada al español - 17:00, 20:00',
    expected: false,
    confidence: 0.1
  },
  {
    cinema: 'Cinesa Festival Park',
    text: 'Top Gun Maverick - IMAX - English with Spanish subtitles - 20:15',
    expected: true,
    confidence: 0.6
  },
  {
    cinema: 'Unknown',
    text: 'Dune: Part Two showing in original English at 19:30',
    expected: true,
    confidence: 0.7
  }
];

export default BALEARIC_CINEMAS;
