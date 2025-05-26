/**
 * Pathway change detection utility for MyStudyPath component
 * This helper is used to determine if a pathway needs to be regenerated
 * when user profile changes
 */

/**
 * Generate a hash from profile to detect relevant changes
 * @param {Object} profile - User academic profile
 * @returns {string} Hash string representing relevant pathway fields
 */
export const generateProfileHash = (profile) => {
  if (!profile) return '';
  
  // Only include fields that would affect pathway generation
  const relevantFields = {
    preferred_countries: profile.preferred_countries || [],
    preferred_fields_of_study: profile.preferred_fields_of_study || [],
    education_level: profile.education_level || '',
    nationality: profile.nationality || '',
    budget_min: profile.budget_min || 0,
    budget_max: profile.budget_max || 0,
  };
  
  return JSON.stringify(relevantFields);
};

/**
 * Check if profile has changed in a way that requires pathway regeneration
 * @param {Object} profile - Current user profile
 * @param {string} previousHash - Previous profile hash
 * @returns {boolean} True if profile needs pathway update
 */
export const shouldUpdatePathway = (profile, previousHash) => {
  // Always update on first load or when hash is missing
  if (!previousHash) return true;
  
  // Generate hash of current profile
  const currentHash = generateProfileHash(profile);
  
  // If hashes are different, update needed
  return currentHash !== previousHash;
};

/**
 * Feature flag to control pathway refresh behavior
 * When true, only update pathway when profile preferences change
 * When false, check for updates on every component mount
 */
export const ONLY_UPDATE_ON_PROFILE_CHANGE = true;
