# Security Policy

## Reporting Security Issues

**Please do not report security vulnerabilities through public GitHub issues.**

To report a security vulnerability, please email: [security@promptfoo.dev](mailto:security@promptfoo.dev)

When reporting, please include:

- A detailed description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Proof-of-concept code or exploit (if available)
- Suggested remediation or fix (if any)

You should receive a response within 24 hours. If you do not, please send a follow-up email.

## Security Architecture

promptfoo is designed with a security-first approach:

### Data Privacy

- **Local-first operation**: All source code runs locally on your machine.
- **No data collection**: API calls to LLM providers are sent directly without interception.
- **No API key storage**: API keys are stored only as local environment variables and not saved elsewhere.
- **Data remains local**: All data stays on your machine unless you explicitly use the share command.
- **Share functionality**: When using the share command, data is temporarily stored in Cloudflare KV for two weeks.

### API Security

- **API keys as environment variables**: API keys are securely stored as environment variables.
- **Direct transmission**: Keys are transmitted only to their respective LLM providers.
- **No credential logging**: Credentials are neither logged nor transmitted to promptfoo servers.

### Telemetry

Basic anonymous telemetry is collected by default to help improve the tool. This includes:

- Commands executed (e.g., `init`, `eval`, `view`)
- Types of assertions used

No personally identifiable information or sensitive data is collected.

To opt out of telemetry, set the environment variable: `PROMPTFOO_DISABLE_TELEMETRY=1`

## Supported Versions

Only the latest version receives security updates. Users are encouraged to regularly update to the most recent version:

| Version | Supported |
| ------- | --------- |
| Latest  | ✅        |
| Older   | ❌        |

## License

This security policy is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
