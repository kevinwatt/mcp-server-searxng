# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.11] - 2026-09-01

### Fixed
- An empty search is no longer reported as `All SearXNG instances failed`. When an
  instance is reachable but has no hits for a query, `searchWithFallback` returns an
  empty result set and `web_search` reports `No results found` with `isError: false`;
  the error is now thrown only when no instance was reachable at all (#8, thanks
  @ebongard)
- A `200` response whose body has no `results` array (an auth portal, a proxy error
  envelope) is treated as a failed instance rather than as an empty search
- The version the server reports in its MCP handshake was hardcoded and six releases
  behind `package.json`; it is now synced automatically on `npm version`
- The published package no longer ships the compiled test file; `tsconfig.json` had no
  `exclude`, so `src/index.test.ts` was built into `dist/` and packed into the tarball

### Removed
- Smithery packaging (`smithery.yaml`, README badge and install section). It was also
  the only place referencing `SEARXNG_URL`, an env var the server never read

## [0.3.10] - 2026-06-18

Tagged but never published to npm, which is still serving 0.3.9; its changes reach
users in 0.3.11.

### Added
- Support for instance URLs carrying a base path, so path-based reverse proxy routing
  resolves correctly with or without a trailing slash (#7, thanks @lord2800)

## [0.3.9] - 2025-03-23

### Fixed
- Replaced the empty string in the `time_range` enum with `all_time`, which the Gemini
  API rejected

## [0.3.8] - 2024-03-19

### Fixed
- Added support for both HTTP and HTTPS protocols

## [0.3.7] - 2024-03-19

### Fixed
- Fixed server startup issue by removing conditional runServer() call

## [0.3.6] - 2024-03-19

### Changed
- Improved test coverage using nock for HTTP request mocking
- Removed redundant mock implementations
- Fixed test reliability issues
- add NODE_TLS_REJECT_UNAUTHORIZED to allow self-signed certificates