# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- An empty search is no longer reported as `All SearXNG instances failed`. When an
  instance is reachable but has no hits for a query, `searchWithFallback` returns an
  empty result set and `web_search` reports `No results found` with `isError: false`;
  the error is now thrown only when no instance was reachable at all (#8, thanks
  @ebongard)
- A `200` response whose body has no `results` array (an auth portal, a proxy error
  envelope) is treated as a failed instance rather than as an empty search

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