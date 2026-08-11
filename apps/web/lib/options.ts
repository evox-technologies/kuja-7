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
  'British',
  'American',
  'Australian',
  'Canadian',
  'New Zealander',
  'Emirati',
  'Singaporean',
  'Malaysian',
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

export const DISTRICTS = [
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
]

export const RELIGIONS = ['Buddhist', 'Catholic', 'Christian', 'Hindu', 'Muslim', 'Other']

export const ETHNICITIES = ['Sinhala', 'Tamil', 'Moor', 'Burgher', 'Other']

export const PROFESSIONS = [
  'Accountant',
  'Architect',
  'Army Officer',
  'Bank Manager',
  'Business Analyst',
  'Chef',
  'Civil Engineer',
  'Data Scientist',
  'Dentist',
  'Doctor',
  'Electrician',
  'Entrepreneur',
  'Financial Analyst',
  'Government Officer',
  'Graphic Designer',
  'HR Manager',
  'Journalist',
  'Lawyer',
  'Lecturer',
  'Marketing Manager',
  'Mechanic',
  'Nurse',
  'Pharmacist',
  'Pilot',
  'Plumber',
  'Police Officer',
  'Project Manager',
  'Social Worker',
  'Software Engineer',
  'Teacher',
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
export const KUJA_NUMBERS = ['1', '2', '4', '7', '8', '12']

export const MIN_AGE = 18
export const MAX_AGE = 80

export const PHONE_COUNTRY_CODES = [
  { code: '+94', label: 'LK +94' },
  { code: '+91', label: 'IN +91' },
  { code: '+44', label: 'UK +44' },
  { code: '+1', label: 'US +1' },
  { code: '+61', label: 'AU +61' },
  { code: '+64', label: 'NZ +64' },
  { code: '+971', label: 'AE +971' },
  { code: '+974', label: 'QA +974' },
  { code: '+966', label: 'SA +966' },
  { code: '+65', label: 'SG +65' },
  { code: '+60', label: 'MY +60' },
]
