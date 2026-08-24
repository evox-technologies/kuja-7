/**
 * Canonical option lists shared by the browse filters, the onboarding wizard
 * and the profile edit page. Values are stored verbatim in the profiles table
 * and sent as search params, so they must stay in sync with existing data
 * (see apps/api/prisma/seed.ts).
 */

export const COUNTRIES = [
  'Sri Lanka',
  'India',
  'United Kingdom',
  'United States',
  'Australia',
  'Canada',
  'New Zealand',
  'United Arab Emirates',
  'Qatar',
  'Saudi Arabia',
  'Singapore',
  'Malaysia',
  'Japan',
  'South Korea',
  'Germany',
  'France',
  'Italy',
  'Switzerland',
  'Other',
]

export const NATIONALITIES = [
  'Sri Lankan',
  'Indian',
  'Bangladeshi',
  'Pakistani',
  'Nepali',
  'Maldivian',
  'Chinese',
  'Japanese',
  'Korean',
  'British',
  'American',
  'Australian',
  'Canadian',
  'German',
  'French',
  'Italian',
  'Other',
]

/** Cities keyed by the COUNTRIES entries above. */
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'Sri Lanka': [
    'Anuradhapura',
    'Badulla',
    'Batticaloa',
    'Chilaw',
    'Colombo',
    'Dehiwala',
    'Galle',
    'Gampaha',
    'Hambantota',
    'Jaffna',
    'Kalutara',
    'Kandy',
    'Kegalle',
    'Kilinochchi',
    'Kurunegala',
    'Maharagama',
    'Mannar',
    'Matara',
    'Monaragala',
    'Moratuwa',
    'Mount Lavinia',
    'Mullativu',
    'Negombo',
    'Nugegoda',
    'Nuwara Eliya',
    'Polonnaruwa',
    'Puttalam',
    'Ratnapura',
    'Trincomalee',
    'Vavuniya',
    'Other',
  ],
  Australia: [
    'Adelaide',
    'Brisbane',
    'Cairns',
    'Canberra',
    'Darwin',
    'Geelong',
    'Gold Coast',
    'Hobart',
    'Melbourne',
    'Newcastle',
    'Perth',
    'Sunshine Coast',
    'Sydney',
    'Townsville',
    'Wollongong',
    'Other',
  ],
  India: [
    'Ahmedabad',
    'Bangalore',
    'Chennai',
    'Delhi',
    'Hyderabad',
    'Jaipur',
    'Kochi',
    'Kolkata',
    'Mumbai',
    'Pune',
    'Other',
  ],
  'United Kingdom': [
    'Birmingham',
    'Bristol',
    'Edinburgh',
    'Glasgow',
    'Leeds',
    'Leicester',
    'Liverpool',
    'London',
    'Manchester',
    'Sheffield',
    'Other',
  ],
  'United States': [
    'Atlanta',
    'Boston',
    'Chicago',
    'Dallas',
    'Houston',
    'Los Angeles',
    'New York',
    'San Francisco',
    'Seattle',
    'Washington DC',
    'Other',
  ],
  Canada: [
    'Calgary',
    'Edmonton',
    'Mississauga',
    'Montreal',
    'Ottawa',
    'Toronto',
    'Vancouver',
    'Winnipeg',
    'Other',
  ],
  'New Zealand': [
    'Auckland',
    'Christchurch',
    'Dunedin',
    'Hamilton',
    'Tauranga',
    'Wellington',
    'Other',
  ],
  'United Arab Emirates': ['Abu Dhabi', 'Ajman', 'Dubai', 'Sharjah', 'Other'],
  Qatar: ['Al Rayyan', 'Al Wakrah', 'Doha', 'Other'],
  'Saudi Arabia': ['Dammam', 'Jeddah', 'Mecca', 'Medina', 'Riyadh', 'Other'],
  Singapore: ['Singapore'],
  Malaysia: ['Ipoh', 'Johor Bahru', 'Kuala Lumpur', 'Penang', 'Shah Alam', 'Other'],
  Japan: ['Fukuoka', 'Kyoto', 'Nagoya', 'Osaka', 'Tokyo', 'Yokohama', 'Other'],
  'South Korea': ['Busan', 'Daegu', 'Incheon', 'Seoul', 'Other'],
  Germany: ['Berlin', 'Cologne', 'Frankfurt', 'Hamburg', 'Munich', 'Stuttgart', 'Other'],
  France: ['Lyon', 'Marseille', 'Nice', 'Paris', 'Toulouse', 'Other'],
  Italy: ['Florence', 'Milan', 'Naples', 'Rome', 'Turin', 'Other'],
  Switzerland: ['Basel', 'Bern', 'Geneva', 'Lausanne', 'Zurich', 'Other'],
  Maldives: ['Addu City', 'Fuvahmulah', 'Hithadhoo', 'Kulhudhuffushi', 'Male', 'Other'],
  Other: ['Other'],
}

