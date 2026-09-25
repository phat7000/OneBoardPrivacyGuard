# Upstream integration

## Primary engine

- Repository: https://github.com/WLojek/DocCloak.Core
- npm package: `@doccloak/core`
- Pinned version: `0.12.1`
- Reference commit: `3eb9f21181938d36674e97c41ad1c7e8397a0e97`
- License: Apache License 2.0

OneBoard Privacy Guard consumes DocCloak.Core as a pinned npm dependency. It does not copy or vendor the full upstream source tree. The application's integration supplies explicit local storage, cache, tokenizer, WebAssembly, and constrained fetch adapters. Model download is disabled by default with `autoLoad: false` and begins only through the consent flow.

To upgrade, review upstream release notes and commits after the reference commit, audit dependency and model licenses, change the exact package version, regenerate the lockfile, rebuild local assets, and run the full privacy/document/offline regression suite before release.

## Architectural reference only

[Rizzo-PII](https://github.com/Rizzo-AI-Academy/rizzo-pii) informed only the local-first desktop packaging philosophy. No Rizzo Python/PyTorch backend, model, or Italian PII implementation is included.

No DocCloak AGPL web application code is included. No PyMuPDF is included. No Rizzo model or backend is included.
