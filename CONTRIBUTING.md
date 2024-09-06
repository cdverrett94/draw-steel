# Contributing to draw-steel

Code and content contributions are accepted. Please feel free to submit issues to the issue tracker or submit merge requests for code/content changes. Approval for such requests involves code and (if necessary) design review by the Maintainers of this repo.

Please ensure there is an open issue about whatever contribution you are submitting. Please also ensure your contribution does not duplicate an existing one.

## Developer Tooling

Cloning this repository and either placing it in or symlinking it to your `Data/systems/draw-steel` user data directory is all that is necessary to run this within Foundry VTT.

To provide type and i18n support, this repository uses a postinstall script that symlinks your local Foundry installation. For this to work, copy `example-foundry-config.yaml` and rename it to `foundry-config.yaml`, then replace the value of the `installPath` field.

Once this is done you can run `npm install` to install all relevant dependencies. These include `eslint` and `sass`, which provide formatting and styling support.

### VSCode support for i18n

If you are using VSCode, the i18n Ally (ID: `lokalise.i18n-ally`) extension will preview the content of i18n strings by pulling from both `lang/en.json` as well as the symlinked core translation files at `foundry/lang/en.json`.

## Compendiums

The system is still under construction and not ready for compendium content yet! The current license allows for the full text of the backer packet and the backer packet only.

### Translations

The core system will only support english-language compendium content. [Babele](https://foundryvtt.com/packages/babele) integrations should be provided by separate translation modules.

## Issues

Check that your Issue isn't a duplicate (also check the closed issues, as sometimes work which has not been released closes an issue). Issues which are assigned to a Milestone are considered "Prioritized." This assignment is not permanent and issues might be pushed out of milestones if the milestone is approaching a releaseable state without that work being done.

### Bugs

- Ensure that the bug is reproducible with no modules active. If the bug only happens when a module is active, report it to the module's author instead.
- Provide hosting details as they might be relevant.
- Provide clear step-by-step reproduction instructions, as well as what you expected to happen during those steps vs what actually happened.

### Feature Requests

Any feature request should be considered from the lens of "Does this belong in the core system?"
- Do the Rules as Written (RAW) support this feature? If so, provide some examples.
- Does this feature help a GM run a Draw Steel game in Foundry VTT?

## Code

Here are some guidelines for contributing code to this project.

To contribute code, [fork this project](https://docs.github.com/en/get-started/quickstart/fork-a-repo) and submit a [pull request (PR)](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#making-a-pull-request) against the correct development branch.

### Style

Please attempt to follow code style present throughout the project. An ESLint profile is included to help with maintaining a consistent code style. All warnings presented by the linter should be resolved before an PR is submitted.

- `npm run lint` - Run the linter and display any issues found.
- `npm run lint:fix` - Automatically fix any code style issues that can be fixed.

### Linked Issues

Before (or alongside) submitting an PR, we ask that you open a feature request issue. This will let us discuss the approach and prioritization of the proposed change.

If you want to work on an existing issue, leave a comment saying you're going to work on the issue so that other contributors know not to duplicate work. Similarly, if you see an issue is assigned to someone, that member of the team has made it known they are working on it.

When you open an PR it is recommended to [link it to an open issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue). Include which issue it resolves by putting something like this in your description:

```text
Closes #32
```

### Priority of Review

Please appreciate that reviewing contributions constitutes a substantial amount of effort and our resources are limited. As a result of this, Pull Requests are reviewed with a priority that roughly follows this:

#### High Priority

- Bug Fix
- Small Features related to issues assigned to the current milestone

#### Medium Priority

- Large Features related to issues assigned to the current milestone
- Small Features which are out of scope for the current milestone

#### Not Prioritized

- Large Features which are out of scope for the current milestone

### Pull Request Review Process

PRs have a few phases:

0. **Prioritization.** If the PR relates to the current milestone, it is assigned to that milestone.
1. **Initial Review from the Draw Steel contributor team.** This lets us spread out the review work and catch some of the more obvious things that need to be fixed before final review. Generally this talks about code style and some methodology.
2. **Final Review from the Maintainers.** ChaosOS and Zhell have final review and are the only ones with merge permission.

#### PR Size

Please understand that large and sprawling PRs are exceptionally difficult to review. As much as possible, break down the work for a large feature into smaller steps. Even if multiple PRs are required for a single Issue, this will make it considerably easier and therefore more likely that your contributions will be reviewed and merged in a timely manner.