export type MenuProduct = {
  id: string;
  name: string;
  details: string;
  price: number;
  imageUrl?: string;
};

export type MenuSection = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  items: MenuProduct[];
};