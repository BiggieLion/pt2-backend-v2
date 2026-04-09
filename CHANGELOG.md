<!-- last-commit: 71601b271d4fd6619b16bd47a62fff1b138fd01f -->

# 📋 Changelog

All notable changes to this project are documented here.
Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Conventional Commits](https://www.conventionalcommits.org/).

---

## [Unreleased] — 2026-04-09

### 💥 Breaking Changes
- **core:** All controller responses are now wrapped by the global ResponseInterceptor; clients should expect the standardized JSON format instead of raw values — *Jair León* · `6f37d23` · 2025-09-17
- **security:** Clients must send the access token in the Authorization header; auth cookies are no longer set or read — *Jair León* · `bef997a` · 2025-10-01
- Add refresh token; switch to JWT; tighten validation; drop requester password; optimize Docker build — *Jair León* · `d173f5a` · 2025-09-23

### ✨ New Features
- **tracing:** Add OpenTelemetry tracing and correlation ID per request — *Jair León* · `6dfe06b` · 2026-04-09
- **staff:** Add staff management module with CRUD DTOs and entity — *Jair León* · `4705b7d` · 2026-01-30
- **api:** Improve API response handling and enhance Swagger documentation with new DTOs — *Jair León* · `92a9ce9` · 2026-01-23
- **api:** Enhance API documentation with Swagger annotations and custom response DTOs — *Jair León* · `e9b681a` · 2025-11-18
- **docker:** Enhance Docker setup with multi-stage builds and production configuration — *Jair León* · `e173b1a` · 2025-11-18
- **docs:** Add Swagger documentation setup and enhance LoginUserDto with password property — *Jair León* · `59d4304` · 2025-11-18
- **request:** Implement request module with CRUD operations and DTOs — *Jair León* · `2a8b20d` · 2025-10-24
- **security:** Enforce header-only auth, tighten JWT and input validation, and harden env/CORS/DB SSL — *Jair León* · `bef997a` · 2025-10-01
- **auth:** Add Cognito login and password reset flows — *Jair León* · `9f0cbb1` · 2025-09-23
- **infra,config,logger,health,auth:** Add Docker setup, env standardization, enhanced logger, health endpoints, and AuthModule scaffold — *Jair León* · `67ffa6f` · 2025-09-18
- **requester,api,deps:** Add Requester CRUD scaffolding, API versioning, and password hashing — *Jair León* · `8bf8f40` · 2025-09-17
- **dto:** Add UserDto interface and update response interfaces — *Jair León* · `f995bcd` · 2025-09-17
- **logger:** Add logger infrastructure with Pino — *Jair León* · `a7981ea` · 2025-09-11
- **database:** Implement database infrastructure with TypeORM — *Jair León* · `c3c035e` · 2025-09-11
- **database:** Add TypeORM PostgreSQL configuration and database module — *Jair León* · `669acdd` · 2025-09-11

### 🐛 Bug Fixes
- **security:** Apply security hardening and best practices — *Jair León* · `387e0b7` · 2026-04-06
- **repository:** Avoid logging full objects in not found warnings to protect PII — *Jair León* · `f69ddfb` · 2025-10-28
- **auth:** Normalize accessToken assignment order in login response — *Jair León* · `4526b83` · 2025-10-02
- **auth,requester,tests:** Normalize roles, version health, stabilize tests — *Jair León* · `0acac32` · 2025-09-23

### ♻️ Refactoring
- **ts+nestjs:** Apply TypeScript strictness and NestJS best practices — *Jair León* · `bd90e26` · 2026-04-07
- **core:** Standardize HTTP responses, register global pipes/interceptor, and harden tests — *Jair León* · `6f37d23` · 2025-09-17
- **interceptor:** Improve test readability and formatting — *Jair León* · `06d4005` · 2025-09-11

### 🧪 Tests
- **auth,requester,common,config:** Add and fix unit/integration tests; improve config parsing and DB logging — *Jair León* · `0045633` · 2025-09-19
- **app:** Enhance AppController tests with delegation and provider override — *Jair León* · `dc25900` · 2025-09-11
- **interceptor:** Add comprehensive tests for ResponseInterceptor — *Jair León* · `d2ed20f` · 2025-09-11

### 🔧 Chores
- **claude:** Add project config, hooks, rules, skills, and Postman collection — *Jair León* · `72e63a5` · 2026-04-09

### 📚 Documentation
- Add instructions for generating conventional commit messages — *Jair León* · `0857c25` · 2025-09-11
- Update README.md with project-specific information — *Jair León* · `6b6e9f5` · 2025-09-11

### 📝 Other Changes
- Born of the project 🍼 — *Jair León* · `ddc4ba2` · 2025-09-09
