/**
 * What the hill's residents have to say. The landmarks (see portfolio.ts) tell Ali's career in
 * panels; the creatures add small asides inspired by his values: trust, daily care, the
 * food-to-soil mission, Stoic patience. `chooseScript` is pure (unit tested): the encounter layer
 * owns the state and applies the returned effects.
 */

/** '' = narration (no name shown). */
export type Speaker = '' | 'fox' | 'rose' | 'sheep' | 'tapir' | 'shoebill' | 'you'
export type Line = readonly [Speaker, string]
export type Target = 'hat' | 'sprout' | 'fox' | 'rose' | 'sheep' | 'box' | 'tapir' | 'shoebill' | 'guardian'
export type StarId = Target
/** Every resident remembers being met. */
export const STARS: readonly StarId[] = ['fox', 'rose', 'sheep', 'box', 'sprout', 'hat', 'tapir', 'shoebill', 'guardian']
export const FOX_TAMED = 3
/** Scripts write the visitor's name as this token; the UI swaps the real name in when a talk opens. */
export const NAME_TOKEN = '{name}'
export function personalize(text: string, name: string): string {
  return text.split(NAME_TOKEN).join(name)
}

export type Book = {
  hat: { first: Line[]; again: Line[][] }
  sprout: { first: Line[]; more: Line[]; last: Line[] }
  fox: { meet: [Line[], Line[], Line[]]; tamed: Line[][] }
  rose: { first: Line[]; again: Line[][]; fox: Line[] }
  sheep: { first: Line[]; again: Line[][] }
  box: { first: Line[]; again: Line[][] }
  tapir: { first: Line[]; again: Line[][] }
  shoebill: { first: Line[]; again: Line[][] }
  guardian: { first: Line[]; again: Line[][]; awake: Line[]; after: Line[][] }
}

