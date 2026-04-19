<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Security Policy for Coding Agents

- Claude Code, Codex, and any other coding agent working on web apps, APIs, auth, data access, or integrations in this project must follow OWASP Top 10 web application security guidance and OWASP API Security Top 10 guidance by default.
- Treat this as a required baseline: validate untrusted input on the server, enforce authentication and authorization explicitly, apply least privilege, protect secrets, use secure defaults, and prevent common OWASP Top 10 and API Top 10 failures including broken access control, injection, cryptographic failures, SSRF, mass assignment, and excessive data exposure.
- Never trust client-provided identity, role, scope, pricing, or permission data without server-side verification, and call out unresolved OWASP risks before shipping.
