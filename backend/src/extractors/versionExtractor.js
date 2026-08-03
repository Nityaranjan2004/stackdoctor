import semver from 'semver';

/**
 * Coerces or cleans version strings using semver.
 * @param {string} versionStr
 * @returns {string} Cleaned version or fallback
 */
export function cleanVersion(versionStr) {
  if (!versionStr) return '0.0.0';
  try {
    const coerced = semver.coerce(versionStr);
    return coerced ? coerced.version : versionStr.replace(/[^0-9.]/g, '');
  } catch (e) {
    return versionStr;
  }
}

/**
 * Compares two versions.
 * @param {string} v1
 * @param {string} v2
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1, v2) {
  try {
    const cv1 = cleanVersion(v1);
    const cv2 = cleanVersion(v2);
    if (semver.valid(cv1) && semver.valid(cv2)) {
      return semver.compare(cv1, cv2);
    }
  } catch (e) {
    // fallback string comparison
  }
  return v1.localeCompare(v2);
}