/** Union of every known city — used when no country is selected yet. */
export const ALL_CITIES = Array.from(
  new Set(Object.values(CITIES_BY_COUNTRY).flat()),
).sort((a, b) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)))

/** Cities for a selected country; every known city when country is unset. */
export function citiesForCountry(country?: string): string[] {
  if (!country) return ALL_CITIES
  return CITIES_BY_COUNTRY[country] ?? ['Other']
}

export const DISTRICTS_BY_COUNTRY: Record<string, string[]> = {
  'Sri Lanka': [
    'Ampara',
    'Anuradhapura',
    'Badulla',
    'Batticaloa',
    'Colombo',
    'Galle',
    'Gampaha',
    'Hambantota',
    'Jaffna',
    'Kalutara',
    'Kandy',
    'Kegalle',
    'Kilinochchi',
    'Kurunegala',
    'Mannar',
    'Matara',
    'Monaragala',
    'Mullativu',
    'Nuwara Eliya',
    'Polonnaruwa',
    'Puttalam',
    'Ratnapura',
    'Trincomalee',
    'Vavuniya',
    'Other',
  ],
  Australia: [
    'Australian Capital Territory',
    'New South Wales',
    'Northern Territory',
    'Queensland',
    'South Australia',
    'Tasmania',
    'Victoria',
    'Western Australia',
    'Other',
  ],
  India: [
    'Andhra Pradesh',
    'Delhi',
    'Goa',
    'Gujarat',
    'Karnataka',
    'Kerala',
    'Maharashtra',
    'Punjab',
    'Rajasthan',
    'Tamil Nadu',
    'Telangana',
    'Uttar Pradesh',
    'West Bengal',
    'Other',
  ],
  'United Kingdom': [
    'England',
    'Northern Ireland',
    'Scotland',
    'Wales',
    'Other',
  ],
  'United States': [
    'California',
    'Florida',
    'Georgia',
    'Illinois',
    'Massachusetts',
    'New Jersey',
    'New York',
    'Pennsylvania',
    'Texas',
    'Washington',
    'Other',
  ],
  Canada: [
    'Alberta',
    'British Columbia',
    'Manitoba',
    'Ontario',
    'Quebec',
    'Saskatchewan',
    'Other',
  ],
  'New Zealand': [
    'Auckland',
    'Bay of Plenty',
    'Canterbury',
    'Otago',
    'Waikato',
    'Wellington',
    'Other',
  ],
  'United Arab Emirates': [
    'Abu Dhabi',
    'Ajman',
    'Dubai',
    'Fujairah',
    'Ras Al Khaimah',
    'Sharjah',
    'Umm Al Quwain',
    'Other',
  ],
  Qatar: ['Al Rayyan', 'Al Wakrah', 'Doha', 'Other'],
  'Saudi Arabia': ['Eastern Province', 'Makkah', 'Madinah', 'Riyadh', 'Other'],
  Singapore: ['Central', 'East', 'North', 'North-East', 'West', 'Other'],
  Malaysia: [
    'Johor',
    'Kedah',
    'Kelantan',
    'Kuala Lumpur',
    'Penang',
    'Perak',
    'Sabah',
    'Sarawak',
    'Selangor',
    'Other',
  ],
  Japan: [
    'Chubu',
    'Chugoku',
    'Hokkaido',
    'Kansai',
    'Kanto',
    'Kyushu',
    'Okinawa',
    'Shikoku',
    'Tohoku',
    'Other',
  ],
  'South Korea': [
    'Busan',
    'Daegu',
    'Gyeonggi',
    'Incheon',
    'Seoul',
    'Other',
  ],
  Germany: [
    'Baden-Württemberg',
    'Bavaria',
    'Berlin',
    'Hamburg',
    'Hesse',
    'North Rhine-Westphalia',
    'Other',
  ],
  France: [
    'Auvergne-Rhône-Alpes',
    'Île-de-France',
    "Provence-Alpes-Côte d'Azur",
    'Occitanie',
    'Other',
  ],
  Italy: [
    'Lazio',
    'Lombardy',
    'Piedmont',
    'Sicily',
    'Tuscany',
    'Veneto',
    'Other',
  ],
  Switzerland: ['Basel', 'Bern', 'Geneva', 'Vaud', 'Zurich', 'Other'],
  Maldives: [
    'Addu Atoll',
    'Haa Alifu',
    'Kaafu',
    'Male',
    'Seenu',
    'Other',
  ],
  Other: ['Other'],
}

