import type { Analysis, Lenses, Premortem, Report } from "./schemas";

export const DEMO_DECISION = "Should I accept a 6-month internship offer during my 3rd year of college?";

export const DEMO_CONTEXT = `I got an offer for a 6-month software internship at a mid-size fintech company. The stipend is ₹35,000/month, which is really good for a student. The office is only 20 minutes from home so I can keep living with my parents. Hours are 10am-7pm, Monday to Friday, hybrid with 3 days in office. The role is "backend developer intern" working on their payments APIs. They said I'll get industry experience and learn real-world tools.

My college semester runs at the same time. I'd have to attend some classes online and I have end-semester exams in month 5. My attendance requirement is 75%.

Honestly I'm mainly considering it because the stipend is good, the company is close to home, and it'll give me industry experience on my resume. My friends who did internships say it really helped them get placed.`;

export const DEMO_ANALYSIS: Analysis = {
  title: "Take a 6-month internship during third year?",
  summary:
    "You're leaning toward the internship mainly for the stipend, the short commute, and industry experience — and your friends' placement stories reinforce that.",
  options: ["Take the internship", "Decline it"],
  factors: [
    { label: "Good stipend", quote: "The stipend is ₹35,000/month, which is really good for a student" },
    { label: "Close to home", quote: "only 20 minutes from home so I can keep living with my parents" },
    { label: "Industry experience", quote: "it'll give me industry experience on my resume" },
    { label: "Friends got placed", quote: "My friends who did internships say it really helped them get placed" },
    { label: "Exams & attendance", quote: "I have end-semester exams in month 5. My attendance requirement is 75%" },
  ],
  nodes: [
    {
      kind: "assumption",
      title: "Experience = learning",
      insight:
        "\"Industry experience\" assumes you'll do meaningful work. Some internships are mostly shadowing or maintenance tickets — others are the best teacher you'll ever have.",
      quote: "They said I'll get industry experience and learn real-world tools",
      question: "What would you need to be doing by week 6 for this to count as real learning for you?",
      dimension: "growth",
      severity: 3,
      factor: 2,
      about: 0,
    },
    {
      kind: "assumption",
      title: "Your friends' path is yours",
      insight:
        "Your friends' internships may have differed in role, timing, or company. Their outcome is a signal worth understanding, not a guarantee either way.",
      quote: "My friends who did internships say it really helped them get placed",
      question: "What specifically about your friends' internships helped them get placed?",
      dimension: "career",
      severity: 2,
      factor: 3,
      about: 0,
    },
    {
      kind: "assumption",
      title: "Stipend vs. its real cost",
      insight:
        "₹35,000/month is real money. The full picture also includes what the time costs you — study hours, rest, other opportunities.",
      quote: "which is really good for a student",
      question: "If the stipend were half as much, how differently would you be thinking about this offer?",
      dimension: "money",
      severity: 2,
      factor: 0,
      about: 0,
    },
    {
      kind: "assumption",
      title: "Another chance will come",
      insight:
        "Saying no quietly assumes something comparable comes along later — a summer internship, a placement-season offer — on your timeline.",
      quote: "",
      question: "If you declined, what would you expect to have instead by the end of the year, and how confident are you it would come?",
      dimension: "opportunity",
      severity: 2,
      factor: -1,
      about: 1,
    },
    {
      kind: "blindspot",
      title: "Who mentors you?",
      insight:
        "You haven't mentioned who you'd be learning from. Mentorship quality often matters more than the company name.",
      quote: "",
      question: "Who would your day-to-day mentor be, and how much time could they realistically give you each week?",
      dimension: "growth",
      severity: 3,
      factor: 2,
      about: 0,
    },
    {
      kind: "blindspot",
      title: "Exam month, week by week",
      insight:
        "Month 5 is exam month while you're working 10am–7pm. You mentioned hybrid days and online classes — the open question is how the study hours actually fit.",
      quote: "I have end-semester exams in month 5",
      question: "Walk through a normal Tuesday in month 5. Where do your study hours come from?",
      dimension: "time",
      severity: 3,
      factor: 4,
      about: 0,
    },
    {
      kind: "blindspot",
      title: "What saying no costs",
      insight:
        "Declining also has a price: about ₹2 lakh over six months and a real production codebase on your resume. You haven't described what these months would hold instead.",
      quote: "",
      question: "If you decline, what would a genuinely good version of these six months look like for you?",
      dimension: "opportunity",
      severity: 3,
      factor: 0,
      about: 1,
    },
    {
      kind: "blindspot",
      title: "Where each path points",
      insight:
        "A backend payments role nudges you toward fintech infrastructure; staying focused on college keeps other directions open. Neither is neutral.",
      quote: "working on their payments APIs",
      question: "Which kind of work do you actually want to be doing in three years, and how does each path move you toward it?",
      dimension: "career",
      severity: 2,
      factor: 2,
      about: -1,
    },
    {
      kind: "blindspot",
      title: "Your energy over 6 months",
      insight:
        "Work plus classes plus exams is a sustained load; a regular semester has its own pressures too. You haven't mentioned rest or health either way.",
      quote: "",
      question: "What usually happens to your energy when you're stretched across several commitments for weeks at a time?",
      dimension: "wellbeing",
      severity: 2,
      factor: -1,
      about: 0,
    },
    {
      kind: "blindspot",
      title: "Why you actually want it",
      insight:
        "Every reason you gave is about money, convenience, or what others experienced. You haven't said whether backend or payments work interests you.",
      quote: "",
      question: "Setting money and placements aside, what part of this work, if any, genuinely excites you?",
      dimension: "values",
      severity: 2,
      factor: -1,
      about: -1,
    },
    {
      kind: "contradiction",
      title: "Placement help vs. grades",
      insight:
        "You want this to help with placements, and you also face exams and a 75% attendance rule — and many placement processes look at CGPA too.",
      quote: "it really helped them get placed",
      question: "How do the placements you're hoping for weigh internship experience against CGPA?",
      dimension: "risk",
      severity: 3,
      factor: 3,
      about: -1,
    },
  ],
  coverage: [
    { dimension: "time", score: 30 },
    { dimension: "money", score: 45 },
    { dimension: "growth", score: 25 },
    { dimension: "career", score: 40 },
    { dimension: "wellbeing", score: 5 },
    { dimension: "relationships", score: 20 },
    { dimension: "opportunity", score: 5 },
    { dimension: "values", score: 10 },
    { dimension: "risk", score: 15 },
  ],
};

