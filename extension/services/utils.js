// utils.js - Utility functions

/**
 * Counts occurrences of each tag in messages
 * @param {Array} messages - Messages with tags
 * @returns {Object} - Tag counts
 */
export function countTags(messages) {
    const counts = {};
    
    messages.forEach(msg => {
      msg.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    
    return counts;
  }
  
  /**
   * Creates a delay (Promise)
   * @param {Number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after the delay
   */
  export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }