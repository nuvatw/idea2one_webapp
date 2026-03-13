/**
 * Application-wide constants.
 */

export const APP_NAME = "nuva";
export const APP_DESCRIPTION = "一日戶外工作坊即時活動助手";

/** Staff members allowed to switch agenda stages */
export const STAGE_SWITCH_ALLOWED_STAFF = ["Lily", "Asa", "上哲"];

/** Staff shared password — sourced from env var in production */
export const STAFF_PASSWORD_ENV_KEY = "STAFF_PASSWORD";

/** Default staff password for dev only — production uses env var */
export const STAFF_PASSWORD_DEFAULT = "0012";

/** Session cookie names */
export const PARTICIPANT_SESSION_COOKIE = "ff_participant_session";
export const STAFF_SESSION_COOKIE = "ff_staff_session";

/** Question code prefix */
export const QUESTION_CODE_PREFIX = "Q";

/** Auto-refresh interval for current agenda (ms) */
export const AGENDA_REFRESH_INTERVAL_MS = 30_000;
