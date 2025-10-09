# Proposed Fix Tasks

## Typo Fix
- **File:** `src/components/PlanItemCard.vue`
- **Issue:** Comment currently reads "Ensure macros always exists," which uses the wrong verb agreement.
- **Proposed Task:** Update the comment to "Ensure macros always exist" to correct the typo and keep project comments professional.

## Bug Fix
- **File:** `src/views/PlanSummaryView.vue`
- **Issue:** The view calls `getItemDetails` and `calculateItemMacros`, but these functions are not defined or returned from `src/stores/useDataStore.js`, causing runtime errors when the component renders.
- **Proposed Task:** Either add the missing helper functions to the Pinia store or refactor the view to use existing utilities so the plan summary renders without throwing.

## Documentation/Comment Discrepancy Fix
- **File:** `src/views/PlanSummaryView.vue`
- **Issue:** Comment "Correctly get data and functions from the Pinia store" implies the destructured helpers exist, but they do not. The comment is misleading and hides the bug above.
- **Proposed Task:** Update the comment/documentation to accurately describe the missing functionality (or remove it once helpers exist) so future readers are not misled.

## Test Improvement
- **File:** `src/components/MealCalendar/utils/mealHelpers.js`
- **Issue:** Complex nutrition-calculation helpers (e.g., `calculateItemMacros`, `recalcMealTotals`) lack automated tests, increasing risk of regressions.
- **Proposed Task:** Introduce unit tests covering these helpers (happy path plus edge cases for overridden macros) to lock down core nutrition math.
