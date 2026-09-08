# Security policy

## Supported versions

Valory is currently in controlled beta. Security fixes are applied only to the latest code on the `main` branch and the current release deployment.

## Reporting a vulnerability

Please report suspected vulnerabilities privately.

1. Open the repository's **Security** tab and select **Report a vulnerability**.
2. Include the affected component, clear reproduction steps, the likely impact, and any suggested mitigation.
3. Do not include real customer, seller, agent, property, authentication, API-key, or payment data in the report.

If private vulnerability reporting is not available, contact the `PearLend1` repository owner through GitHub first and request a private reporting channel. Do not open a public issue containing exploit details, credentials, personal data, or proof-of-concept code.

We will aim to acknowledge a credible report within five working days, assess severity promptly, and coordinate disclosure after a fix is available. Please allow a reasonable remediation period before public disclosure.

## Secrets and personal data

Never commit or share production secrets. This includes Street Data credentials, session/JWT secrets, database credentials, deployment tokens, OAuth secrets, personal data, or production `.env` files.
