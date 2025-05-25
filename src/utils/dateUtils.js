/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Format a Firebase timestamp or Date object to a readable string
 * @param {Date|Object} dateInput - Date object or Firebase timestamp
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  let date;
  
  // Handle Firebase timestamp
  if (dateInput && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } 
  // Handle Date object
  else if (dateInput instanceof Date) {
    date = dateInput;
  }
  // Handle string dates
  else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  }
  // Handle timestamp numbers
  else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  }
  else {
    return 'Invalid Date';
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // Format the date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date to short format (MM/DD/YYYY)
 * @param {Date|Object} dateInput - Date object or Firebase timestamp
 * @returns {string} - Short formatted date string
 */
export const formatDateShort = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  let date;
  
  if (dateInput && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleDateString('en-US');
};

/**
 * Get relative time (e.g., "2 days ago", "3 hours ago")
 * @param {Date|Object} dateInput - Date object or Firebase timestamp
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  let date;
  
  if (dateInput && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) {
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  } else if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  } else if (diffWeeks > 0) {
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

/**
 * Check if a date is today
 * @param {Date|Object} dateInput - Date object or Firebase timestamp
 * @returns {boolean} - True if date is today
 */
export const isToday = (dateInput) => {
  if (!dateInput) return false;
  
  let date;
  
  if (dateInput && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Get month name from date
 * @param {Date|Object} dateInput - Date object or Firebase timestamp
 * @returns {string} - Month name
 */
export const getMonthName = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  let date;
  
  if (dateInput && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleDateString('en-US', { month: 'long' });
};
