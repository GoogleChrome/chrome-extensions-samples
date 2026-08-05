# How to Contribute

We'd love to accept your patches and contributions to this project.

## Before you begin

### Sign our Contributor License Agreement

Contributions to this project must be accompanied by a
[Contributor License Agreement](https://cla.developers.google.com/about) (CLA).
You (or your employer) retain the copyright to your contribution; this simply
gives us permission to use and redistribute your contributions as part of the
project.

If you or your current employer have already signed the Google CLA (even if it
was for a different project), you probably don't need to do it again.

Visit <https://cla.developers.google.com/> to see your current agreements or to
sign a new one.

### Review our Community Guidelines

This project follows [Google's Open Source Community
Guidelines](https://opensource.google/conduct/).

## Contribution process

### Create an issue first

Before adding a new sample, [create an issue first](https://github.com/GoogleChrome/chrome-extensions-samples/issues/new).
Describe why this sample is needed and how you plan to implement it. Only once
you've got the approval from one of the maintainers start working on a PR. Non
trivial PRs without an approved issue will be rejected.

### Code Reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

### Quality gate before opening a PR

Before requesting review, run:

```sh
npm run quality:quick
npm run format:check
npm run ci:verify
```

PRs are expected to keep these checks green.

### What makes a sample mentor-grade

- The intent is clear: README explains what the sample teaches.
- The boundary is clear: permissions and APIs are minimal and justified.
- The behavior is verifiable: sample can be loaded and basic scenario tested.
- The implementation is reusable: naming and structure are consistent.
- The quality gates pass: no lint, formatting, or manifest validation failures.

### WYNOT standards references

When changes touch UX, policy, architecture, or automation pathways, align with:

- [AGENTS.md](AGENTS.md)
- [docs/wynot/BRAND-VOICE-AND-VISUAL-STYLE.md](docs/wynot/BRAND-VOICE-AND-VISUAL-STYLE.md)
- [docs/wynot/GOVERNANCE-PATHWAY.md](docs/wynot/GOVERNANCE-PATHWAY.md)
- [docs/wynot/ZERO-TRUST-ARCHITECTURE.md](docs/wynot/ZERO-TRUST-ARCHITECTURE.md)
- [docs/wynot/MCP-RESOURCES.md](docs/wynot/MCP-RESOURCES.md)
- [docs/wynot/ECOSYSTEM-STACK-BASELINE-2026.md](docs/wynot/ECOSYSTEM-STACK-BASELINE-2026.md)

### Ecosystem stack baseline policy

Changes that add or update major framework dependencies should align with
[docs/wynot/ECOSYSTEM-STACK-BASELINE-2026.md](docs/wynot/ECOSYSTEM-STACK-BASELINE-2026.md).

If a change intentionally diverges from baseline, include:

- Compatibility rationale
- Migration impact
- Rollback plan

### Setting up your Environment

If you want to contribute to this repository, you need to first [create your own fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo).
After forking chrome-extensions-samples to your own Github account, run the
following steps to get started:

```sh
# clone your fork to your local machine
git clone https://github.com/your-fork/chrome-extensions-samples.git

cd chrome-extensions-samples

# install dependencies
npm install
```

### Writing a README

All new code samples or samples updated from Manifest V2 should include a
README file. Please copy the [provided template](./README-template.md) into
your sample's folder and follow the instructions therein.

For high-quality onboarding, include:

- What problem the sample solves.
- Which APIs are demonstrated and why.
- Required permissions and tradeoffs.
- Manual verification steps.
