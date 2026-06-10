/**
 * Removes properties with null values from an object
 * @param {Object} obj - The object to clean
 * @returns {Object} New object without null properties
 */
export const cleanNullProperties = (obj) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === null) delete newObj[key];
  });
  return newObj;
};
