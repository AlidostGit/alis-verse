/**
 * Ali Dost's career, as the landmarks on the hill present it. Sources: Ali's resume (2026) and
 * his LinkedIn profile, https://www.linkedin.com/in/ali-dost-0a24a4113/ (experience, projects,
 * certifications, articles and recommendations). Pure data, unit tested for completeness.
 */

export const PROFILE = {
  name: 'Ali Dost',
  headline: 'Product-Minded Engineer and Tech Leader | AI-Native Building, Data and Customer Outcomes',
  location: 'Dubai, UAE',
  email: 'ad.bandanna@gmail.com',
  linkedin: 'https://www.linkedin.com/in/ali-dost-0a24a4113/',
  github: 'https://github.com/AlidostGit',
  motto: 'If knowledge is power, learning is my superpower.',
  mission:
    'I build the systems that make sustainability operations run. The mission underneath all of it is closing the food-to-soil loop: helping businesses divert food waste from landfills, track it with precision, and turn it into something useful.',
  belief: 'Systems do not fail, people do. If chaos is systemised, it breeds systemic chaos.',
  summary:
    'Product-minded technical lead who builds first and manages second. Uses AI daily to prototype, analyse data and automate workflows. Five years at Motive (formerly KeepTruckin) in customer-facing technical roles, then AI forecasting at Music Tribe, and now Technical Lead at The Waste Lab.',
} as const

export type LandmarkId = 'welcome' | 'roots' | 'motive' | 'musictribe' | 'wastelab' | 'projects' | 'learning' | 'play' | 'ai'

export type Role = {
  title: string
  org: string
  dates: string
  place?: string
  points: string[]
}

export type Landmark = {
  id: LandmarkId
  /** Short label for the compass and the interaction prompt. */
  label: string
  /** What the prompt says: "E  Inspect the crashed biplane". */
  verb: string
  kicker: string
  heading: string
  intro: string
  /** A short, witty behind-the-scenes story and what Ali learned there. */
  story?: { tale: string; learned: string }
  roles: Role[]
  /** Highlight numbers shown as large stat chips. */
  stats?: { value: string; label: string }[]
  skills: string[]
  /** Optional outbound links shown at the panel foot. */
  links?: { label: string; url: string }[]
  /** Accent colour for the panel and the compass pip. */
  color: string
}

