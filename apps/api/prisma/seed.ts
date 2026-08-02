import { PrismaClient, Gender } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ── Data pools ──────────────────────────────────────────────────────────────

const MALE_FIRST = [
  'Ravindu','Tharindu','Kasun','Nuwan','Lahiru','Dimuth','Sachith','Buddhika',
  'Malith','Chanaka','Isuru','Prabath','Dasun','Janith','Gihan','Supun',
  'Thilina','Kavinda','Amila','Sahan','Harsha','Roshan','Asanka','Dhanuka',
  'Maduranga','Rajitha','Suneth','Thisara','Nilupul','Chathura',
  'Aravind','Suresh','Vijay','Rajan','Kumaran','Shankar','Pradeep','Nimal',
  'Mohamed','Rizwan','Fawzan','Aslam',
];

const FEMALE_FIRST = [
  'Nimasha','Dilini','Sanduni','Thilini','Ayesha','Piumika','Chathuri','Hiruni',
  'Kavindi','Nadeesha','Sachini','Imesha','Dulani','Hashini','Upeksha','Malsha',
  'Sewwandi','Tharuka','Nisansala','Dinusha','Anushka','Rasika','Pradeepa',
  'Chathurika','Lakmali','Iresha','Harshani','Madushi','Nimesha','Ruwanthi',
  'Priya','Nithya','Kavitha','Deepika','Anuja','Subha','Lalitha','Meera',
  'Fathima','Zainab','Amina','Shazna',
];

const LAST_NAMES = [
  'Perera','Silva','Fernando','Dissanayake','Wijesinghe','Rajapaksa','Jayawardena',
  'Gunawardena','Bandara','Wickramasinghe','Gamage','Samarasinghe','Ranasinghe',
  'Pathirana','Herath','Kumara','Madushanka','Weerasinghe','Seneviratne',
  'Liyanage','Rupasinghe','Jayasena','Munasinghe','Rathnayake','Karunarathna',
  'Selvam','Krishnan','Murugan','Thambidurai','Ramasamy',
  'Ahamed','Razik','Farook','Ismail',
];

const CITIES = [
  'Colombo','Kandy','Galle','Negombo','Jaffna','Trincomalee','Batticaloa',
  'Kurunegala','Anuradhapura','Polonnaruwa','Badulla','Ratnapura','Matara',
  'Gampaha','Kalutara','Kegalle','Nuwara Eliya','Monaragala','Hambantota',
  'Vavuniya','Mannar','Mullativu','Kilinochchi','Puttalam','Chilaw',
  'Nugegoda','Maharagama','Dehiwala','Mount Lavinia','Moratuwa',
];

const DISTRICTS = [
  'Colombo','Kandy','Galle','Gampaha','Kalutara','Kurunegala','Matara',
  'Kandy','Ratnapura','Kegalle','Badulla','Nuwara Eliya','Anuradhapura',
  'Polonnaruwa','Trincomalee','Batticaloa','Ampara','Jaffna','Kilinochchi',
  'Mannar','Vavuniya','Mullativu','Puttalam','Hambantota','Monaragala',
];

const RELIGIONS = [
  ...Array(50).fill('Buddhist'),
  ...Array(20).fill('Catholic'),
  ...Array(15).fill('Hindu'),
  ...Array(10).fill('Muslim'),
  ...Array(5).fill('Christian'),
];

const ETHNICITIES = [
  ...Array(70).fill('Sinhala'),
  ...Array(15).fill('Tamil'),
  ...Array(10).fill('Moor'),
  ...Array(5).fill('Burgher'),
];

const CIVIL_STATUSES = [
  ...Array(70).fill('Never Married'),
  ...Array(20).fill('Divorced'),
  ...Array(8).fill('Widowed'),
  ...Array(2).fill('Separated'),
];

const PROFESSIONS = [
  'Software Engineer','Doctor','Lawyer','Teacher','Nurse','Accountant',
  'Civil Engineer','Architect','Pharmacist','Dentist','Business Analyst',
  'Marketing Manager','HR Manager','Financial Analyst','Lecturer',
  'Government Officer','Bank Manager','Police Officer','Army Officer',
  'Entrepreneur','Electrician','Mechanic','Plumber','Chef','Pilot',
  'Journalist','Graphic Designer','Data Scientist','Project Manager',
  'Social Worker',
];

const EDUCATION_LEVELS = [
  ...Array(5).fill('Up to GCE O/L'),
  ...Array(10).fill('Up to GCE A/L'),
  ...Array(15).fill('Diploma'),
  ...Array(10).fill('Professional Qualification'),
  ...Array(10).fill('Undergraduate'),
  ...Array(40).fill("Bachelor's Degree or Equivalent"),
  ...Array(10).fill('Post Graduate Diploma'),
  ...Array(20).fill("Master's Degree or Equivalent"),
  ...Array(10).fill('Phd or Post Doctoral'),
]

