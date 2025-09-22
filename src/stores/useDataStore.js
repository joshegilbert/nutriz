import { ref } from "vue";

// Reactive state for clients
const clients = ref([
  {
    id: 1,
    name: "Jane Doe",
    email: "jane.doe@example.com",
    status: "Active",
    last_active: "2025-09-21",
  },
  {
    id: 2,
    name: "John Smith",
    email: "john.smith@example.com",
    status: "Active",
    last_active: "2025-09-20",
  },
  {
    id: 3,
    name: "Peter Jones",
    email: "peter.jones@example.com",
    status: "Pending",
    last_active: "2025-09-15",
  },
]);

// Reactive state for recipes
const recipes = ref([
  {
    id: 1,
    name: "Chicken and Broccoli",
    description: "A classic healthy meal.",
    calories: 450,
    protein: 50,
    imageUrl: "https://i.redd.it/lzeuyzw54mza1.jpg",
  },
  {
    id: 2,
    name: "Salmon with Asparagus",
    description: "Rich in omega-3s.",
    calories: 550,
    protein: 45,
    imageUrl:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800",
  },
  {
    id: 3,
    name: "Quinoa Salad",
    description: "A vegetarian option.",
    calories: 350,
    protein: 15,
    imageUrl:
      "https://masterpiecer-images.s3.yandex.net/0cbdd5df864c11eeb95dceda526c50ab:upscaled",
  },
  {
    id: 4,
    name: "Greek Yogurt Bowl",
    description: "Perfect for breakfast.",
    calories: 300,
    protein: 25,
    imageUrl:
      "https://pics.craiyon.com/2023-08-04/e419f4f8746d48b6a0f401d6a257af4f.webp",
  },
]);

// The composable function to be used in components
export function useDataStore() {
  return { clients, recipes };
}
