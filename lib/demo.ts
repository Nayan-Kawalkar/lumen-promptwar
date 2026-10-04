import type { Analysis, Lenses, Premortem, Report } from "./schemas";

export const DEMO_DECISION = "Should I accept a 6-month internship offer during my 3rd year of college?";

export const DEMO_CONTEXT = `I got an offer for a 6-month software internship at a mid-size fintech company. The stipend is ₹35,000/month, which is really good for a student. The office is only 20 minutes from home so I can keep living with my parents. Hours are 10am-7pm, Monday to Friday, hybrid with 3 days in office. The role is "backend developer intern" working on their payments APIs. They said I'll get industry experience and learn real-world tools.

My college semester runs at the same time. I'd have to attend some classes online and I have end-semester exams in month 5. My attendance requirement is 75%.

Honestly I'm mainly considering it because the stipend is good, the company is close to home, and it'll give me industry experience on my resume. My friends who did internships say it really helped them get placed.`;

export const DEMO_ANALYSIS: Analysis = {
  title: "Take a 6-month internship during third year?",
  summary:
    "You're leaning toward the internship mainly for the stipend, the short commute, and industry experience — and your friends' placement stories reinforce that.",
  factors: [
    { label: "Good stipend", quote: "The stipend is ₹35,000/month, which is really good for a student" },
    { label: "Close to home", quote: "only 20 minutes from home so I can keep living with my parents" },
    { label: "Industry experience", quote: "it'll give me industry experience on my resume" },
    { label: "Friends got placed", quote: "My friends who did internships say it really helped them get placed" },
  ],
  nodes: [
    {
      kind: "assumption",
      title: "Experience = learning",
      insight:
        "\"Industry experience\" assumes you'll do meaningful work. Some internships are mostly shadowing or maintenance tickets.",
      quote: "They said I'll get industry experience and learn real-world tools",
      question:
        "What would you need to be doing in week 6 for this to count as real learning — and do you know that's what the role involves?",
      dimension: "growth",
      severity: 3,
      factor: 2,
    },
    {
      kind: "assumption",
      title: "Your friends' path is yours",
      insight:
        "Your friends' internships may have differed in role, timing, or company. Their outcome is a signal, not a guarantee.",
      quote: "My friends who did internships say it really helped them get placed",
      question: "What specifically about your friends' internships helped them get placed — and does this one have that?",
      dimension: "career",
      severity: 2,
      factor: 3,
    },
    {
      kind: "assumption",
      title: "Stipend is pure gain",
      insight:
        "The stipend looks large next to zero, but the real comparison is against what you might give up — grades, a later better offer, rest.",
      quote: "which is really good for a student",
      question: "If the stipend were half as much, would you still be seriously considering this? What does your answer tell you?",
      dimension: "money",
      severity: 2,
      factor: 0,
    },
    {
      kind: "assumption",
      title: "Classes can be done online",
      insight:
        "You're assuming your college will accept online attendance for 6 months and that you can absorb lectures after a 9-hour workday.",
      quote: "I'd have to attend some classes online",
      question: "Have you confirmed with your college that this arrangement counts toward your 75% attendance?",
      dimension: "time",
      severity: 3,
      factor: -1,
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
    },
    {
      kind: "blindspot",
      title: "Exam month collision",
      insight:
        "Month 5 is exam month, while you're working 45 hours a week. That's the period most likely to break.",
      quote: "I have end-semester exams in month 5",
      question: "Walk through a normal Tuesday in month 5. Where do the study hours actually come from?",
      dimension: "time",
      severity: 3,
      factor: -1,
    },
    {
      kind: "blindspot",
      title: "Where this points your career",
      insight:
        "A backend payments role nudges you toward fintech infrastructure. Is that a direction you want, or just an available one?",
      quote: "working on their payments APIs",
      question: "If this internship went perfectly, what job would it make you a natural fit for — and do you want that job?",
      dimension: "career",
      severity: 2,
      factor: 2,
    },
    {
      kind: "blindspot",
      title: "Energy & burnout",
      insight:
        "Work plus classes plus exams for six months is a sustained load. You haven't mentioned rest, health, or what you'd drop.",
      quote: "",
      question: "What usually happens to you when you're stretched thin for weeks at a time?",
      dimension: "wellbeing",
      severity: 2,
      factor: -1,
    },
    {
      kind: "blindspot",
      title: "What you're saying no to",
      insight:
        "Six months is also the window for campus clubs, projects, or a summer internship that might fit you better.",
      quote: "",
      question: "What opportunity might show up in the next six months that this would make you unable to take?",
      dimension: "opportunity",
      severity: 2,
      factor: -1,
    },
    {
      kind: "contradiction",
      title: "Resume vs. grades",
      insight:
        "You want this to help placement, but placements often filter by CGPA first. The internship could quietly hurt the thing it's meant to help.",
      quote: "it really helped them get placed",
      question: "If your grades dropped this semester, how would that affect the placements you're hoping this internship helps with?",
      dimension: "risk",
      severity: 3,
      factor: 3,
    },
  ],
  coverage: [
    { dimension: "time", score: 30 },
    { dimension: "money", score: 70 },
    { dimension: "growth", score: 25 },
    { dimension: "career", score: 40 },
    { dimension: "wellbeing", score: 5 },
    { dimension: "relationships", score: 20 },
    { dimension: "opportunity", score: 5 },
    { dimension: "values", score: 15 },
    { dimension: "risk", score: 10 },
  ],
};

export const DEMO_LENSES: Lenses = {
  lenses: [
    {
      id: "future",
      voice: "I'm you, a year from now. I remember how this semester actually felt — not how it looked on paper.",
      questions: [
        "When you look back, would you rather explain a lower CGPA or a missing internship?",
        "What will you wish you had asked the company before saying yes?",
        "Which version of this semester would you be proudest of?",
      ],
    },
    {
      id: "skeptic",
      voice: "Let me poke at the reasons that feel most convincing to you.",
      questions: [
        "Is the stipend driving this decision more than you'd like to admit?",
        "If the office were 90 minutes away, would 'industry experience' still be enough?",
        "What evidence do you have that this role teaches more than a good personal project would?",
      ],
    },
    {
      id: "mentor",
      voice: "I've hired interns for years. Here's what I'd want you to find out first.",
      questions: [
        "Will you ship code to production, or mostly fix tickets nobody else wants?",
        "Can you speak to a past intern from this exact team?",
        "Is there a conversion-to-full-time path, and how often does it actually happen?",
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
    { belief: "Classes can be done online", finding: "You haven't confirmed attendance rules with your college." },
  ],
  tensions: ["Wanting placement-ready experience vs. protecting the CGPA placements filter on"],
  open_questions: [
    "Who would mentor you, and how much time do they have?",
    "What happens in exam month?",
    "What else might you be saying no to?",
  ],
  info_to_gather: [
    "Ask the company for a sample week of an intern's work",
    "Confirm the attendance policy with your department in writing",
    "Talk to one past intern from this team",
  ],
  closing: "You now see more of this decision than you did an hour ago. What you do with that is yours.",
};
