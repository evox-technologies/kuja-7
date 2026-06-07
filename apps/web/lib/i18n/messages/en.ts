export const en = {
  meta: {
    title: "Kuja7.lk — Sri Lanka's Matrimonial Platform",
    description: "Find your life partner. Sri Lanka's trusted matrimonial platform.",
  },
  nav: {
    brand: 'LOGO',
    links: [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
      { href: '/pricing', label: 'Pricing' },
    ],
    login: 'Log In',
    join: "Let's Join",
  },
  hero: {
    lookingFor: 'Looking For',
    bride: 'Bride',
    groom: 'Groom',
    ageRange: 'Age Range',
    min: 'Min',
    max: 'Max',
    searchNow: 'Search Now',
  },
  footer: {
    brand: 'Kuja7.lk',
    blurb:
      "Sri Lanka's leading matrimonial platform, dedicated to bringing hearts together across the island and the globe.",
    quickLinksTitle: 'Quick Links',
    supportLinksTitle: 'Help & Support',
    quickLinks: ['Search Profiles', 'Membership Plans', 'Safety Tips', 'Success Stories'],
    supportLinks: ['Contact Us', 'FAQs', 'Terms of Service', 'Privacy Policy'],
  },
  benefits: {
    title: 'Our Benefits',
    subtitle: 'Why thousands trust Kuja7.lk to find their perfect match.',
    statsMembers: '70+ Members',
    items: [
      {
        title: 'Advanced Search & Filters',
        description:
          'Find the right partner using filters like age, religion, profession, location, and more.',
      },
      {
        title: 'Private Chat',
        description: 'Start secure conversations only when both users show interest.',
      },
      {
        title: 'Safe & Secure',
        description:
          'Every profile is manually verified by our team to ensure your safety and privacy at all times.',
      },
      {
        title: 'Real-Time Notifications',
        description: 'Get instant alerts for new matches, messages, and profile activity.',
      },
      {
        title: 'Express Interest & Shortlist',
        description: 'Like profiles, send interests, and save your favorites to revisit anytime.',
      },
      {
        title: 'Trusted by Thousands',
        description:
          'Over 50,000 Sri Lankans have found their meaningful connections through Kuja7.lk.',
      },
      {
        title: 'Modern Design',
        description: 'A beautiful, mobile-friendly experience designed for speed and clarity.',
      },
      {
        title: 'Easy to Use',
        description: 'Simple steps to create a profile, find matches, and start conversations.',
      },
      {
        title: 'Support Team',
        description: 'Friendly support whenever you need help.',
      },
    ],
  },
  howItWorks: {
    title: 'How It Works',
    subtitle: 'Start your journey in 3 simple steps.',
    steps: [
      {
        title: 'Create Profile',
        description: 'Sign up and complete your profile to get started.',
      },
      {
        title: 'Find Matches',
        description: 'Browse verified profiles and shortlist your favorites.',
      },
      {
        title: 'Start Chatting',
        description: 'Connect only when interest is mutual and chat privately.',
      },
    ],
    cta: "Let's Start",
  },
  auth: {
    layoutTitle: 'Log In',
    login: {
      title: 'Welcome Back',
      subtitle: 'Log in to continue your journey.',
      email: 'Email',
      emailPlaceholder: 'your@email.com',
      password: 'Password',
      login: 'Log In',
      dontHaveAccount: "Don't have an account?",
      createAccount: 'Create one',
    },
    register: {
      title: 'Create Account',
      subtitle: 'Find meaningful connections for marriage.',
      continueWithEmail: 'Continue With Email',
      verifyEmailTitle: 'Verify Email',
      verifyEmailSubtitlePrefix: 'Enter the 6-digit code sent to',
      verifying: 'Verifying…',
      verify: 'Verify',
      changeEmail: 'Change email',
      setPasswordTitle: 'Set Log In Password',
      setPasswordSubtitle: 'Choose a secure password for your account.',
      confirmPasswordPlaceholder: 'Confirm password',
      creating: 'Creating…',
      continue: 'Continue',
      sending: 'Sending…',
      or: 'or',
      continueWithGoogle: 'Continue with Google',
      alreadyHaveAccount: 'Already have an account?',
      signIn: 'Sign in',
      passwordMin: 'Password must be at least 8 characters.',
      passwordMismatch: 'Passwords do not match.',
    },
    onboarding: {
      requiredFields: 'Please fill in all required fields.',
      somethingWentWrong: 'Something went wrong.',
      step1Title: 'Complete Your Profile',
      step1Subtitle: 'Tell us a little about yourself to get started.',
      firstName: 'First Name',
      firstNamePlaceholder: 'First name',
      lastName: 'Last Name',
      lastNamePlaceholder: 'Last name',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      dateOfBirth: 'Date of Birth',
      continue: 'Continue',
      step2Title: 'A Bit More About You',
      step2Subtitle: 'These help others find meaningful matches. All optional.',
      religion: 'Religion',
      religionPlaceholder: 'e.g. Islam, Christianity…',
      profession: 'Profession',
      professionPlaceholder: 'e.g. Engineer, Teacher…',
      location: 'Location',
      locationPlaceholder: 'e.g. London, UK',
      creatingProfile: 'Creating profile…',
      getStarted: 'Get Started',
      back: 'Back',
    },
    callback: {
      completing: 'Completing sign in…',
    },
    google: {
      redirecting: 'Redirecting…',
    },
    successModal: {
      title: "You're all set!",
      subtitle: 'Your account has been created successfully.',
      completeProfile: 'Complete Profile',
      skip: 'Skip For Later',
    },
  },
  dashboard: {
    logout: 'Log out',
    upgrade: 'Upgrade',
    tabs: {
      home: 'Home',
      interests: 'Interests',
      mutual: 'Mutual Interests',
      chat: 'Chat',
    },
    chat: {
      messages: 'Messages',
      search: 'Search conversations',
      emptyConversations: 'No conversations yet.',
      youPrefix: 'You:',
      writeMessage: 'Write a message…',
      loadEarlier: 'Load earlier messages',
      selectConversation: 'Select a conversation to start chatting.',
      send: 'Send',
      failedToSend: 'Failed to send message. Please try again.',
    },
  },
} as const

export type EnMessages = typeof en

