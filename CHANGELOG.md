# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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