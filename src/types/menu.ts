export type MenuProduct = {
  id: string;
  name: string;
  details: string;
  price: number;
};

export type MenuSection = {
  id: string;
  title: string;
  description: string;
  items: MenuProduct[];
};