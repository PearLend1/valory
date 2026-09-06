export const COOKIE_NAME = "app_session_id";

// Public production sessions should not remain valid for a full year.
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

// Backwards-compatible alias for the Manus-generated auth module. This now
// intentionally resolves to the safer 30-day session lifetime above.
export const ONE_YEAR_MS = SESSION_MAX_AGE_MS;

export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
