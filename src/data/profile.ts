export const profile = {
  name: 'Vimal Kumar Yadav',
  handle: 'vimalyad',
  role: 'Backend & Systems Engineer',
  location: 'Bengaluru, India',
  tagline:
    'I build the machinery underneath products: storage engines, caches, rate limiters and delivery pipelines, usually from first principles.',
  about: [
    'I build backend-heavy products that go from a rough idea to a production system. Recent work spans school-facing platforms, SaaS test automation at Neeto, Kafka and Redis-backed delivery architecture, document-grounded AI workflows, and Rust/Linux systems tooling.',
    'My favourite way to learn a system is to rebuild it: a relational database with crash recovery, a CRDT-replicated SQL engine, a multi-threaded HTTP server on raw sockets. I care about clear interfaces, measurable performance, and code that stays maintainable after launch.',
  ],
  links: {
    github: 'https://github.com/vimalyad',
    githubAlt: 'https://github.com/vimalkryadav',
    linkedin: 'https://www.linkedin.com/in/vimal-kumar-yadav-58a7a5316/',
    resume: '/resume.pdf',
  },
  stack: {
    Backend: ['Java', 'Spring Boot', 'Kafka', 'Redis', 'PostgreSQL', 'MongoDB'],
    Systems: ['Rust', 'C++', 'Linux', 'Go', 'Database internals'],
    'DevOps': ['Docker', 'Kubernetes', 'Helm', 'Argo CD', 'Terraform', 'GitHub Actions'],
    'Frontend & AI': ['TypeScript', 'React', 'Playwright', 'RAG', 'LLM agents'],
  } as Record<string, string[]>,
}

export type Role = {
  period: string
  title: string
  company: string
  location: string
  points: string[]
}

export const experience: Role[] = [
  {
    period: 'Feb 2026 – Apr 2026',
    title: 'SDE Intern',
    company: 'Neeto (BigBinary)',
    location: 'Remote',
    points: [
      'Expanded automated test coverage across 4 SaaS products using Playwright and TypeScript',
      'Replaced manual QA on critical user journeys with reliable, repeatable browser automation',
      'Built NeetoCI pipelines with 4-shard parallel Playwright runs, PR-label triggers, and GitHub/Slack notifications',
    ],
  },
  {
    period: 'Apr 2025 – Sep 2025',
    title: 'Founding Backend Engineer',
    company: 'Bricks Education',
    location: 'Pilani / Remote',
    points: [
      'Owned backend development through 3 product pivots: LMS, social platform, and school curriculum platform',
      'Shipped course delivery, assignment submission, and student-interaction APIs from scratch in Spring Boot',
      'Supported onboarding for 2 schools in Pilani and iterated directly from live user feedback',
    ],
  },
]

export const education = [
  {
    period: '2024 – 2027',
    institution: 'BITS Pilani',
    degree: 'B.Sc. Computer Science',
    detail: 'DSA, DBMS, Operating Systems, Computer Networks, OOP, Distributed Systems',
  },
  {
    period: '2022',
    institution: 'MPVM Ganga Gurukulam',
    degree: 'Class 12',
    detail: '85.40% · Prayagraj, Uttar Pradesh',
  },
]

export const achievements = [
  { value: 'Rank 158', label: 'Meta × Hugging Face RL Hackathon', detail: 'among 15,000+ teams' },
  { value: '500+ days', label: 'LeetCode streak', detail: 'long-running DSA practice habit' },
  { value: '8 services', label: 'Namora architecture', detail: 'Spring Boot, Kafka, Redis GEO' },
]
