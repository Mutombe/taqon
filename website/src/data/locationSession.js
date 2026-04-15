// Shared session storage for the customer's installation location.
// Populated either by the Solar Advisor step 2 selection or by typing
// an address into any quote/deposit form. Read back everywhere a user
// is about to request a quote, so they never have to re-type it.

const LOCATION_KEY = 'taqon-location';
const ADVISOR_DRAFT_KEY = 'taqon-advisor-draft';

/**
 * Read the saved location. Checks our own key first, falls back to the
 * Solar Advisor draft so picking an area in step 2 is automatically
 * available on the package-detail page and deposit modal.
 *
 * @returns {{area: string, distanceKm: number|null, coords: [number,number]|null}|null}
 */
export function getSavedLocation() {
  try {
    const own = sessionStorage.getItem(LOCATION_KEY);
    if (own) {
      const parsed = JSON.parse(own);
      if (parsed?.area) return parsed;
    }
    const draft = sessionStorage.getItem(ADVISOR_DRAFT_KEY);
    if (draft) {
      const parsed = JSON.parse(draft);
      if (parsed?.selectedArea) {
        return {
          area: parsed.selectedArea,
          distanceKm: parsed.distanceKm ?? null,
          coords: parsed.customCoords ?? null,
        };
      }
      // The advisor also keeps clientDetails.area when the user typed
      // a custom value in the quote form
      if (parsed?.clientDetails?.area) {
        return {
          area: parsed.clientDetails.area,
          distanceKm: parsed.distanceKm ?? null,
          coords: parsed.customCoords ?? null,
        };
      }
    }
  } catch {
    // sessionStorage unavailable or JSON parse failure — fall through to null
  }
  return null;
}

/**
 * Persist location for future quote/deposit flows. Pass a partial object;
 * null / empty values are ignored so a later form doesn't overwrite a
 * specific pick from the advisor with a blank.
 */
export function saveLocation({ area, distanceKm, coords } = {}) {
  try {
    const existing = getSavedLocation() || {};
    const next = {
      area: (area ?? existing.area ?? '').trim(),
      distanceKm: distanceKm ?? existing.distanceKm ?? null,
      coords: coords ?? existing.coords ?? null,
    };
    if (next.area) {
      sessionStorage.setItem(LOCATION_KEY, JSON.stringify(next));
    }
  } catch {
    // silent — best effort
  }
}

/** Returns the saved area string (e.g. "Borrowdale, Harare") or ''. */
export function getDefaultAreaString() {
  return getSavedLocation()?.area || '';
}

export function clearSavedLocation() {
  try {
    sessionStorage.removeItem(LOCATION_KEY);
  } catch {
    // silent
  }
}
