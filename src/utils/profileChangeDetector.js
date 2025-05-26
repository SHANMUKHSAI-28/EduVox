/**
 * Utility to detect meaningful changes in user profile
 * Used to determine if a study abroad pathway needs to be refreshed
 */

/**
 * Generates a hash from profile to detect changes in pathway-relevant fields
 * @param {Object} profile - User's academic profile
 * @returns {string} A string hash representation of relevant profile fields
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
 * Check if profile has changed in a way that would affect pathways
 * @param {Object} profile - Current profile
 * @param {string} previousHash - Previous profile hash 
 * @returns {boolean} True if profile has changed in a way that affects pathways
 */
export const hasProfileChanged = (profile, previousHash) => {
  if (!previousHash) return true; // First load
  
  const currentHash = generateProfileHash(profile);
  return currentHash !== previousHash;
};
