# Valory production deployment, security and compliance gate

**Review date:** 6 September 2026  
**Scope:** public Valory website, online valuation flow, seller lead capture, agent matching, authentication and Street Data integration.

This document is an engineering and launch checklist. It is not a legal opinion or a substitute for review by a UK privacy/consumer-law professional.

## 1. Street Data deployment requirements

The API key is a server-side secret. It must be stored in the Manus deployment secret manager as:

```text
STREET_DATA_API_KEY=<real key from the Street Data dashboard>
ALLOW_SYNTHETIC_VALUATIONS=false
NODE_ENV=production
```

Never expose the key in browser code, a `VITE_` variable, source control, logs, screenshots or client-side network responses.

The public build must use `services/liveComparableSelection.ts`. Its production order is:

1. Street Data for a complete postcode within `coverage-config.ts`.
2. Stored comparables if a production database is available.
3. Synthetic comparables only when `ALLOW_SYNTHETIC_VALUATIONS=true` is deliberately set for a clearly labelled private demo.

### Deployment acceptance tests

1. `GET /api/health` returns HTTP 200 and:

```json
{
  "status": "ok",
  "streetData": {
    "configured": true,
    "available": true
  }
}
```

2. Run a valuation with a real full postcode in the configured Somerset coverage area.
3. Inspect the tRPC response and confirm `dataSource` is `street-data` (or `blended` if a verified database is deliberately used).
4. Remove the Street Data key in a staging deployment and confirm the public production build refuses to invent a valuation. It must show “valuation unavailable”, not a plausible-looking demo value.
5. Confirm the API key is absent from browser JavaScript, page source, network responses and error messages.
6. Confirm unsuccessful upstream calls do not expose Street Data response bodies or credentials to the visitor.

### Accuracy and cost control

The current postcode endpoint can return multiple properties, and Street Data charges per returned property. Before a larger public launch, add address selection and resolve the chosen property to a Street Group ID or UPRN, then request only the fields needed for that property. Cache responses for a sensible period and add per-user/IP limits around valuation requests.

Every valuation result should display:

- whether its evidence came from Street Data, the internal sold-price database, or a blend;
- the date/time the evidence was obtained;
- the number and age of comparable transactions;
- a clear statement that it is an indicative automated estimate, not a survey, mortgage valuation or guaranteed sale price;
- whether material property attributes are predicted rather than verified, where applicable.

## 2. Security controls included in this branch

- Street Data is attempted before any database-free demo path.
- Synthetic public valuations are off by default.
- API key remains server-side.
- Public provider health check does not reveal the key.
- API rate limiting is applied per client address.
- JSON and URL-encoded request bodies are limited to 1 MB.
- `X-Powered-By` is disabled.
- Production responses add CSP, HSTS on HTTPS, anti-framing, MIME-sniffing, referrer and permissions headers.
- Session cookies use `HttpOnly`, `Secure` on HTTPS and `SameSite=Lax`.
- API responses are marked `no-store`.
- Unconditional analytics loading has been removed pending valid cookie consent.

## 3. Security work still required before a production launch

- Confirm the Manus domain redirects all HTTP traffic to HTTPS and serves a valid, auto-renewing certificate.
- Run an external TLS and security-header scan against the deployed domain after this branch is published.
- Add dependency, secret and code scanning in CI. Resolve high/critical findings before deployment.
- Add structured security logging without personal data or secrets, plus alerting for repeated authentication failures, rate-limit events and upstream API failure spikes.
- Add a persistent/distributed rate limiter before scaling to multiple server instances; the current in-memory limiter is a safe beta baseline only.
- Add CSRF protection to any cookie-authenticated state-changing routes if they later need cross-site cookie behaviour.
- Add account-session revocation and shorten/review the current long session lifetime.
- Add database encryption/managed backups, least-privilege credentials, access logging, tested restore procedures and documented deletion jobs before storing seller leads.
- Carry out an authorised penetration test before taking payments or holding a material volume of personal data.
- Create and test incident-response and personal-data-breach procedures.

## 4. UK privacy and PECR launch blockers

