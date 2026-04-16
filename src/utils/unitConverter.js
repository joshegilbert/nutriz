/**
 * Unit conversion utilities for food measurements
 * Supports common nutrition measurement units
 */

// Conversion factors to grams (base unit)
const UNIT_TO_GRAMS = {
  // Weight units
  'g': 1,
  'gram': 1,
  'grams': 1,
  'kg': 1000,
  'kilogram': 1000,
  'kilograms': 1000,
  'oz': 28.3495,
  'ounce': 28.3495,
  'ounces': 28.3495,
  'lb': 453.592,
  'pound': 453.592,
  'pounds': 453.592,
  
  // Volume units (approximate, varies by food density)
  'ml': 1, // For water-like liquids
  'milliliter': 1,
  'milliliters': 1,
  'l': 1000,
  'liter': 1000,
  'liters': 1000,
  'fl oz': 29.5735, // Fluid ounce
  'fluid ounce': 29.5735,
  'cup': 240, // Approximate for most liquids
  'cups': 240,
  'tbsp': 15, // Tablespoon
  'tablespoon': 15,
  'tablespoons': 15,
  'tsp': 5, // Teaspoon
  'teaspoon': 5,
  'teaspoons': 5,
  
  // Common serving sizes
  'piece': null, // Cannot convert
  'pieces': null,
  'slice': null,
  'slices': null,
  'whole': null,
};

/**
 * Convert amount from one unit to another
 * @param {number} amount - The amount to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {number|null} - Converted amount or null if conversion not possible
 */
export function convertUnit(amount, fromUnit, toUnit) {
  if (!fromUnit || !toUnit) return null;
  
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();
  
  if (from === to) return amount;
  
  const fromGrams = UNIT_TO_GRAMS[from];
  const toGrams = UNIT_TO_GRAMS[to];
  
  if (fromGrams === null || toGrams === null || fromGrams === undefined || toGrams === undefined) {
    return null; // Cannot convert (e.g., pieces, slices)
  }
  
  // Convert to grams first, then to target unit
  const grams = amount * fromGrams;
  return grams / toGrams;
}

/**
 * Get suggested units based on food category
 * @param {string} category - Food category
 * @returns {Array} - Array of suggested unit objects
 */
export function getSuggestedUnits(category) {
  const categoryLower = (category || '').toLowerCase();
  
  // Liquids
  if (categoryLower.includes('liquid') || categoryLower.includes('drink') || 
      categoryLower.includes('beverage') || categoryLower.includes('juice') ||
      categoryLower.includes('milk') || categoryLower.includes('water')) {
    return [
      { label: 'cup', value: 'cup', grams: 240 },
      { label: 'fl oz', value: 'fl oz', grams: 29.5735 },
      { label: 'ml', value: 'ml', grams: 1 },
      { label: 'tbsp', value: 'tbsp', grams: 15 },
    ];
  }
  
  // Vegetables and fruits (often measured by weight or pieces)
  if (categoryLower.includes('vegetable') || categoryLower.includes('fruit') ||
      categoryLower.includes('veggie')) {
    return [
      { label: 'cup', value: 'cup', grams: 240 },
      { label: 'oz', value: 'oz', grams: 28.3495 },
      { label: 'g', value: 'g', grams: 1 },
      { label: 'piece', value: 'piece', grams: null },
    ];
  }
  
  // Proteins (meat, fish, etc.)
  if (categoryLower.includes('protein') || categoryLower.includes('meat') ||
      categoryLower.includes('chicken') || categoryLower.includes('fish') ||
      categoryLower.includes('beef') || categoryLower.includes('pork')) {
    return [
      { label: 'oz', value: 'oz', grams: 28.3495 },
      { label: 'g', value: 'g', grams: 1 },
      { label: 'lb', value: 'lb', grams: 453.592 },
    ];
  }
  
  // Grains and carbs
  if (categoryLower.includes('grain') || categoryLower.includes('carb') ||
      categoryLower.includes('rice') || categoryLower.includes('pasta') ||
      categoryLower.includes('bread')) {
    return [
      { label: 'cup', value: 'cup', grams: 240 },
      { label: 'oz', value: 'oz', grams: 28.3495 },
      { label: 'g', value: 'g', grams: 1 },
      { label: 'slice', value: 'slice', grams: null },
    ];
  }
  
  // Dairy
  if (categoryLower.includes('dairy') || categoryLower.includes('cheese') ||
      categoryLower.includes('yogurt')) {
    return [
      { label: 'cup', value: 'cup', grams: 240 },
      { label: 'oz', value: 'oz', grams: 28.3495 },
      { label: 'g', value: 'g', grams: 1 },
      { label: 'tbsp', value: 'tbsp', grams: 15 },
    ];
  }
  
  // Fats and oils
  if (categoryLower.includes('fat') || categoryLower.includes('oil') ||
      categoryLower.includes('butter') || categoryLower.includes('nut')) {
    return [
      { label: 'tbsp', value: 'tbsp', grams: 15 },
      { label: 'tsp', value: 'tsp', grams: 5 },
      { label: 'g', value: 'g', grams: 1 },
      { label: 'oz', value: 'oz', grams: 28.3495 },
    ];
  }
  
  // Default suggestions
  return [
    { label: 'g', value: 'g', grams: 1 },
    { label: 'oz', value: 'oz', grams: 28.3495 },
    { label: 'cup', value: 'cup', grams: 240 },
    { label: 'tbsp', value: 'tbsp', grams: 15 },
  ];
}

