export interface OrderRow {
  orderId: number;
  product: string;
  category: string;
  unitPrice: number;
  stock: number;
}

export const PRACTICE_HEADER = ["Order ID", "Product", "Category", "Unit Price", "Stock"] as const;

export const PRACTICE_ROWS: OrderRow[] = [
  { orderId: 5001, product: "Desk Lamp", category: "Lighting", unitPrice: 24.5, stock: 18 },
  { orderId: 5002, product: "Standing Desk", category: "Furniture", unitPrice: 349, stock: 4 },
  { orderId: 5003, product: "Wireless Mouse", category: "Electronics", unitPrice: 32.99, stock: 0 },
  { orderId: 5004, product: "Bookshelf", category: "Furniture", unitPrice: 129, stock: 7 },
  { orderId: 5005, product: "Monitor Arm", category: "Electronics", unitPrice: 59.99, stock: 11 },
  { orderId: 5006, product: "Task Chair", category: "Furniture", unitPrice: 189, stock: 2 },
];

export const PRACTICE_GRID_ROWS: string[][] = PRACTICE_ROWS.map((row) => [
  String(row.orderId),
  row.product,
  row.category,
  row.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  String(row.stock),
]);