const HEIGHTS = [
  "5' 0\"","5' 1\"","5' 2\"","5' 3\"","5' 4\"","5' 5\"","5' 6\"",
  "5' 7\"","5' 8\"","5' 9\"","5' 10\"","5' 11\"","6' 0\"","6' 1\"",
];

const FOOD_PREFS = [
  ...Array(40).fill('Non-Vegetarian'),
  ...Array(30).fill('Vegetarian'),
  ...Array(20).fill('Halal'),
  ...Array(10).fill('Vegan'),
];

const DRINKING = [
  ...Array(60).fill('Never'),
  ...Array(30).fill('Occasionally'),
  ...Array(10).fill('Regularly'),
];

const SMOKING = [
  ...Array(80).fill('Never'),
  ...Array(15).fill('Occasionally'),
  ...Array(5).fill('Regularly'),
];

const KUJA_NUMBERS = ['1','2','3','4','5','6','7','8','9','10','11','12'];

const BIOS = [
  'Looking for a caring and understanding life partner to share life\'s journey.',
  'Simple and down-to-earth person seeking a genuine connection.',
  'Family-oriented individual who values honesty and trust above all.',
  'Career-focused but ready to start a new chapter with the right person.',
  'Love travelling and cooking. Seeking someone who shares similar values.',
  'God-fearing individual looking for a faithful partner for life.',
  'Optimistic person who believes in making every moment count.',
  'Passionate about my work and family. Looking for a supportive partner.',
  'Quiet and calm personality seeking a compatible life partner.',
  'Enjoy music, reading, and nature. Looking for a warm-hearted companion.',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomDOB(minAge: number, maxAge: number): Date {
  const now = new Date();
  const minYear = now.getFullYear() - maxAge;
  const maxYear = now.getFullYear() - minAge;
  const year = minYear + Math.floor(Math.random() * (maxYear - minYear + 1));
  const month = Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  return new Date(year, month, day);
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s/g, '.');
}

// ── Seed ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding 100 dummy profiles…');

  // Delete existing seeded profiles (identified by @seed.kuja7.lk email domain)
  const deleted = await prisma.profile.deleteMany({
    where: { email: { endsWith: '@seed.kuja7.lk' } },
  });
  if (deleted.count > 0) {
    console.log(`🗑   Removed ${deleted.count} old seed profiles`);
  }

  const profiles: Parameters<typeof prisma.profile.create>[0]['data'][] = [];

  for (let i = 0; i < 100; i++) {
    const gender: Gender = i < 50 ? Gender.MALE : Gender.FEMALE;
    const firstName = gender === Gender.MALE ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const lastName = pick(LAST_NAMES);
    const city = pick(CITIES);
    const district = pick(DISTRICTS);
    const email = `${slugify(firstName)}.${slugify(lastName)}.${i}@seed.kuja7.lk`;

    // Pair religion + ethnicity to be realistic
    const ethnicity = pick(ETHNICITIES);
    let religion: string;
    if (ethnicity === 'Moor') religion = 'Muslim';
    else if (ethnicity === 'Tamil') religion = Math.random() > 0.3 ? 'Hindu' : 'Catholic';
    else if (ethnicity === 'Burgher') religion = 'Christian';
    else religion = pick(['Buddhist', 'Buddhist', 'Buddhist', 'Catholic', 'Christian']);

    profiles.push({
      supabaseId:    randomUUID(),
      email,
      firstName,
      lastName,
      gender,
      dateOfBirth:   randomDOB(22, 45),
      isVerified:    true,
      isActive:      true,

      nationality:   'Sri Lankan',
      ethnicity,
      religion,
      caste:         undefined,
      civilStatus:   pick(CIVIL_STATUSES),
      height:        pick(HEIGHTS),
      bio:           pick(BIOS),

      country:       'Sri Lanka',
      city,
      stateDistrict: district,
      location:      `${city}, Sri Lanka`,

      profession:    pick(PROFESSIONS),
      educationLevel: pick(EDUCATION_LEVELS),

      drinking:      pick(DRINKING),
      smoking:       pick(SMOKING),
      foodPreference: pick(FOOD_PREFS),

      kujaNumber:    Math.random() > 0.3 ? pick(KUJA_NUMBERS) : undefined,
      birthDay:      undefined,

      images:        [],
    });
  }

  // Batch insert
  let created = 0;
  for (const data of profiles) {
    try {
      await prisma.profile.create({ data });
      created++;
    } catch (e) {
      // skip duplicate emails on re-run
      console.warn(`  ⚠ Skipped duplicate: ${data.email}`);
    }
  }

  console.log(`✅  Created ${created} profiles`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