/**
 * Format amount with unit based on client preference
 * @param {number} amount - The amount
 * @param {string} unit - The unit
 * @param {string} preference - 'metric' or 'imperial'
 * @returns {string} - Formatted string
 */
export function formatAmount(amount, unit, preference = 'metric') {
  if (!amount && amount !== 0) return '';
  if (!unit) return String(amount);
  
  const unitLower = unit.toLowerCase().trim();
  
  // If already in preferred system, return as-is
  if (preference === 'metric') {
    if (['g', 'gram', 'grams', 'kg', 'kilogram', 'ml', 'milliliter', 'l', 'liter'].includes(unitLower)) {
      return `${formatNumber(amount)} ${unit}`;
    }
    // Convert imperial to metric
    if (unitLower === 'oz' || unitLower === 'ounce') {
      const grams = amount * 28.3495;
      return `${formatNumber(grams)} g`;
    }
    if (unitLower === 'lb' || unitLower === 'pound') {
      const grams = amount * 453.592;
      if (grams >= 1000) {
        return `${formatNumber(grams / 1000)} kg`;
      }
      return `${formatNumber(grams)} g`;
    }
    if (unitLower === 'cup' || unitLower === 'cups') {
      const ml = amount * 240;
      if (ml >= 1000) {
        return `${formatNumber(ml / 1000)} L`;
      }
      return `${formatNumber(ml)} ml`;
    }
    if (unitLower === 'fl oz' || unitLower === 'fluid ounce') {
      const ml = amount * 29.5735;
      return `${formatNumber(ml)} ml`;
    }
  } else {
    // Imperial preference
    if (['oz', 'ounce', 'lb', 'pound', 'cup', 'cups', 'fl oz', 'tbsp', 'tsp'].includes(unitLower)) {
      return `${formatNumber(amount)} ${unit}`;
    }
    // Convert metric to imperial
    if (unitLower === 'g' || unitLower === 'gram') {
      const oz = amount / 28.3495;
      return `${formatNumber(oz)} oz`;
    }
    if (unitLower === 'kg' || unitLower === 'kilogram') {
      const lb = (amount * 1000) / 453.592;
      return `${formatNumber(lb)} lb`;
    }
    if (unitLower === 'ml' || unitLower === 'milliliter') {
      const flOz = amount / 29.5735;
      return `${formatNumber(flOz)} fl oz`;
    }
    if (unitLower === 'l' || unitLower === 'liter') {
      const cups = (amount * 1000) / 240;
      return `${formatNumber(cups)} cup${cups !== 1 ? 's' : ''}`;
    }
  }
  
  // Fallback: return as-is
  return `${formatNumber(amount)} ${unit}`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Get all available units
 */
export function getAllUnits() {
  return [
    { label: 'Grams (g)', value: 'g' },
    { label: 'Kilograms (kg)', value: 'kg' },
    { label: 'Ounces (oz)', value: 'oz' },
    { label: 'Pounds (lb)', value: 'lb' },
    { label: 'Milliliters (ml)', value: 'ml' },
    { label: 'Liters (L)', value: 'l' },
    { label: 'Cups', value: 'cup' },
    { label: 'Fluid Ounces (fl oz)', value: 'fl oz' },
    { label: 'Tablespoons (tbsp)', value: 'tbsp' },
    { label: 'Teaspoons (tsp)', value: 'tsp' },
    { label: 'Pieces', value: 'piece' },
    { label: 'Slices', value: 'slice' },
  ];
}