export const BOOK: Book = {
  hat: {
    first: [
      ['', 'A smooth, oddly shaped stone. Most visitors say it looks like a hat.'],
      ['', 'A product manager would ask: "Who is the hat for, and what problem does it solve?"'],
      ['', 'An engineer would say: "It is not a hat. It is a legacy system that swallowed a much bigger problem."'],
      ['', 'Ali would ask both questions, then write the ticket.'],
    ],
    again: [
      [['', 'Still a stone. Still technically "working as intended".']],
      [['', 'You knock on it. Somewhere inside, a cron job from 2014 is still running.']],
      [['', 'There is a sticky note on it: "Do not refactor on a Friday."']],
    ],
  },
  sprout: {
    first: [
      ['', 'A small weed pokes up through the grass. It looks harmless.'],
      ['', 'So did that "temporary" workaround in production three years ago.'],
      ['', 'You pull it out before it becomes a dependency.'],
    ],
    more: [
      ['', 'Another one gone. Tech debt does not pay itself.'],
    ],
    last: [
      ['', 'That is the last one. Backlog: zero. Enjoy it, this never lasts.'],
      ['', 'They will be back tomorrow. Ali calls this "patch Tuesday" and never skips it.'],
    ],
  },
  fox: {
    meet: [
      [
        ['fox', 'Hello, traveller. Welcome to Ali\'s Verse.'],
        ['fox', 'Every landmark on this hill is a chapter of Ali Dost\'s career. Walk up to one and press E.'],
        ['fox', 'Think of it as a portfolio, but with fewer PDFs and more grass.'],
      ],
      [
        ['fox', 'You came back. Most people only come back when something is broken.'],
        ['fox', 'At Motive, Ali led a developer support team that kept SLA compliance above 98 percent.'],
        ['fox', 'The other 2 percent were tickets that said "it does not work" and nothing else.'],
      ],
      [
        ['fox', 'Ali likes to say: systems do not fail, people do. So take care of the people first.'],
        ['fox', 'Also, always read the logs. The logs know things.'],
        ['fox', 'You have earned my trust. I will follow you around now, like a junior dev on their first week.'],
      ],
    ],
    tamed: [
      [['fox', 'Have you opened the laptop yet? It holds the side projects. Some even have documentation.']],
      [['fox', 'The bookshelf is full of certifications. Ali collects them the way I collect sticks.']],
      [['fox', 'The bar at the top of your screen points to unread chapters. It is basically a roadmap, but honest.']],
      [['fox', 'The green truck is The Waste Lab. Yes, a real product, with real users, and real compost.']],
      [['fox', 'If you want to work with Ali, the LinkedIn button is right there. No cover letter required.']],
      [['fox', 'Rumour says Ali fixed one laptop at university and accidentally founded a free help desk. Classic scope creep.']],
      [['fox', 'Support engineer, QA analyst, team lead, project manager, product owner. Ali levels up like it is a role-playing game.']],
      [['fox', 'I asked for a feature once. Ali asked me what problem it solved. I am still thinking.']],
    ],
  },
  rose: {
    first: [
      ['', 'A red rose grows under a glass dome beside the guardian\'s hand.'],
      ['', 'You gently lift the glass.'],
      ['rose', 'Hello. I am the user. Everything on this hill was built for someone like me.'],
      ['rose', 'Drivers, operations teams, partners, clients. Ali talks to them before he designs anything.'],
      ['rose', 'Please put the dome back when you leave. We call that "closing the feedback loop".'],
    ],
    again: [
      [['rose', 'Outcomes over output. Shipping ten features nobody uses is just expensive exercise.']],
      [['rose', 'My favourite words are "we talked to users first". My least favourite are "quick win".']],
      [['rose', 'Ali learned product management the hard way: by being the person users called when the product did not work.']],
      [['rose', 'I filed a bug once. Ali replied in four minutes. I did not know whether to be happy or scared.']],
    ],
    fox: [['rose', 'The fox trusts you now? That takes longer than a security review.']],
  },
  sheep: {
    first: [
      ['sheep', 'Baa.'],
      ['', 'A fluffy sheep is grazing very seriously, in perfectly straight rows.'],
      ['', 'It is the most organised dataset on the hill.'],
    ],
    again: [
      [['sheep', 'Baa?'], ['', 'It sounds like a stand-up update: short, vague, and somehow on time.']],
      [['', 'The sheep has eaten exactly 3,800 blades of grass. It is forecasting the next 3,800.']],
      [['sheep', 'Baa.'], ['', 'Translation: "Works on my machine."']],
    ],
  },
  box: {
    first: [
      ['', 'A small wooden box with air holes. The label reads "Sandbox".'],
      ['', 'At Motive, Ali set up sandbox environments so partners could test integrations safely.'],
      ['', 'Partner onboarding improved by about 20 percent. Production stopped flinching.'],
    ],
    again: [
      [['', 'Rule one of integrations: test in the sandbox. Rule two: see rule one.']],
      [['', 'The box is empty. The sheep escaped. Nobody wrote a test for that.']],
    ],
  },
  tapir: {
    first: [
      ['tapir', 'Oh, hello. I was just having a snack.'],
      ['tapir', 'Food scraps. The kind that would otherwise end up in a landfill.'],
      ['tapir', 'The Waste Lab turns food waste into compost, and Ali leads the technology behind it.'],
      ['tapir', 'Driver apps, digital collection records, audits, dashboards. I am basically the end user.'],
    ],
    again: [
      [['tapir', 'Every collection is digital now. No more paper logs. No more "I think it was Tuesday".']],
      [['tapir', 'An AI audit flags odd records for a human to check. It flagged me once. I was eating the data.']],
      [['tapir', 'I asked for dark mode on the driver app. Ali asked how many drivers work at night. Fair point.']],
    ],
  },
  shoebill: {
    first: [
      ['shoebill', '...'],
      ['shoebill', 'Sorry. I was reading Meditations by Marcus Aurelius. Ali wrote a chapter-by-chapter summary.'],
      ['shoebill', '"You have power over your mind, not outside events."'],
      ['shoebill', 'Outside events include: scope creep, flaky tests, and meetings that could have been emails.'],
      ['', 'The shoebill bows to you, very slowly, like a page loading on hotel Wi-Fi.'],
    ],
    again: [
      [['shoebill', 'Stay calm. Focus on what you control. Restart it if all else fails.']],
      [['shoebill', 'Confidence is not knowing you are right. It is being ready to read the stack trace.']],
      [['shoebill', 'The Stoics never had a deadline moved forward. Ali has. He stayed calm. Mostly.']],
    ],
  },
  guardian: {
    first: [
      ['', 'The old stone guardian sits in silence, covered in grass.'],
      ['', 'You rest your hand on its fingers. Its eye is dark, like a dashboard waiting for data.'],
      ['', 'Perhaps it wakes once every chapter has been opened. Acceptance criteria, you might say.'],
    ],
    again: [
      [['', 'Still dark. Status: in progress. Blockers: you have not opened every chapter.']],
      [['', 'A bird sits on its head, perfectly still, like a ticket nobody wants to pick up.']],
    ],
    awake: [
      ['', 'You rest your hand on its fingers.'],
      ['', 'Slowly, its eye begins to glow. All checks passed.'],
      ['', 'You have opened every chapter of Ali\'s Verse. Thank you for visiting, and for reading the docs.'],
      ['', 'If you would like to build something together, use the LinkedIn or GitHub button at the top of the screen.'],
    ],
    after: [
      [['', 'A steady light in its eye. Every dashboard is green. Nobody touch anything.']],
      [['', 'It is silent, but content. Like a release that went out with zero incidents.']],
    ],
  },
}
/** What the hill remembers (`stars`, `fox`, `awake` are saved; the rest lasts one visit). */
export type StoryState = {
  stars: StarId[]
  fox: number
  awake: boolean
  /** Every career chapter (landmark) has been opened: the guardian may wake. */
  chaptersDone: boolean
  /** Conversations already had with each target during this visit. */
  visits: Partial<Record<Target, number>>
  /** Baobab sprouts still standing (including the one being pulled). */
  sproutsLeft: number
  roseSmeltFox: boolean
}

