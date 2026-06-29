/**
 * Timezone helper to standardize all backend operations to UTC+8 (Asia/Manila).
 */

// Returns a Date object adjusted to UTC+8
const getLocalNow = () => {
  const now = new Date();
  // Add 8 hours for UTC+8
  return new Date(now.getTime() + (8 * 60 * 60 * 1000));
};

// Returns today's date string in YYYY-MM-DD format (adjusted to UTC+8)
const getLocalToday = () => {
  return getLocalNow().toISOString().split('T')[0];
};

module.exports = { getLocalNow, getLocalToday };
