# Product Marketing Context

*Last updated: 2026-10-08*

## Product Overview
**One-liner:** ChatGPT says it searched the web. It never says what for. This shows you.
**What it does:** A Chrome extension that passively reads the network responses ChatGPT, Claude, and Gemini already produce, extracts the real search queries and sources they used, and shows them in a small overlay panel -- no account, no server, nothing sent anywhere except an optional favicon lookup.
**Product category:** Browser extension / developer-adjacent productivity utility -- the "shelf" is closer to DevTools-for-AI-chats than to a general AI tool.
**Product type:** Free Chrome extension, no backend.
**Business model:** Free, no monetization. Not a SaaS.

## Target Audience
**Target companies:** N/A -- individual users (consumer/prosumer, not B2B).
**Decision-makers:** N/A, single-user install.
**Primary use case:** Fact-checking and understanding an AI assistant's answer by seeing exactly what it searched for and what it found, instead of trusting an opaque "Searched the web" label.
**Jobs to be done:**
- Verify whether an AI's answer is actually grounded in a real, relevant search (or a vague/wrong one).
- Dig into a source the assistant mentioned without re-deriving the search query by hand.
- Export captured queries/sources for research, content, or SEO work that depends on knowing what an AI actually looked up.
**Use cases:**
- A researcher or journalist checking whether an AI's cited sources are real and relevant.
- An SEO/content person curious what queries AI assistants run for a given topic.
- A power user who just wants to know "wait, what did it actually search for?"

## Personas
Not applicable -- single-persona consumer tool, no B2B buying committee.

## Problems & Pain Points
**Core problem:** AI assistants search the web on your behalf constantly, but treat the query and results as an implementation detail you never see.
**Why alternatives fall short:**
- Chrome DevTools' Network tab has the same underlying data, but as raw, unlabeled JSON mixed in with hundreds of unrelated requests -- technically possible, practically unusable for a non-engineer.
- Asking the model "what did you search for?" gets an answer from the model's memory of its own actions, not the actual request -- it can paraphrase, summarize, or simply misremember.
- Doing nothing (the default): most people don't know there's anything to find in the first place.
**What it costs them:** Wasted trust in answers that may be grounded in a bad or irrelevant search; wasted time manually digging through DevTools for anyone who does think to look.
**Emotional tension:** A quiet unease about trusting AI answers you can't verify, plus mild curiosity ("what did it actually look up?").

## Competitive Landscape
**Direct:** None identified -- no other extension specifically surfaces AI assistants' internal search queries across ChatGPT/Claude/Gemini.
**Secondary:** Chrome DevTools (Network tab) -- same raw data, zero organization, not built for this.
**Indirect:** Asking the model to self-report its own queries via prompt -- unreliable, not the ground truth.

## Differentiation
**Key differentiators:**
- Reads the actual network response (ground truth), not the model's self-report.
- Organizes by platform/query/intent with sources pre-split into Cited vs. Retrieved.
- 100% local -- no account, no server, no analytics; the only outbound call is a per-source favicon hostname lookup.
- Works across three platforms (ChatGPT, Claude, Gemini) with one consistent UI, instead of needing platform-specific tricks.
**How we do it differently:** Passive MAIN-world network interception + per-platform response parsing, read-only, no modification of any request.
**Why that's better:** Verifiable (reads what actually happened, not what the model claims), organized (readable UI vs. raw JSON), and trustworthy by construction (nothing leaves the browser).
**Why customers choose us:** Curiosity about what's actually happening behind an AI answer, or a concrete need to verify/export the queries and sources for research or content work.

## Objections
| Objection | Response |
|-----------|----------|
| "Is this reading my private conversations / sending my data somewhere?" | It only extracts search queries and source URLs from the assistant's own network responses, never your prompts or its answers as prose; everything is processed and stored locally; the only outbound request is a source hostname to Google's favicon service, nothing else. |
| "Why does it need to run on every message on these sites?" | It has to passively watch network traffic to catch a search the moment it happens -- there's no way to do this on-demand; no `host_permissions` are requested and it's limited to the 4 supported origins (`chatgpt.com`, `chat.openai.com`, `claude.ai`, `gemini.google.com`). |
| "Will this slow down or break ChatGPT/Claude/Gemini?" | It's read-only -- it observes responses, never modifies requests; this was the subject of a full live-verification pass (see ROADMAP.md) specifically because a prior version had a bug severe enough to make the user uninstall it. |

**Anti-persona:** Someone who just wants the AI's answer and has zero interest in how it got there -- this tool adds a panel they'd just want to turn off (which they can, via the toolbar toggle).

## Switching Dynamics
**Push:** Growing unease about trusting AI-generated answers without being able to check the work behind them.
**Pull:** A concrete "oh, that's what it's doing" moment the first time someone sees a real captured query.
**Habit:** Just reading the AI's answer and moving on -- the default requires zero extra steps, so this has to be genuinely effortless (passive capture, no setup) to beat it.
**Anxiety:** Privacy/trust (addressed directly above) and "is this just going to be noisy clutter on my screen" (addressed by the minimize-to-bubble mode and the toolbar on/off toggle).

## Customer Language
**How they describe the problem:** "What did it actually search for?" / "Is this source even real?" / "How do I know this isn't made up?"
**How they describe us:** Not yet launched publicly -- no verbatim customer language collected yet. Revisit this section after real user feedback comes in.
**Words to use:** reveal, actual, real, verify, local, read-only, passive.
**Words to avoid:** revolutionize, seamless, powerful, AI-powered (it's not "AI" doing the work, it's a parser), spy/track (even negated -- don't put the word in the user's head).
**Glossary:**
| Term | Meaning |
|------|---------|
| Cited sources | Sources the assistant's answer actually referenced/linked. |
| Retrieved sources | Sources the search found but the assistant didn't end up citing. |
| Intent / turn use case | The platform's own internal label for why it searched (e.g. "shopping"), when exposed. |

## Brand Voice
**Tone:** Direct, a little dry, technically credible without being jargon-heavy.
**Style:** Specific over hypey -- closer to how this project's own CHANGELOG.md is written (names the real bug, no hype, no exclamation points) than typical SaaS landing-page voice.
**Personality:** Honest, precise, unflashy, quietly confident.

## Proof Points
**Metrics:** None public yet (pre-launch). Internally: 124 passing tests, a documented live-verification pass across all 3 supported platforms (see ROADMAP.md) that found and fixed 10 real bugs via real browser testing, not just unit tests.
**Customers:** None yet -- pre-launch.
**Testimonials:** None yet -- pre-launch.
**Value themes:**
| Theme | Proof |
|-------|-------|
| It's the real data, not a guess | Reads the actual network response; ROADMAP.md documents live verification against real ChatGPT/Claude/Gemini traffic. |
| It's actually private | No `host_permissions`, no analytics, no account, no first-party server -- verifiable by reading the (small) source. |
| It's been through real scrutiny | A documented history of finding and fixing real bugs via live testing, including a prior version's bug serious enough to cause an uninstall -- treated as the reason verification is taken this seriously now. |

## Goals
**Primary business goal:** Ship a trustworthy, well-positioned 2.0 to the Chrome Web Store.
**Key conversion action:** Install the extension; secondarily, trigger a real search on a supported platform and see the panel populate (the "aha" moment).
**Current metrics:** Pre-launch -- none yet.