/** Sri Lankan districts — kept for seed/filter compatibility. */
export const DISTRICTS = DISTRICTS_BY_COUNTRY['Sri Lanka'].filter(d => d !== 'Other')

export function districtsForCountry(country?: string): string[] {
  if (!country) return DISTRICTS
  return DISTRICTS_BY_COUNTRY[country] ?? ['Other']
}

export const RELIGIONS = [
  'Buddhism',
  'Hinduism',
  'Islam',
  'Roman Catholic',
  'Other Christian',
  'Other',
]

export const ETHNICITIES = ['Sinhala', 'Tamil', 'Moor', 'Burgher', 'Other']

export const CASTE_GROUPS: { label: string; options: string[] }[] = [
  {
    label: 'Sinhala caste categories',
    options: [
      'Govigama',
      'Karava',
      'Salagama',
      'Durava',
      'Wahumpura / Hakuru',
      'Berava',
      'Navandanna',
      'Bathgama',
      'Rodi',
      'Achari',
      'Kumbal',
      'Hunu',
      'Panna',
      'Dewa',
      'Oli',
      'Nakatti',
      'Radha',
      'Vahumpura',
      'Other',
      'Prefer not to say',
    ],
  },
  {
    label: 'Sri Lankan Tamil caste categories',
    options: [
      'Vellalar',
      'Karaiyar',
      'Koviyar',
      'Nalavar',
      'Pallar',
      'Paraiyar',
      'Mukkuvar',
      'Maravar',
      'Agamudaiyar',
      'Chettiar',
      'Brahmin',
      'Pandaram',
      'Vannar',
      'Ambattar',
      'Navithar',
      'Dhobi',
      'Other',
      'Prefer not to say',
    ],
  },
  {
    label: 'Malaiyaha / Indian Tamil communities',
    options: [
      'Pallar',
      'Paraiyar',
      'Vellalar',
      'Kallar',
      'Maravar',
      'Agamudaiyar',
      'Naidu',
      'Chettiar',
      'Brahmin',
      'Other',
      'Prefer not to say',
    ],
  },
]

export const PROFESSIONS = [
  'Student',
  'Software Engineer / IT',
  'Doctor / Healthcare',
  'Engineer',
  'Teacher / Lecturer',
  'Accountant / Finance',
  'Lawyer',
  'Government Employee',
  'Private Sector Employee',
  'Business Owner / Entrepreneur',
  'Banker',
  'Marketing / Sales',
  'Armed Forces / Police',
  'Farmer / Agriculture',
  'Driver / Transport',
  'Self-Employed',
  'Retired',
  'Unemployed',
  'Other',
]

export const CIVIL_STATUSES = ['Never Married', 'Divorced', 'Widowed', 'Separated']

