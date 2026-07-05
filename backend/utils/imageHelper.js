/**
 * Shared image utility for all market seeders.
 * Uses curated, reliable Unsplash photo IDs — no API key needed.
 */

const IMAGES = {
  // 🇮🇳 Indian Cities
  mumbai:      'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=800&q=80',
  delhi:       'https://images.unsplash.com/photo-1597040663342-45b6af3d91a5?auto=format&fit=crop&w=800&q=80',
  bengaluru:   'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
  chennai:     'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
  kolkata:     'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80',
  hyderabad:   'https://images.unsplash.com/photo-1609926078571-c6af5b16a52a?auto=format&fit=crop&w=800&q=80',
  jaipur:      'https://images.unsplash.com/photo-1477587458883-47145ed31769?auto=format&fit=crop&w=800&q=80',
  ahmedabad:   'https://images.unsplash.com/photo-1599030285193-0c79af17ecf6?auto=format&fit=crop&w=800&q=80',
  pune:        'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  lucknow:     'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=800&q=80',

  // 🌍 Global Cities
  newyork:     'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  london:      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  tokyo:       'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
  sydney:      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
  dubai:       'https://images.unsplash.com/photo-1546412414-8035e1776c9a?auto=format&fit=crop&w=800&q=80',
  paris:       'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  singapore:   'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?auto=format&fit=crop&w=800&q=80',
  losangeles:  'https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=800&q=80',

  // 🌤️ Weather
  rain:        'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=800&q=80',
  sunny:       'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=800&q=80',
  weather:     'https://images.unsplash.com/photo-1561553543-e4c7b608b98d?auto=format&fit=crop&w=800&q=80',
  storm:       'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=800&q=80',

  // ☄️ NASA / Space
  asteroid:    'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=800&q=80',
  space:       'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80',
  rocket:      'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=800&q=80',
  solar:       'https://images.unsplash.com/photo-1575881875475-31023242e3f9?auto=format&fit=crop&w=800&q=80',
  aurora:      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=800&q=80',

  // 🌪️ Natural Events
  wildfire:    'https://images.unsplash.com/photo-1536241578538-95a83e22d86a?auto=format&fit=crop&w=800&q=80',
  hurricane:   'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=800&q=80',
  flood:       'https://images.unsplash.com/photo-1583364261993-f3cc04bb79d5?auto=format&fit=crop&w=800&q=80',
  volcano:     'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=800&q=80',

  // 🏛️ Politics & Elections
  politics:    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80',
  election:    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
  congress:    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
  parliament:  'https://images.unsplash.com/photo-1555848962-6e79363ec58f?auto=format&fit=crop&w=800&q=80',
  whitehouse:  'https://images.unsplash.com/photo-1550399105-c4db5fb85c18?auto=format&fit=crop&w=800&q=80',
  india_gov:   'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',

  // 💰 Finance & Economy
  finance:     'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
  economy:     'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
  tesla:       'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80',
  apple:       'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&w=800&q=80',
  stock:       'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
  banking:     'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=800&q=80',

  // 🇮🇳 India Specific
  agriculture: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
  highway:     'https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=800&q=80',
  coffee:      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',

  // 🔬 Science
  science:     'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',

  // 🌐 Default
  trending:    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
  news:        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
};

/**
 * Returns a reliable image URL based on the question text.
 * @param {string} question
 * @returns {string} image URL
 */
function getImageForQuestion(question) {
  const q = question.toLowerCase();

  // Indian Cities
  if (q.includes('mumbai'))                     return IMAGES.mumbai;
  if (q.includes('delhi'))                      return IMAGES.delhi;
  if (q.includes('bengaluru') || q.includes('bangalore')) return IMAGES.bengaluru;
  if (q.includes('chennai'))                    return IMAGES.chennai;
  if (q.includes('kolkata'))                    return IMAGES.kolkata;
  if (q.includes('hyderabad'))                  return IMAGES.hyderabad;
  if (q.includes('jaipur'))                     return IMAGES.jaipur;
  if (q.includes('ahmedabad'))                  return IMAGES.ahmedabad;
  if (q.includes('pune'))                       return IMAGES.pune;
  if (q.includes('lucknow'))                    return IMAGES.lucknow;

  // Global Cities
  if (q.includes('new york'))                   return IMAGES.newyork;
  if (q.includes('london'))                     return IMAGES.london;
  if (q.includes('tokyo'))                      return IMAGES.tokyo;
  if (q.includes('sydney'))                     return IMAGES.sydney;
  if (q.includes('dubai'))                      return IMAGES.dubai;
  if (q.includes('paris'))                      return IMAGES.paris;
  if (q.includes('singapore'))                  return IMAGES.singapore;
  if (q.includes('los angeles'))                return IMAGES.losangeles;

  // Weather types
  if (q.includes('rain') || q.includes('precipitation') || q.includes('mm')) return IMAGES.rain;
  if (q.includes('°c') || q.includes('temperature'))  return IMAGES.weather;

  // NASA / Space
  if (q.includes('asteroid'))                   return IMAGES.asteroid;
  if (q.includes('wildfire') || q.includes('fire'))  return IMAGES.wildfire;
  if (q.includes('typhoon') || q.includes('tropical storm') || q.includes('hurricane')) return IMAGES.hurricane;
  if (q.includes('volcano'))                    return IMAGES.volcano;
  if (q.includes('flood'))                      return IMAGES.flood;
  if (q.includes('solar flare') || q.includes('flare')) return IMAGES.solar;
  if (q.includes('aurora') || q.includes('cme') || q.includes('coronal')) return IMAGES.aurora;
  if (q.includes('rocket') || q.includes('launch') || q.includes('spacecraft')) return IMAGES.rocket;
  if (q.includes('space') || q.includes('spaceflight')) return IMAGES.space;

  // Finance
  if (q.includes('tesla'))                      return IMAGES.tesla;
  if (q.includes('apple'))                      return IMAGES.apple;
  if (q.includes('above $') || q.includes('s&p') || q.includes('stock')) return IMAGES.stock;
  if (q.includes('rbi') || q.includes('interest rate')) return IMAGES.banking;
  if (q.includes('gst') || q.includes('gdp') || q.includes('economy') || q.includes('inflation')) return IMAGES.economy;
  if (q.includes('unemployment'))               return IMAGES.finance;

  // India specific
  if (q.includes('mandi') || q.includes('potato') || q.includes('onion') || q.includes('tomato') || q.includes('pm-kisan') || q.includes('farmer')) return IMAGES.agriculture;
  if (q.includes('nhai') || q.includes('highway'))    return IMAGES.highway;
  if (q.includes('eci') || q.includes('election commission') || q.includes('voter')) return IMAGES.election;
  if (q.includes('coffee'))                     return IMAGES.coffee;

  // Politics
  if (q.includes('trump') || q.includes('president') || q.includes('white house')) return IMAGES.whitehouse;
  if (q.includes('senate') || q.includes('gop') || q.includes('republican') || q.includes('democrat')) return IMAGES.congress;
  if (q.includes('election') || q.includes('vote') || q.includes('midterm')) return IMAGES.election;
  if (q.includes('parliament') || q.includes('law') || q.includes('bill')) return IMAGES.parliament;
  if (q.includes('india') || q.includes('modi') || q.includes('bjp')) return IMAGES.india_gov;
  if (q.includes('politics') || q.includes('policy'))  return IMAGES.politics;

  // Science
  if (q.includes('science') || q.includes('research')) return IMAGES.science;

  // Fallback
  return IMAGES.trending;
}

module.exports = { getImageForQuestion, IMAGES };
