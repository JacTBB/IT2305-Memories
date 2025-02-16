# Contributing

When contributing to this repository,
please first discuss the change you wish to make with the owners of this repository before making a change.

## Linting

We use [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/)
to ensure that code is consistent.
Please ensure that your code passes linting before merging a Pull Request.

```sh
# To lint your code, run:
npm run lint
```

## Commit Message Guidelines

When committing, commit messages are prefixed with one of the
following depending on the type of change made, optionally followed by a scope that provides more context about the part of the project affected by the changes.

Format: `<type>(<scope>): <description>`

- `feat(scope):` when a new feature is introduced with the changes.
- `fix(scope):` when a bug fix has occurred.
- `chore(scope):` for changes that do not relate to a fix or feature and do not modify
  _source_ or _tests_. (like updating dependencies)
- `refactor(scope):` for refactoring code that neither fixes a bug nor adds a feature.
- `docs(scope):` when changes are made to documentation.
- `style(scope):` when changes that do not affect the code, but modify formatting.
- `test(scope):` when changes to tests are made.
- `perf(scope):` for changes that improve performance.
- `ci(scope):` for changes that affect CI.
- `build(scope):` for changes that affect the build system or external dependencies.
- `revert(scope):` when reverting changes.

The `scope` is optional and can be omitted if the change affects the project as a whole.

Commit messages are also to begin with an uppercase character.
Below list some example commit messages.

```sh
git commit -m "docs(README): Added README.md"
git commit -m "revert(README): Removed README.md"
git commit -m "docs(README): Moved README.md"
```

Note: The scope should provide a quick indication of what part of the project is affected by the changes, such as a module name, a component name, or a general area.