export const DEMO_LENSES: Lenses = {
  lenses: [
    {
      id: "future",
      voice: "I'm you, a year from now. I remember how this semester actually felt — not how it looked on paper.",
      questions: [
        "If you took it, what would you most want to have learned by now?",
        "If you declined, what would you hope these six months gave you instead?",
        "Which question will you wish you had asked before deciding either way?",
      ],
    },
    {
      id: "skeptic",
      voice: "Let me poke at the reasons that feel most convincing to you.",
      questions: [
        "How much of your pull toward this comes from the stipend, compared with the work itself?",
        "If the office were 90 minutes away, how would that change the weight of everything else?",
        "If you declined, what makes you confident a comparable opportunity would come later?",
      ],
    },
    {
      id: "mentor",
      voice: "I've hired interns for years. Here's what I'd want you to find out first.",
      questions: [
        "What kind of work would you actually own in your first month?",
        "What did past interns on this exact team go on to do?",
        "How do the companies you'd like to join weigh internships against grades?",
      ],
    },
    {
      id: "affected",
      voice: "I'm your parents — you'll be living with us through all of this.",
      questions: [
        "Have you talked with us about what your workload will look like day to day?",
        "How will you handle it if we're worried about your grades halfway through?",
        "What support would you actually want from home during exam month?",
      ],
    },
  ],
};

export const DEMO_PREMORTEM: Premortem = {
  patterns: [
    { pattern: "Exam month became unmanageable", evidence: "You described falling behind right around exams." },
    { pattern: "Work wasn't what was promised", evidence: "You imagined doing mostly documentation and testing." },
  ],
  hidden_fear: "Underneath this seems to be a worry that you'll trade something lasting (grades) for something that sounded good.",
  signals: [
    "By week 3, you still haven't been assigned a real project",
    "You're skipping more than one online class per week",
    "You feel dread on Sunday evenings",
  ],
  question: "Which of these signals would be your cue to renegotiate hours — and would you actually act on it?",
};

export const DEMO_REPORT: Report = {
  headline: "You're weighing real money and experience against your semester — and now you can see the trade.",
  valued: ["Financial independence", "Industry readiness", "Staying close to family", "Getting placed well"],
  examined: [
    { belief: "Experience = learning", finding: "You realised you don't yet know what the work will actually be." },
    { belief: "Your friends' path is yours", finding: "You realised you don't know which part of their internships actually helped." },
  ],
  tensions: ["Wanting placement-ready experience, and also wanting the grades placements look at"],
  open_questions: [
    "Who would mentor you, and how much time do they have?",
    "How would your study hours fit in exam month?",
    "If you declined, what would these six months hold instead?",
  ],
  info_to_gather: [
    "Ask the company for a sample week of an intern's work",
    "Confirm the attendance policy with your department in writing",
    "Talk to one past intern from this team",
  ],
  closing: "On one side: income, experience and a short commute. On the other: your semester, your exams and time to choose your direction. You can see both now — the choice is yours.",
};