export const LANDMARKS: readonly Landmark[] = [
  {
    id: 'welcome',
    label: 'Welcome stone',
    verb: 'Read the welcome stone',
    kicker: "Ali's Verse",
    heading: 'Ali Dost',
    intro: PROFILE.headline,
    story: {
      tale: 'Short version: Ali fixed one laptop, accidentally opened a help desk, turned that into a support career, led a team, then started building the products himself. The long version is this hill. It has sheep.',
      learned: 'Every role taught a new layer: support taught empathy, data taught honesty, product management taught saying no, and leadership taught that people are the real system.',
    },
    roles: [
      {
        title: 'Who is up here',
        org: 'Dubai, UAE',
        dates: 'Since 2018',
        points: [
          PROFILE.summary,
          PROFILE.mission,
          `"${PROFILE.belief}"`,
          `${PROFILE.motto}`,
        ],
      },
      {
        title: "The short version of who's up here",
        org: 'Multan \u2192 Islamabad \u2192 Dubai',
        dates: '',
        points: [
          'Electrical engineer who discovered that fixing a classmate\u2019s laptop and fixing a Fortune 500 integration use the exact same muscle: listen first, then simplify.',
          'Five roles, one belief underneath all of them: systems do not fail, people do, so build the system that makes the right thing the easy thing.',
          'Picked problems over titles. Has been a lecturer, a QA analyst, a Developer Support Lead Engineer and a product owner, roughly in that order, because each one taught the next.',
          'Still answers messages at odd hours, because the waste truck does not wait for a sprint planning meeting.',
        ],
      },
      {
        title: 'How to explore',
        org: 'Eight landmarks on this hill',
        dates: '',
        points: [
          'Each landmark is a chapter of the career. Walk up to one and press E to open it.',
          'The compass at the top of the screen points to the chapters you have not opened yet.',
          'Open them all to light every star in the sky.',
        ],
      },
    ],
    stats: [
      { value: '8+', label: 'years in tech' },
      { value: '3,800+', label: 'SKUs forecast with AI' },
      { value: '98%', label: 'SLA kept as a team lead' },
      { value: '1,867', label: 'LinkedIn followers' },
    ],
    skills: ['Technical leadership', 'Product discovery', 'AI-native building', 'Data platforms', 'Customer outcomes'],
    links: [
      { label: 'LinkedIn profile', url: PROFILE.linkedin },
      { label: 'GitHub', url: PROFILE.github },
      { label: 'Email Ali', url: `mailto:${PROFILE.email}` },
    ],
    color: '#d8323f',
  },
  {
    id: 'roots',
    label: 'Crashed biplane',
    verb: 'Inspect the crashed biplane',
    kicker: 'Chapter 1 · Where it took off',
    heading: 'Electrical engineering roots',
    intro:
      'Every pilot starts with a rough landing. Before software, there were transmission houses, circuits and a student society that taught how to sell an idea.',
    story: {
      tale: "During university, Ali fixed one classmate's laptop. Word spread faster than any AIESEC campaign, and before he knew it he was running a free help desk for the whole campus. No tickets, no SLA, payment accepted in chai and gratitude. It was scope creep before he knew the term.",
      learned: 'That every fix is user research in disguise, that people remember how you made them feel more than what you fixed, and never to say "I can take a quick look" unless you mean all weekend.',
    },
    roles: [
      {
        title: 'Bachelor of Electrical Engineering',
        org: 'NFC Institute of Engineering and Technology (NFC IET), Multan',
        dates: '2013 - 2017',
        points: ['Electrical engineering, grade B+.', 'The habit of reading a system end to end, from power to signal, still shapes how Ali debugs software.'],
      },
      {
        title: 'Intern',
        org: 'MEPCO, Multan Electric Power Company',
        dates: 'Jun 2016 - Aug 2016',
        place: 'Multan, Pakistan',
        points: ['Worked on the transmission houses of MEPCO Multan.'],
      },
      {
        title: 'VP B2B',
        org: 'AIESEC',
        dates: 'Sep 2014 - Apr 2016',
        place: 'Multan, Pakistan',
        points: [
          'Developed B2B prospects and met potential sponsors.',
          'Built digital marketing strategies for existing sponsors.',
          'Led teams, built them and delegated responsibilities.',
        ],
      },
    ],
    skills: ['Electrical engineering', 'Systems thinking', 'Business development', 'Team building', 'Teaching'],
    color: '#e07a3a',
  },
  {
    id: 'motive',
    label: 'Computers and ELDs',
    verb: 'Boot up the computers and ELDs',
    kicker: 'Chapter 2 · Five years at Motive',
    heading: 'Motive (formerly KeepTruckin)',
    intro:
      'A pile of tired machines and the electronic logging devices (ELDs) that once rode in thousands of trucks, each one a ticket that got solved. From troubleshooting ELDs to leading a developer support pod for enterprise API integrations.',
    story: {
      tale: 'Ali joined KeepTruckin to troubleshoot logging devices in trucks and left Motive leading a pod of engineers. Looking back, the university help desk was just the free trial. The paid version came with Jira, 98 percent SLA and partners who said "it does not work" with total confidence.',
      learned: 'REST APIs, OAuth and webhooks by day; at night, that one good knowledge article saves fifty future tickets. This is also where he caught the product bug: carrying partner pain into Product and Engineering and watching the API get better.',
    },
    roles: [
      {
        title: 'Lead Developer Support Engineer, Dev Support Pod',
        org: 'Motive',
        dates: 'May 2023 - Sep 2024',
        place: 'Remote',
        points: [
          'Led a team of 6 engineers supporting enterprise API integrations, keeping SLA compliance above 98%.',
          'Cut ticket resolution time by 20% with 50+ knowledge articles and developer onboarding environments.',
          'Acted as Solutions Engineer for enterprise and insurance partners; improved onboarding efficiency by 20% with Postman and sandboxes.',
          'Delivered Motive Data Bridge integrations for 10+ third-party applications.',
          'Channelled partner feedback into Product and Engineering to improve API design and usability.',
        ],
      },
      {
        title: 'Developer Support Engineer, Dev Support Pod',
        org: 'Motive',
        dates: 'Nov 2022 - May 2023',
        place: 'Remote',
        points: [
          'Resolved 50+ daily API integration issues for enterprise developers at 98% SLA compliance.',
          'Guided 20+ partners through OAuth 2.0, webhook setup and endpoint troubleshooting; cut onboarding time by 25%.',
          'Supported 30+ enterprise product demos and mentored 4 junior engineers as Acting Lead.',
        ],
      },
      {
        title: 'Technical QA Analyst and QA Analyst, Tech Ops',
        org: 'Motive',
        dates: 'Mar 2021 - Jun 2022',
        place: 'Remote',
        points: [
          'Audited 500+ escalated Tier 2 and Tier 3 cases a month, redesigned 8 support workflows and reduced escalations by 15%.',
          'Built 10+ BI reports and 15+ scorecards and dashboards (Looker) used by senior leadership.',
          'Flagged 200+ recurring defects through structured data analysis, reducing repeat issues by 18%.',
        ],
      },
      {
        title: 'Technical Support Specialist',
        org: 'KeepTruckin',
        dates: 'Apr 2018 - Feb 2020',
        place: 'Islamabad, Pakistan',
        points: [
          'Troubleshot electronic logging devices with customers and passed findings to engineering teams.',
          'Worked in Salesforce CRM and walked clients through technical processes on call.',
        ],
      },
    ],
    stats: [
      { value: '6', label: 'engineers led' },
      { value: '98%+', label: 'SLA compliance' },
      { value: '20%', label: 'faster ticket resolution' },
      { value: '10+', label: 'Data Bridge integrations' },
    ],
    skills: ['REST APIs', 'OAuth 2.0', 'Webhooks', 'Postman', 'Looker', 'DataDog', 'Salesforce', 'Jira', 'Escalation management', 'Mentoring'],
    color: '#c9b48a',
  },
  {
    id: 'musictribe',
    label: 'Forecast terminal',
    verb: 'Read the forecast terminal',
    kicker: 'Chapter 3 · Teaching machines to plan',
    heading: 'Music Tribe (Empower Tribe)',
    intro:
      'A terminal still humming with charts. Here an AI forecasting and automation system learned to predict demand across thousands of products and global sites.',
    story: {
      tale: 'Forecasting 3,800 products taught Ali that the future is uncertain, but with Prophet and TSB it is at least uncertain with confidence intervals. Translating "the numbers feel wrong" from Finance into acceptance criteria was the hardest model of all. Before any of that, there was a five-month warm-up: ERP whisperer, act one. Act two had more Azure Functions and fewer spreadsheets held together by hope.',
      learned: 'Technical project management for real: writing requirements with Finance, supply chain and BI, mapping messy processes, and staying the bridge between business users and developers long after the launch party.',
    },
    roles: [
      {
        title: 'IT Associate - Systems and Applications Support (Consulting)',
        org: 'House and Hedges Real Estate',
        dates: 'Sep 2024 - Jan 2025',
        place: 'UAE, on-site',
        points: [
          'Built API data pipelines and KPI dashboards that replaced "check three spreadsheets and pray" with one source of truth.',
          'Implemented Dolibarr ERP for HR, taking employee records fully paperless.',
          'Scripted lead-data retrieval in Google Colab and built the scoring logic behind it.',
        ],
      },
      {
        title: 'Performance Division Leader, Technical Project Management (AI)',
        org: 'Music Tribe',
        dates: 'Jan 2025 - Jan 2026',
        place: 'Dubai, UAE',
        points: [
          'Led delivery of an AI-driven ERP forecasting and automation system using Microsoft D365 (BYOD), Power BI and Azure Functions.',
          'Built Prophet and TSB ensemble forecasting models for 3,800+ SKUs, improving forecast accuracy and aligning supply and demand planning across global sites.',
          'Built the Python Flask backend and Next.js interface for real-time data visualisation, validation and QA workflows.',
          'Mapped processes across sales, inventory and production and replaced manual work with automated, rule-based logic.',
          'Defined requirements with Finance, supply chain and BI, and stayed on as the bridge between business users and developers after launch.',
          'Sat in on customer conversations and turned client asks into tools and integrations that helped sales close and retain accounts.',
        ],
      },
    ],
    stats: [
      { value: '3,800+', label: 'SKUs forecast' },
      { value: '2', label: 'model ensemble (Prophet + TSB)' },
      { value: 'Global', label: 'sites aligned' },
    ],
    skills: ['Time-series forecasting', 'Prophet', 'TSB', 'Microsoft D365', 'Power BI', 'Azure Functions', 'Python Flask', 'Next.js', 'Process mapping', 'ERP integration'],
    color: '#3fb7c9',
  },
  {
    id: 'wastelab',
    label: 'Food-to-soil truck',
    verb: 'Climb into the waste truck',
    kicker: 'Chapter 4 · Closing the food-to-soil loop',
    heading: 'The Waste Lab',
    intro:
      'The newest landmark, and the one Ali is proudest of: software that helps businesses divert food waste from landfill, track it with precision and turn it back into soil. He cares about where this one lands.',
    story: {
      tale: 'Drivers used to log collections on paper. Paper, it turns out, has no audit trail, no search bar and no resistance to rain. So Ali shipped a driver app. Now the only thing that still gets composted is the food.',
      learned: 'Full product ownership: discovery with drivers, scope trade-offs, writing Go at noon and patching servers at midnight. Technical lead, product manager and occasional IT department, all in one hoodie.',
    },
    roles: [
      {
        title: 'Technical Lead',
        org: 'The Waste Lab',
        dates: 'Feb 2026 - Present',
        place: 'Dubai, UAE',
        points: [
          'Owned product design from discovery to launch for the driver app, a segregation web app with real-time data audit, and the internal data systems, working directly with drivers, operations teams and clients.',
          'Replaced paper logs with the driver app: 100% digital on daily collections, a full audit trail for operations, live on Google Play.',
          'Designed an AI audit feature that flags anomalies in driver and segregation data for human review, and prototyped an HR policy chatbot using retrieval augmented generation.',
          'Led a team of engineers and wrote code to ship the products (Go, Node, Next.js, React Native, PostgreSQL, Docker), setting quality standards and making scope trade-offs.',
          'Set up the data platform and dashboards used to measure collections and report results to clients and partners.',
          'Kept production running: server patching, email security (SPF, DKIM, DMARC) and Microsoft 365 administration.',
        ],
      },
      {
        title: 'Who made this worth building',
        org: 'Founders, The Waste Lab',
        dates: '',
        points: [
          'Lara Hussein and Ceylan \u00dcren started The Waste Lab because they refused to accept that food scraps from a Dubai apartment had nowhere to go but a landfill, and built the company that proved otherwise.',
          'They will always be an inspiration to Ali: proof that caring enough about a problem, and staying stubborn about it, is itself a legitimate business plan.',
        ],
      },
    ],
    stats: [
      { value: '100%', label: 'digital collections' },
      { value: 'Live', label: 'on Google Play' },
      { value: 'AI', label: 'anomaly audit' },
    ],
    skills: ['Go', 'Node.js', 'Next.js', 'React Native', 'PostgreSQL', 'Docker', 'RAG', 'Fleet and route data', 'Dashboards', 'DevOps'],
    color: '#4fae5e',
  },
  {
    id: 'projects',
    label: 'Project laptop',
    verb: 'Open the project laptop',
    kicker: 'Chapter 5 · Things built along the way',
    heading: 'Selected projects',
    intro:
      'A laptop left open on a rock, its screen full of side quests. Each one replaced manual work with a tool people actually used.',
    story: {
      tale: 'Ali has a simple rule: if he copies and pastes the same thing twice, the third time is a Python script. This laptop is what happens when you follow that rule for six years.',
      learned: 'Side projects are where product sense gets practised: find the boring task, talk to the person who hates it most, and build the smallest thing that makes it disappear.',
    },
    roles: [
      {
        title: 'Property Finder myCRM WhatsApp lead reporting tool',
        org: 'House and Hedges Real Estate',
        dates: 'Sep 2024 - Jan 2025',
        place: 'Dubai, UAE',
        points: [
          'Python tool on the Property Finder Expert myCRM API that filters and exports WhatsApp lead data by agent and date range, replacing manual copy and paste.',
          'Built API data pipelines for real-time reporting, KPI dashboards and Google Colab scripts for lead data and lead scoring.',
        ],
      },
      {
        title: 'House and Hedges HRM (ERP): a digital transformation',
        org: 'Dolibarr ERP implementation',
        dates: 'Dec 2024 - 2025',
        points: [
          'Configured HRMS modules for records, documents, payroll tracking and compliance; led secure data migration.',
          'Automated expense claims, asset tracking and leave; added role-based access and a self-service portal.',
          'Result: 100% paperless HR management with real-time analytics.',
        ],
      },
      {
        title: 'The Path: Developer Support Playbook',
        org: 'Motive Developer Support Pod',
        dates: 'Aug 2024',
        points: ['An API knowledge base covering REST fundamentals, OAuth 2.0 flows, webhook debugging and App Marketplace partner onboarding, used to onboard new support engineers.'],
      },
      {
        title: 'Chrome extension data parser',
        org: 'Motive',
        dates: '2023 - 2024',
        points: ['Built with a teammate: upload bulk CSV or Excel data, apply custom parsing rules and export validated results securely.'],
      },
      {
        title: 'Project Argo',
        org: 'Motive',
        dates: 'Dec 2022',
        points: ['Data analysis of 20K+ support cases behind a surge in Vehicle Gateway RMAs; the findings drove targeted training and RMAs fell after the pod launch.'],
      },
      {
        title: 'Dolibarr ERP for Courtesies Gift Shop',
        org: 'Freelance',
        dates: 'May 2022',
        points: ['Custom ERP integrating CRM, inventory, sales tracking and finance.'],
      },
      {
        title: 'Tier 2 and Tier 3 QA scorecards and leadership dashboard',
        org: 'Motive',
        dates: 'Oct 2021',
        points: ['Scorecards for six engineering pods plus a support QA dashboard for leadership, contributing to higher NPS.'],
      },
    ],
    stats: [
      { value: '7', label: 'featured builds' },
      { value: '20K+', label: 'cases analysed (Argo)' },
      { value: '100%', label: 'paperless HR' },
    ],
    skills: ['Python', 'Property Finder API', 'Dolibarr', 'Odoo', 'Chrome extensions', 'Google Colab', 'ETL', 'KPI dashboards'],
    links: [{ label: 'Work sample', url: 'https://docs.google.com/document/d/1vo3jjGIFvmfPiQcReqZkGMC1Z94Nu3QtGEHBFQUuiFg/edit?tab=t.0' }],
    color: '#5c7cfa',
  },
  {
    id: 'learning',
    label: 'Bookshelf of learning',
    verb: 'Browse the bookshelf',
    kicker: 'Chapter 6 · Learning is the superpower',
    heading: 'Certifications and writing',
    intro: 'A bookshelf in the open air, stacked with certificates and the articles Ali has published on LinkedIn.',
    story: {
      tale: 'The certificates started with product management and then multiplied, like browser tabs. Strategy, roadmaps, AI orchestration, security, DevOps. Ali insists he closes them eventually. Nobody believes him.',
      learned: 'The leap from fixing problems to choosing which problems are worth fixing: product discovery, strategy and roadmaps, plus enough AI and security to ask the awkward questions early.',
    },
    roles: [
      {
        title: 'Product',
        org: 'Certifications',
        dates: '2024 - 2025',
        points: [
          'Aha! Product Management Professional Certificate (2025)',
          'Building a Product Strategy, PMI (2025)',
          'Product Management First Steps, IIBA (2025)',
          'Technical Product Management, LinkedIn (2024)',
        ],
      },
      {
        title: 'AI and security',
        org: 'Certifications',
        dates: '2024 - 2026',
        points: [
          'Introduction to Agent Skills, Anthropic (2026)',
          'AI Product Security and Data Governance, LinkedIn (2025)',
          'Introduction to AI Orchestration with LangChain and LlamaIndex, LinkedIn (2025)',
          'AI for Cyber Security, PMI (2025)',
          'Learning Threat Intelligence, LinkedIn (2024)',
        ],
      },
      {
        title: 'Sales, delivery and data',
        org: 'Certifications',
        dates: '2024 - 2025',
        points: [
          'Technical Sales: The Role of the Sales Engineer, LinkedIn (2025)',
          'DevOps Foundations, CompTIA (2025)',
          'Microsoft Power Automate, Pragmatic Works (2025)',
          'Data Analytics for Business Professionals, LinkedIn (2024)',
          'SQL Intermediate, Sololearn (2024)',
          'EF SET C2 Proficient English (2024)',
        ],
      },
      {
        title: 'Articles on LinkedIn',
        org: 'Writing',
        dates: '2022 - 2026',
        points: [
          'The Boardroom Is Not Being Disrupted. Everyone Else Is. (May 2026)',
          'Enhancing Lead Management in the UAE: Automating Call Log Retrieval from Bayut and Dubizzle (Mar 2025)',
          'Chapter-Wise Summary of The Meditations by Marcus Aurelius (Mar 2025)',
          'The Hard Thing About Hard Things: Key Lessons for Leaders (Mar 2025)',
          'Unlocking the Power of Property Finder APIs: How to Automate WhatsApp Lead Retrieval (Feb 2025)',
          "Data Never Lies... Or Does It? A Deep Dive into Dubai's Real Estate Trends (Dec 2024)",
          'How To Own Your Mind: The Super Power No One Talks About (May 2024)',
          'Navigating the Confidence Fallacy (Feb 2024)',
          'A New Way of Leadership: What I Learned (Dec 2022)',
        ],
      },
      {
        title: 'What a colleague said',
        org: 'Recommendation from Sydney Alvarez',
        dates: '',
        points: [
          '"Ali has a deep analytical mindset combined with a can-do attitude that every organization would benefit from. He has been immensely helpful to the partnerships team, understanding the complexities and priorities of partners while seeking to solve their questions with the highest level of quality. Ali is also a pleasure to work with and a big team player."',
        ],
      },
    ],
    stats: [
      { value: '15', label: 'certifications' },
      { value: '9', label: 'published articles' },
      { value: 'C2', label: 'English proficiency' },
    ],
    skills: ['Product strategy', 'Roadmaps (Aha!)', 'LangChain', 'LlamaIndex', 'DevOps', 'Power Automate', 'Technical writing'],
    color: '#b07cc6',
  },
  {
    id: 'play',
    label: 'Floating gamepad',
    verb: 'Pick up the floating gamepad',
    kicker: 'Chapter 7 · Off the clock',
    heading: 'Gaming and game development',
    intro:
      'Not a job title, a hobby. Ali plays games and tinkers with making them; this hill is one of those experiments, a portfolio you can walk through.',
    story: {
      tale: 'Ali builds small games as a hobby, which is how a CV became a hilltop with a fox, a tapir and a stone guardian. Recruiters, you are welcome.',
      learned: "Games are the best product teachers: if the player is lost, it is the designer's fault, never the player's. Same goes for users.",
    },
    roles: [
      {
        title: 'Hobbies',
        org: 'Outside work',
        dates: 'Always',
        points: [
          'Gaming: exploring worlds, reading their systems and wondering how they were built.',
          'Game development as a hobby: prototyping small worlds, including this one.',
          'Reading: leadership, Stoic philosophy and the hard things about hard things.',
          'Soil building: caring about where food waste ends up, at work and at home.',
        ],
      },
      {
        title: 'What gaming teaches a tech lead',
        org: '',
        dates: '',
        points: [
          'Every good game is a well-designed system with clear feedback loops, which is exactly what operations software should be.',
          'Players never read the manual; users do not either. Design for that.',
        ],
      },
    ],
    skills: ['Curiosity', 'Systems design', 'Prototyping', 'Play'],
    color: '#f0b429',
  },
  {
    id: 'ai',
    label: 'Signal beacon',
    verb: 'Touch the signal beacon',
    kicker: 'Chapter 8 · Where this goes next',
    heading: 'Building in the age of AI',
    intro:
      "A beacon that wasn't here a year ago. It hums faintly, like the rest of the industry does right now. This is where Ali stands in that hum, and where he's walking next.",
    story: {
      tale: 'Every year of Ali\u2019s career got absorbed by the next big shift: ELDs, then ERP forecasting, now agents that write half the code and all of the first draft. He did not resist any of them. He just kept asking one annoying question: does this make the human\u2019s next step easier, or just busier?',
      learned: 'AI is not a department, it is a tool on the same shelf as a terminal and a signpost. The craft is still the same: understand the system, remove the friction, ship the thing that actually gets used.',
    },
    roles: [
      {
        title: 'How I use it today',
        org: 'Daily practice',
        dates: 'Now',
        points: [
          'Prototypes products, analyses data and automates workflows with AI before writing a single formal spec.',
          'Built this hill with it: 3D model wrangling, shader debugging and a portfolio with opinions, all shipped faster with an AI pair.',
          'Treats every AI output as a first draft from a very fast, occasionally overconfident intern: useful, never final.',
        ],
      },
      {
        title: "Where I'm headed",
        org: 'The honest part',
        dates: 'Next',
        points: [
          'Wants AI doing the grunt work so humans do the judgment calls on sustainability operations.',
          'Betting his career on staying the person who understands both the model and the mess it is modelling, not choosing one over the other.',
          'If the agents get good enough to build the hill themselves, he still wants to be the one deciding which hill is worth building.',
        ],
      },
    ],
    stats: [
      { value: 'AI-native', label: 'way of building' },
      { value: '3', label: 'eras survived (ELDs, ERP, agents)' },
      { value: 'Daily', label: 'driver' },
    ],
    skills: ['AI-native building', 'Prompt engineering', 'Rapid prototyping', 'Judgment over automation', 'Staying curious'],
    color: '#8a5cf6',
  },
]

export const CHAPTERS: readonly LandmarkId[] = LANDMARKS.map(l => l.id)

export function landmark(id: LandmarkId): Landmark {
  const l = LANDMARKS.find(x => x.id === id)
  if (!l) throw new Error(`Unknown landmark ${id}`)
  return l
}