export type Effects = {
  star?: StarId
  /** New fox taming level. */
  fox?: number
  pullSprout?: boolean
  liftDome?: boolean
  awaken?: boolean
  roseSmeltFox?: boolean
}

const cycle = <T>(list: T[], n: number): T => list[((n % list.length) + list.length) % list.length]

export type Choice = { lines: Line[]; effects: Effects; /** A repeat line was used: advance `visits`. */ repeat?: boolean }

/** Pick what a target says now, and what talking to it changes. */
export function chooseScript(book: Book, target: Target, s: StoryState): Choice {
  const seen = s.stars.includes(target)
  const n = s.visits[target] ?? 0
  const first = (lines: Line[]): Choice => ({ lines, effects: { star: target } })
  const again = (list: Line[][], effects: Effects = {}): Choice => ({ lines: cycle(list, n), effects, repeat: true })
  switch (target) {
    case 'hat':
    case 'sheep':
    case 'box':
    case 'tapir':
    case 'shoebill': {
      const b = book[target]
      if (!seen) return first(b.first)
      return again(b.again)
    }
    case 'sprout': {
      const b = book.sprout
      if (!seen) return { lines: b.first, effects: { star: 'sprout', pullSprout: true } }
      return { lines: s.sproutsLeft <= 1 ? b.last : b.more, effects: { pullSprout: true } }
    }
    case 'fox': {
      const b = book.fox
      if (s.fox < FOX_TAMED) {
        const level = Math.max(0, s.fox)
        const effects: Effects = { fox: level + 1 }
        if (level + 1 >= FOX_TAMED) effects.star = 'fox'
        return { lines: b.meet[level], effects }
      }
      return again(b.tamed, seen ? {} : { star: 'fox' })
    }
    case 'rose': {
      const b = book.rose
      if (!seen) return { lines: b.first, effects: { star: 'rose', liftDome: true } }
      if (s.fox >= FOX_TAMED && !s.roseSmeltFox) return { lines: b.fox, effects: { liftDome: true, roseSmeltFox: true } }
      return again(b.again, { liftDome: true })
    }
    case 'guardian': {
      const b = book.guardian
      if (s.awake) return again(b.after, seen ? {} : { star: 'guardian' })
      if (s.chaptersDone) return { lines: b.awake, effects: { awaken: true, star: 'guardian' } }
      if (!seen) return first(b.first)
      return again(b.again)
    }
  }
}
