import type { Product } from "@/types/product";

export const starterProducts: Product[] = [
  {
    id: "smoked-harissa",
    name: "Smoked Harissa Sauce",
    description: "Rich pepper heat with citrus peel and slow-roasted garlic.",
    price: 8.5,
    category: "Sauce",
    featured: true,
  },
  {
    id: "copper-tikka-blend",
    name: "Copper Tikka Blend",
    description: "Aromatic spice mix for grilling, marinades, and pan sears.",
    price: 6.75,
    category: "Spice",
  },
  {
    id: "olive-thyme-focaccia",
    name: "Olive & Thyme Focaccia",
    description: "Stone-baked loaf with sea salt crust and garden thyme.",
    price: 5.25,
    category: "Bakery",
    featured: true,
  },
  {
    id: "spark-citrus-tonic",
    name: "Spark Citrus Tonic",
    description: "House tonic with grapefruit, basil, and mineral finish.",
    price: 4.95,
    category: "Beverage",
  },
];