import { addDays, formatISO } from "date-fns";

export function buildProgram({ clientId, startDate, length }) {
  const start = new Date(startDate);

  const days = [];
  for (let i = 0; i < length; i++) {
    const currentDate = addDays(start, i);

    days.push({
      date: formatISO(currentDate, { representation: "date" }), // YYYY-MM-DD
      meals: [
        { mealTime: "Breakfast", items: [] },
        { mealTime: "Lunch", items: [] },
        { mealTime: "Dinner", items: [] },
        { mealTime: "Snacks", items: [] },
      ]
    });
  }

  return {
    id: Date.now(),
    clientId,
    startDate: formatISO(start, { representation: "date" }),
    length,
    days
  };
}