The current placeholder Privacy, Terms and Cookie pages are not sufficient for a public lead-generating service. Do not describe the service as “compliant” until the following are completed with accurate operational details.

### Privacy notice

Publish the notice at the point personal data is collected and include, at minimum:

- legal name and contact details of the controller operating Valory;
- company number, registered office and place of registration where applicable;
- privacy contact/DPO details if applicable;
- categories of data collected, including property/address information, account data, valuation inputs, technical logs and communications;
- purpose and lawful basis for each use;
- legitimate interests and balancing rationale where relied upon;
- named recipients or precise categories, including exactly when details are shared with estate agents;
- processors such as hosting, authentication, analytics, email, database and support suppliers;
- international transfers and safeguards;
- retention periods or clear criteria for each data category;
- user rights, withdrawal of consent where relevant, objection to direct marketing and how to exercise rights;
- right to complain to the ICO;
- source of data obtained from Street Data, public records, agents or other third parties;
- meaningful information about automated valuation, matching or profiling logic, its significance and likely consequences where legally required;
- whether fields are mandatory and what happens if the person does not provide them.

Add a short just-in-time notice beside every form, not only a footer link.

### Seller-to-agent introductions and marketing

The interface must distinguish clearly between:

1. processing necessary to deliver the valuation requested by the seller;
2. sharing the seller’s details with specifically identified/selected agents for an introduction;
3. Valory’s own future email/SMS/telephone marketing;
4. marketing by an agent beyond the introduction requested by the seller.

Do not use pre-ticked boxes or bundle optional marketing into the valuation. Record the notice version, choice, timestamp and source. Make withdrawal/opt-out straightforward. Maintain suppression records where required.

Remove or qualify any claim such as “your details are never shared” if the product can send those details to an agent. The wording must explain the exact trigger and recipient before submission.

### Cookies and analytics

- Keep non-essential analytics and advertising technologies off until valid consent is recorded.
- Provide equally clear accept and reject choices, granular controls, and a persistent way to change the decision.
- List each cookie/technology, provider, purpose and duration.
- Do not treat continued browsing as consent.
- Store and respect the consent record before loading analytics.

### Data protection operations

- Complete a data-flow map and record of processing activities.
- Decide whether a DPIA is required for property profiling, automated matching or large-scale behavioural data and document the assessment.
- Put written processor terms/data processing agreements in place.
- Establish identity-checked procedures and deadlines for access, deletion, correction, restriction, portability and objection requests.
- Register/pay the data-protection fee with the ICO if the operating entity is required to do so.
- Set an age policy and avoid knowingly collecting children’s data unless the service is designed and assessed for it.

## 5. Consumer, valuation and business-information requirements

- Show the operating limited company’s full legal name, company number, registered office and jurisdiction of registration on the website.
- Keep valuation claims fair, supportable and clear about limitations. Do not call an estimate “live”, “real-time”, “AI verified” or “accurate” unless the deployed evidence and testing substantiate that exact claim.
- Explain that Street Data estimated values are machine-generated predictions and may change.
- State that Valory is not providing a survey, mortgage valuation, financial advice or a guaranteed marketing price.
- Explain how agents are ranked, whether payment/subscription affects placement, and label sponsored/promoted results clearly.
- Publish complete terms covering eligibility, service scope, acceptable use, accounts, intellectual property, availability, third-party data, limitation of liability, complaints, termination and governing law.
- Confirm whether Valory’s activities amount to estate agency work or another regulated activity, and obtain the appropriate redress, AML or other registrations if the actual operating model requires them.

## 6. Information needed from the owner before legal pages can be finalised

- Exact legal entity operating Valory.
- Company number, registered office and jurisdiction.
- Public contact and privacy contact addresses.
- ICO registration/fee position.
- Full list of processors and hosting regions.
- Lead-retention periods and deletion rules.
- Exact seller-to-agent sharing workflow.
- Marketing channels and consent model.
- Agent ranking/commercial influence rules.
- Complaints and redress arrangements.
- Whether payments/subscriptions are live at launch.

Until those facts are supplied, the site can be treated as a controlled technical beta, but not certified or represented as fully secure or legally compliant.
