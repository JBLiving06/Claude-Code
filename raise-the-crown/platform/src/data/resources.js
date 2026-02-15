export const tiers = [
  {
    name: 'Free Tier',
    price: '$0/month',
    description: 'Start here. These tools are free and powerful enough to build real workflows.',
    tools: [
      { name: 'ChatGPT Free', category: 'General AI', notes: 'GPT-4o mini, solid for basic queries' },
      { name: 'Google Gemini', category: 'General AI', notes: 'Free tier with Gemini Pro' },
      { name: 'Perplexity Free', category: 'Research', notes: '5 Pro searches/day, great for citations' },
      { name: 'Elicit Free', category: 'Research', notes: 'Academic paper search and synthesis' },
      { name: 'Google NotebookLM', category: 'Research', notes: 'Upload papers, get AI analysis' },
      { name: 'Canva Free', category: 'Design', notes: 'Presentations and visual content' },
    ],
  },
  {
    name: 'Student Essentials',
    price: '$20-30/month',
    description: 'The sweet spot. One paid subscription transforms your workflow.',
    recommended: true,
    tools: [
      { name: 'ChatGPT Plus', category: 'General AI', notes: '$20/mo — GPT-4, Advanced Data Analysis, DALL-E', studentDiscount: false },
      { name: 'OR Claude Pro', category: 'General AI', notes: '$20/mo — Extended thinking, artifacts, projects', studentDiscount: false },
      { name: 'Perplexity Pro', category: 'Research', notes: '$20/mo — Unlimited Pro searches, file upload', studentDiscount: 'Student discount available' },
      { name: 'Grammarly Free', category: 'Writing', notes: 'Free tier covers basic writing assistance' },
    ],
  },
  {
    name: 'Power User',
    price: '$50-75/month',
    description: 'For students who are building systems, not just using tools.',
    tools: [
      { name: 'ChatGPT Plus', category: 'General AI', notes: '$20/mo' },
      { name: 'Claude Pro', category: 'General AI', notes: '$20/mo' },
      { name: 'Perplexity Pro', category: 'Research', notes: '$20/mo' },
      { name: 'Notion AI', category: 'Productivity', notes: '$10/mo add-on' },
    ],
  },
  {
    name: 'Full Stack',
    price: '$100+/month',
    description: 'Most students don\'t need this yet. But know it exists.',
    tools: [
      { name: 'All Power User tools', category: 'Various', notes: '~$70/mo base' },
      { name: 'Google AI Pro', category: 'General AI', notes: '$19.99/mo — Gemini Ultra', studentDiscount: 'Student discount via Google One' },
      { name: 'GitHub Copilot', category: 'Coding', notes: 'Free for students via GitHub Education' },
      { name: 'Midjourney', category: 'Image Gen', notes: '$10/mo basic plan' },
    ],
  },
]

export const discountPaths = [
  { provider: 'GitHub Education', benefit: 'Free GitHub Copilot, free Codespaces hours', url: 'education.github.com' },
  { provider: 'Google One AI Premium', benefit: 'Student pricing for Gemini Ultra', url: 'one.google.com' },
  { provider: 'Notion', benefit: 'Free Plus plan for students with .edu email', url: 'notion.so/students' },
  { provider: 'Figma', benefit: 'Free Education plan', url: 'figma.com/education' },
  { provider: 'Canva', benefit: 'Free Canva Pro for students', url: 'canva.com/education' },
]
