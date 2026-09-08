# Manus deployment instruction — Valory Street Data and launch safety

Use this instruction in the Manus project that publishes the Valory website.

---

First confirm that the public Manus site is deployed from the GitHub repository `PearLend1/valory`. Do not assume that the visually similar project and this repository are connected. If the site uses another repository or an internal Manus snapshot, connect it to this repository or port every change from draft pull request **#2: “Fix Street Data valuation path and add production security gate.”**

Deploy the pull-request branch to a staging URL before changing production:

```text
fix/street-data-secure-compliance-2026-09-06
```

## Required server-side deployment settings

Store these in the Manus server/deployment secret manager, not in source control and not in browser-visible environment variables:

```text
NODE_ENV=production
STREET_DATA_API_KEY=<the real key from the Street Data dashboard>
ALLOW_SYNTHETIC_VALUATIONS=false
ENABLE_DEMO_MODE=false
ENABLE_DEMO_ADMIN=false
ENABLE_PUBLIC_SIGNUPS=false
JWT_SECRET=<a cryptographically random value of at least 32 characters>
```

Keep `ENABLE_PUBLIC_SIGNUPS=false` until Valory’s accurate privacy notice, retention schedule, processor terms and just-in-time form notices are published. Do not create `VITE_STREET_DATA_API_KEY`, expose the key in client JavaScript, or include it in logs or error responses.

## Confirm the correct valuation path

The seller form must navigate to `/sell/valuation`. The route must render `SellerValuationResult`, which calls the `valuation.estimateWithExplanation` tRPC procedure. Do not remove the explicit `/sell/valuation` route.

The server must use `ProductionStreetDataProvider` and `services/liveComparableSelection.ts`. The fallback order must remain:

1. Street Data completed-sale evidence for a complete covered postcode.
2. Verified stored comparable sales if a production database is connected.
3. No valuation if neither real source is available.

Synthetic values must never appear on the public deployment. They are permitted only in a deliberately labelled local demonstration with `ALLOW_SYNTHETIC_VALUATIONS=true`.

## Mandatory staging tests

1. Open `/api/health`. It must return HTTP 200 with:

```json
{
  "status": "ok",
  "streetData": {
    "configured": true,
    "available": true
  }
}
```

2. Complete the seller valuation form with a real full postcode inside `coverage-config.ts`.
3. Confirm the result page loads rather than returning a 404.
4. Confirm the response contains `dataSource: "street-data"` or an intentionally verified `"blended"` source.
5. Confirm “How we calculated this” visibly identifies Street Data and HM Land Registry completed-sale evidence.
6. Confirm the response includes `evidenceRetrievedAt` and real comparable dates/prices.
7. Temporarily remove the Street Data key in staging. The valuation must show “Valuation unavailable”; it must not invent a plausible price.
8. Add `?role=admin` to the public URL. It must not create an admin identity or unlock protected data.
9. Confirm agent matching, seller introductions, payments/subscriptions and video uploads do not return simulated production success.
10. Inspect browser page source, JavaScript bundles, source maps, network responses and application logs. Neither `STREET_DATA_API_KEY` nor `JWT_SECRET` may appear.
11. Confirm the exact dependency lockfile is installed with `npm ci`; the pull request’s production dependency audit and build must pass.
12. Confirm the homepage and `/sell/valuation` load through the production server.

## Mandatory live-domain checks after publication

- The Manus hostname and any custom domain resolve publicly.
- HTTP redirects permanently to HTTPS.
- The certificate is valid, covers the hostname and renews automatically.
- Responses include the CSP, HSTS, anti-framing, MIME-sniffing, referrer and permissions headers added by the pull request.
- API responses use `Cache-Control: no-store`.
- General API throttling works, and valuation requests are limited to 10 per 15 minutes per client address.
- Session cookies are `HttpOnly`, `Secure` and `SameSite=Lax`.
- Non-essential analytics does not load before an equally clear accept/reject cookie choice.

## Do not call the service compliant yet

Keep the public service described as a controlled technical beta until all items in `DEPLOYMENT_SECURITY_COMPLIANCE.md` are complete. The current Privacy, Terms and Cookie pages are placeholders and must not be represented as final.

Before enabling contact forms, agent registrations, beta signups or seller-to-agent introductions, obtain and publish the correct:

- legal entity/controller name, company number, registered office and jurisdiction;
- privacy contact and ICO registration/fee position;
- purposes and lawful bases for each data use;
- processor list, hosting regions and international-transfer safeguards;
- retention/deletion periods;
- exact consent and seller-to-agent sharing trigger;
- direct-marketing choices and suppression process;
- explanation of automated valuation, profiling and agent ranking;
- complaints/redress arrangements and any estate-agency regulatory position.

Remove or qualify claims such as “never shared” wherever Valory may later share details following the seller’s informed request. Sponsored or subscription-influenced agent placement must be labelled and the ranking basis explained.

## Next valuation improvement after this repair

The repaired beta uses completed transactions from a full postcode. For a more defensible property-specific valuation, add address selection, resolve the selected home to a Street Group property ID or UPRN, then request that one property’s estimated values and nearby completed transactions. Cache the response, retain source/timestamp/provenance and distinguish predicted attributes from user-confirmed facts.

Do not publish production until the staging tests pass and the site’s deployment source has been positively matched to the GitHub repository.
