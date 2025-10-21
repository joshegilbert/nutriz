import { addDays, formatISO } from "date-fns";

function blankMacros() {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function buildProgramTemplate({ clientId, startDate, length }) {
  const start = new Date(startDate);
  const normalizedStart = formatISO(start, { representation: "date" });

  const days = [];
  for (let i = 0; i < Number(length || 0); i += 1) {
    const currentDate = addDays(start, i);
    const date = formatISO(currentDate, { representation: "date" });
    days.push({
      date,
      meals: [
        { mealTime: "Breakfast", items: [], macros: blankMacros(), macrosSource: "auto" },
        { mealTime: "Lunch", items: [], macros: blankMacros(), macrosSource: "auto" },
        { mealTime: "Dinner", items: [], macros: blankMacros(), macrosSource: "auto" },
        { mealTime: "Snacks", items: [], macros: blankMacros(), macrosSource: "auto" },
      ],
      macros: blankMacros(),
      macrosSource: "auto",
    });
  }

  return {
    clientId,
    startDate: normalizedStart,
    length: Number(length || 0),
    days,
  };
}