export const EDUCATION_LEVELS = [
  'Up to GCE O/L',
  'Up to GCE A/L',
  'Diploma',
  'Professional Qualification',
  'Undergraduate',
  "Bachelor's Degree or Equivalent",
  'Post Graduate Diploma',
  "Master's Degree or Equivalent",
  'Phd or Post Doctoral',
]

export const FOOD_PREFS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Halal']
export const DRINKING_OPTS = ['Never', 'Occasionally', 'Regularly']
export const SMOKING_OPTS = ['Never', 'Occasionally', 'Regularly']
/**
 * The six kuja positions the horoscope readings actually distinguish.
 *
 * 'Other' is appended for every entry form: the API treats a blank kujaNumber
 * as an incomplete profile (auth.service.ts), which would lock anyone who
 * doesn't know their number — or would rather not give it — out of sending
 * interests. Picking 'Other' records that they declined, rather than a number.
 */
export const KNOWN_KUJA_NUMBERS = ['1', '2', '4', '7', '8', '12']
export const KUJA_OTHER = 'Other'
export const KUJA_NUMBERS = [...KNOWN_KUJA_NUMBERS, KUJA_OTHER]

/** False for a blank or 'Other' value, so display badges can skip a non-answer. */
export function hasKujaNumber(value?: string | null): boolean {
  return !!value && value !== KUJA_OTHER
}

export const MIN_AGE = 18
export const MAX_AGE = 80

export const PHONE_COUNTRY_CODES = [
  { code: '+94', label: 'LK +94', min: 9, max: 9, placeholder: '771234567' },
  { code: '+91', label: 'IN +91', min: 10, max: 10, placeholder: '9876543210' },
  { code: '+44', label: 'UK +44', min: 10, max: 10, placeholder: '7911123456' },
  { code: '+1', label: 'US/CA +1', min: 10, max: 10, placeholder: '2025550123' },
  { code: '+61', label: 'AU +61', min: 9, max: 9, placeholder: '412345678' },
  { code: '+64', label: 'NZ +64', min: 8, max: 10, placeholder: '211234567' },
  { code: '+971', label: 'AE +971', min: 9, max: 9, placeholder: '501234567' },
  { code: '+974', label: 'QA +974', min: 8, max: 8, placeholder: '33123456' },
  { code: '+966', label: 'SA +966', min: 9, max: 9, placeholder: '512345678' },
  { code: '+65', label: 'SG +65', min: 8, max: 8, placeholder: '81234567' },
  { code: '+60', label: 'MY +60', min: 9, max: 10, placeholder: '123456789' },
  { code: '+81', label: 'JP +81', min: 10, max: 10, placeholder: '9012345678' },
  { code: '+82', label: 'KR +82', min: 9, max: 10, placeholder: '1012345678' },
  { code: '+960', label: 'MV +960', min: 7, max: 7, placeholder: '7712345' },
  { code: '+39', label: 'IT +39', min: 9, max: 10, placeholder: '3123456789' },
  { code: '+49', label: 'DE +49', min: 10, max: 12, placeholder: '15123456789' },
  { code: '+33', label: 'FR +33', min: 9, max: 9, placeholder: '612345678' },
] as const

export type PhoneCountryCode = (typeof PHONE_COUNTRY_CODES)[number]['code']

export function phoneDigits(local: string): string {
  return local.replace(/\D/g, '').replace(/^0+/, '')
}

export function formatPhone(code: string, local: string): string {
  const digits = phoneDigits(local)
  return digits ? `${code} ${digits}` : ''
}

export function validatePhone(code: string, local: string, label: string): string | null {
  const digits = phoneDigits(local)
  if (!digits) return null
  const meta = PHONE_COUNTRY_CODES.find(c => c.code === code)
  const min = meta?.min ?? 7
  const max = meta?.max ?? 15
  if (digits.length < min || digits.length > max) {
    return min === max
      ? `${label} must be ${min} digits`
      : `${label} must be ${min}–${max} digits`
  }
  return null
}
