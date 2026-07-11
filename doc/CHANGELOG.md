# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.8.2] - 2026-07-11

### Fixed
- The package still failed to load on n8n 2.x npm installs (`Cannot find module 'xmlbuilder'`): n8n's community-package installer only fetches direct dependencies, not transitive ones. `xml2js` and `js2xmlparser` are now bundled in the published tarball (`bundleDependencies`) together with their own dependencies (`sax`, `xmlbuilder`, `xmlcreate`), so nothing needs to be resolved at install time

## [2.8.1] - 2026-07-11

### Fixed
- The package failed to load on n8n 2.x npm installs (`Cannot find module 'axios'`): Raw Mode now uses n8n's `httpRequest` helper (`json: false`, `encoding: 'text'`) instead of requiring axios, which n8n no longer exposes to community nodes

## [2.8.0] - 2026-07-03

### Fixed
- **Security**: the API key is no longer exposed in the "Show Request Info" debug output (Authorization header redacted, username masked)
- Multilang fields (arrays of `{id, value}` on multi-language shops) are no longer corrupted into `"[object Object]"` by type conversion
- Delete with "Never Error" now reports `success: false` with the real status code instead of a fabricated success
- "Include Response Headers" now returns the real response headers and status code (e.g. 201 on create) instead of hardcoded `{}` / 200
- Type conversion is applied even when "Show Request URL" / "Show Request Info" / "Include Response Headers" wrappers are enabled
- Get by ID on resources with irregular plurals (`categories`, `addresses`, `countries`, `currencies`, `taxes`, ...) now unwraps the single-item envelope correctly
- Values are no longer XML-escaped inside CDATA sections (HTML descriptions and `&` characters were stored double-encoded); `]]>` sequences are safely split
- Field names are validated before being used as XML tag names (prevents element injection)
- CUSTOM filter expressions keep the full value when it contains `=`
- Resource IDs are URL-encoded in request paths (prevents path traversal / query injection from upstream data)
- HTTP 429 responses are retried when "Retry On Error" is enabled (string status codes are now handled)
- Create (POST) calls are no longer retried on ambiguous network timeouts, preventing duplicate records
- Display "Custom Fields" with an empty field list now fails with a clear message instead of sending an invalid `display=custom`
- The credential test now normalizes the base URL (adds `/api` when missing) like the node does
- `main` entry in package.json now points to a real compiled file (`dist/index.js`)
- Operation and field dropdowns reload when the resource changes (n8n cached the options of the first resource, e.g. `order_details` wrongly offered Create/Delete)

### Added
- `order_invoices` resource (list, get by ID, search, create, update, delete)

### Removed
- Dead "Test Connection" toggle in credentials (was never read)
- `guests` was removed from the documentation (it was never implemented)

## [2.7.0] - 2026-06-27

### Fixed
- Search filters: operators that require a value now throw a clear error when the value is empty instead of silently returning all records
- Bumped `form-data` override to ^4.0.6 (CVE / Dependabot)

### Added
- Retry attempts are logged to the n8n server logs

## [2.6.0] - 2026-06-11

### Added
- **Retry On Error** option: automatic retry on transient failures (network errors, 5xx, rate-limit) with configurable max retries and delay

## [2.5.0] - 2026-06-09

### Added
- **Delay Between Calls** option to throttle PrestaShop requests

## [2.4.2] - 2026-06-09

### Fixed
- Skip null field values to prevent a crash on create/update

## [2.4.1] - 2026-06-08

### Fixed
- Equal operator selectable again in the search filters UI

### Changed
- npm trusted publishing (OIDC) workflow on release

## [2.4.0] - 2026-04-24

### Added
- `stock_movements` resource; API names surfaced in resource descriptions

### Security
- Resolved 20 Dependabot alerts via dependency upgrades and overrides

## [2.3.0] - 2026-02-12

### Changed
- Split monolithic files into a modular architecture (`utils/`, `helpers/`)

## [2.2.0] - 2026-02-12

### Fixed
- Convert `id` and `id_*` foreign-key fields from string to number in responses

### Added
- Jest unit test suite (183 tests) and n8n UI integration test suite

## [2.1.1] - 2025-12-05

### Fixed
- Removed axios from dependencies to fix a module conflict with n8n's bundled axios

## [2.1.0] - 2025-12-05

### Changed
- Code optimizations and cleanup

## [2.0.5] - 2025-12-04

### Added
- `order_carriers` resource

## [2.0.4] - 2025-12-03

### Fixed
- URL normalization; Orders `reference` field

## [2.0.3] - 2025-10-31

### Fixed
- Enhanced association fields type conversion

## [2.0.2] - 2025-10-31

### Changed
- Node version array support

## [2.0.1] - 2025-10-30

### Fixed
- Type corrections

### Added
- New resources

## [2.0.0] - 2025-10-26

### Added
- Field autocomplete and performance optimizations

## [1.0.0] - 2025-09-05

### Added
- Initial release of the PrestaShop 8 node
- Complete CRUD support: Create, Read, Update, Delete, Search
- Automatic XML/JSON conversion with PrestaShop structure simplification
- Raw mode for direct access to raw XML/JSON data
- Advanced search with filters, sorting, pagination
- Secure authentication via PrestaShop API key
- 25+ supported resources
- Debug options: URL display, headers, customizable timeout
- Multilingual documentation: English, French, German, Spanish
