// Sources: résumé (Drive, Nov 2026), GitHub API, LeetCode and GeeksforGeeks public profiles (checked 2026-11-23).
export const profile = {
  name: 'Vimal Kumar Yadav',
  handle: 'vimalyad',
  role: 'Backend & Systems Engineer',
  location: 'Bengaluru, India',
  tagline:
    'I build the machinery underneath products: storage engines, caches, agent platforms and delivery pipelines, usually from first principles.',
  about: [
    'I am a Software Engineer Intern at Scaler AI Labs, where I ship production RL training environments (full-stack clones of real platforms used to train frontier models) and built an agentic platform that fixes QA-reported bugs, verifies the fix in a real browser and opens the PR. Before that I automated regression testing across four SaaS products at Neeto and was the founding backend engineer at Bricks Education.',
    'My favourite way to learn a system is to rebuild it: a relational database with ARIES recovery and MVCC, a CRDT-replicated SQL engine, a low-latency typeahead behind a consistent-hash ring. I study Computer Science at Scaler School of Technology and BITS Pilani, and I care about clear interfaces, measurable performance and code that stays maintainable after launch.',
  ],
  links: {
    github: 'https://github.com/vimalyad',
    githubAlt: 'https://github.com/vimalkryadav',
    linkedin: 'https://www.linkedin.com/in/vimal-kumar-yadav-58a7a5316/',
    leetcode: 'https://leetcode.com/u/VimalYad_2907/',
    gfg: 'https://www.geeksforgeeks.org/user/vimalyad2907/',
    resume: '/resume.pdf',
  },
  stack: {
    Languages: ['Java', 'Rust', 'TypeScript', 'Python', 'C++', 'Go', 'SQL'],
    'Backend & frameworks': ['Spring Boot', 'Node.js', 'FastAPI', 'axum', 'Tokio', 'Temporal', 'React', 'Next.js'],
    'Distributed systems': ['Kafka', 'Redis', 'CRDTs', 'MVCC', 'WAL/ARIES', 'Consistent hashing'],
    Databases: ['PostgreSQL', 'MySQL', 'SQLite', 'Qdrant', 'MongoDB'],
    'AI & data': ['LLM agents', 'RAG', 'LangChain', 'OpenEnv RL'],
    'Cloud & DevOps': ['Docker', 'Kubernetes', 'Helm', 'Argo CD', 'GitHub Actions', 'GCP'],
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
    period: 'Jun 2026 – Present',
    title: 'Software Engineer Intern',
    company: 'Scaler AI Labs',
    location: 'Bengaluru, India',
    points: [
      'Shipped 8 production RL training environments (high-fidelity Next.js + FastAPI + Docker clones of e-commerce, analytics, hotel-booking, health-records, billing, workflow, web-analytics and video-editing platforms) used to train models for leading frontier AI labs; 1,800+ commits',
      'Built an agentic bug-fixing platform (Java 25/Spring Boot, Temporal, Postgres) that fixes QA-reported bugs in sandboxed runs, verifies each in headless Chromium and opens PRs; first batch fixed 25 of 45 bugs at $3.90 per first-try fix',
      'Led an electronic health-records platform clone (700+ commits, 230+ tables, 700+ API endpoints) on a 15,000-patient synthetic dataset, closing 170+ QA-reported bugs',
      'Built a hotel booking & loyalty platform clone (9,947 hotels, 3.2M nightly rates, 75K photos) with 5.4× faster DB rebuilds via SQLite cache tuning',
    ],
  },
  {
    period: 'Feb 2026 – Apr 2026',
    title: 'Software Engineer Intern',
    company: 'Neeto (BigBinary)',
    location: 'Remote',
    points: [
      'Automated regression on 120+ user journeys across 4 SaaS products with Playwright and TypeScript, catching 8+ production defects',
      'Built NeetoCI pipelines with 4-shard parallel execution, PR-label triggers and GitHub/Slack notifications, cutting regression feedback from 4 hours to near-realtime at 95% coverage',
    ],
  },
  {
    period: 'Apr 2025 – Sep 2025',
    title: 'Founding Backend Engineer',
    company: 'Bricks Education',
    location: 'Pilani / Remote',
    points: [
      'Sole backend developer through 3 product pivots (LMS, social platform, school curriculum), shipping each iteration from scratch in Spring Boot',
      'Built course delivery, assignment submission and student-interaction APIs; onboarded 2 schools in Pilani and iterated on live user feedback',
    ],
  },
]

export const education = [
  {
    period: 'Aug 2024 – Present',
    institution: 'Scaler School of Technology',
    degree: 'Undergraduate Program in Computer Science',
    detail: 'CGR 9.32 / 10 · Bengaluru',
  },
  {
    period: '2024 – 2027',
    institution: 'BITS Pilani',
    degree: 'B.Sc. (Hons.) Computer Science',
    detail: 'CGPA 8.63 / 10',
  },
]

export const achievements = [
  { value: 'Rank 158', label: 'Meta × Hugging Face RL Hackathon', detail: 'out of 15,000+ teams globally' },
  { value: '1,000+', label: 'LeetCode problems solved', detail: '180+ hard, with a 500+ day streak' },
  { value: 'Rank #2', label: 'GeeksforGeeks, institute', detail: 'at Scaler School of Technology; 400+ problems' },
  { value: 'iQOO 2026', label: 'Hackathon build', detail: 'Lurkr, a 5-agent market-intelligence PWA' },
]
