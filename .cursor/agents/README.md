# Vibe Coder Agent System

This directory defines a six-agent operating model for incremental, low-regression development.

## Agent Directory
- `planner.md`: request decomposition, pre-flight architecture, and dependency sequencing
- `frontend.md`: UI behavior, state boundaries, accessibility, and interaction coverage
- `backend.md`: API/business logic with resilient integrations and strict contracts
- `database.md`: schema, migration safety, and query/index performance alignment
- `security.md`: proactive hardening and risk review before merge
- `qa.md`: vibe-check tests first, then failure/regression confidence

## Single-Agent Use
Use one specialist when the change is isolated:
- UI-only change -> Frontend
- API-only change -> Backend
- Schema-only change -> Database
- Security audit only -> Security
- Test expansion only -> QA

## Multi-Agent Use
Use orchestration for cross-layer work:
1. Planner creates scoped slices and execution order.
2. Frontend, Backend, and Database implement their slices.
3. Security reviews combined change surface.
4. QA validates critical and failure paths.

## Prompt Routing Examples

### Planner Prompt
"Outline architecture, dependencies, and 4 implementation slices for adding password reset."

### Backend Prompt
"Implement the password-reset token verification endpoint with timeout, retry-safe behavior, and typed error responses."

### QA Prompt
"Create 3-5 focused tests for password reset covering success, expired token, and invalid token paths."

## Dry-Run Validation Template
Use this sequence to validate the system behavior quickly:
1. Ask Planner for architecture + slices + acceptance criteria.
2. Ask Backend to implement one API slice using resilience defaults.
3. Ask QA to write focused tests for success and failure paths.
4. Confirm outputs include:
   - scoped plan,
   - robust API error handling,
   - deterministic tests with explicit failure coverage.
