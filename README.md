# Chrome Extensions samples

Official samples for Chrome Extensions and the Chrome Apps platform. (Chrome Apps are deprecated. Learn more [on the Chromium blog](https://blog.chromium.org/2020/08/changes-to-chrome-app-support-timeline.html)).

For more information on extensions, see [Chrome Developers](https://developer.chrome.com).

## Mentor Repo Standards

This repository is maintained as a mentor-grade sample library. Every accepted
change should improve one or more of the following:

- Clarity: examples are easy to read, reason about, and explain.
- Correctness: sample behavior and metadata are valid and testable.
- Reusability: patterns can be lifted into production projects safely.
- Maintainability: contributors can verify changes quickly and consistently.

### WYNOT framework alignment

This repository includes a WYNOT framework layer for developers and coding
agents. See:

- [AGENTS.md](AGENTS.md) for agent operating rules.
- [docs/wynot/README.md](docs/wynot/README.md) for the standards index.
- [docs/wynot/MCP-RESOURCES.md](docs/wynot/MCP-RESOURCES.md) for MCP workflows.

## Quality Gate

Run these commands before opening a PR:

```sh
npm run quality:quick
npm run format:check
npm run ci:verify
```

What each command checks:

- `quality:quick`: linting and manifest smoke validation.
- `format:check`: enforced markdown/html/json formatting for the curated scope.
- `ci:verify`: full local equivalent of CI Quality checks.

## Explore samples

The directory structure is as follows:

- [api-samples/](api-samples/) - extensions focused on a single API package
- [functional-samples/](functional-samples/) - full featured extensions spanning multiple API packages
- [\_archive/apps/](_archive/apps/) - deprecated Chrome Apps platform (not listed below)
- [\_archive/mv2/](_archive/mv2/) - resources for manifest version 2

You can also use the [Samples](https://developer.chrome.com/docs/extensions/samples/) page to discover extensions by type, permissions, and extension API.

## Installation

To experiment with these samples, please clone this repo and use 'Load Unpacked Extension'.
Read more on [Development Basics](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).

## Contributor Workflow

```sh
# install dependencies
npm install

# run fast validation while iterating
npm run quality:quick

# run complete validation before creating a PR
npm run ci:verify
```

For contribution policy and review expectations, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Contributing

Please see [the CONTRIBUTING file](/CONTRIBUTING.md) for information on contributing to the `chrome-extensions-samples` project.

## License

`chrome-extensions-samples` are authored by Google and are licensed under the [Apache License, Version 2.0](/LICENSE).
