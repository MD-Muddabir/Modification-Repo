/**
 * Date Helper Utilities
 */

/**
 * Format a Date object or date string into a standard format.
 * @param {Date|string} date - Date to format
 * @param {string} format - Currently supports basic formatting (e.g. 'DD-MM-YYYY' or default 'YYYY-MM-DD')
 * @returns {string} Formatted date string
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    if (format === 'DD-MM-YYYY') {
        return `${day}-${month}-${year}`;
    }
    return `${year}-${month}-${day}`;
};

/**
 * Check if a given date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if the date has expired (is in the past)
 */
const isExpired = (date) => {
    if (!date) return true;
    const d = new Date(date);
    if (isNaN(d.getTime())) return true;
    return d.getTime() < new Date().getTime();
};

/**
 * Calculate the number of days remaining until a given date
 * @param {Date|string} date - Future date
 * @returns {number} Number of days remaining (negative if in the past)
 */
const daysRemaining = (date) => {
    if (!date) return 0;
    const d = new Date(date);
    if (isNaN(d.getTime())) return 0;
    
    const diffTime = d.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Add a specific number of days to a given date
 * @param {Date|string} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} New date object
 */
const addDays = (date, days) => {
    const d = date ? new Date(date) : new Date();
    d.setDate(d.getDate() + days);
    return d;
};

module.exports = {
    formatDate,
    isExpired,
    daysRemaining,
    addDays
};
