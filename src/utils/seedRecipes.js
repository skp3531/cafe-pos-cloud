import { db } from '../db/db.js';

const rawMaterials = [
  { name: 'Watermelon', category: 'Fresh Fruit', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.04, minStock: 2000 },
  { name: 'Pineapple', category: 'Fresh Fruit', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.06, minStock: 1000 },
  { name: 'Orange', category: 'Fresh Fruit', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.05, minStock: 1500 },
  { name: 'Mausambi', category: 'Fresh Fruit', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.05, minStock: 1500 },
  { name: 'Banana', category: 'Fresh Fruit', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.03, minStock: 2000 },
  { name: 'Mango Pulp', category: 'Fruit/Pulp', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.15, minStock: 1000 },
  { name: 'Guava Pulp', category: 'Fruit/Pulp', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.10, minStock: 1000 },
  { name: 'Strawberry Pulp', category: 'Fruit/Pulp', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.12, minStock: 500 },
  { name: 'Blueberry Crush', category: 'Fruit/Pulp', baseUnit: 'ml', purchaseUnit: 'L', conversionFactor: 1000, costPerBaseUnit: 0.25, minStock: 500 },
  
  { name: 'Milk', category: 'Dairy', baseUnit: 'ml', purchaseUnit: 'L', conversionFactor: 1000, costPerBaseUnit: 0.06, minStock: 5000 },
  { name: 'Curd/Yogurt', category: 'Dairy', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.08, minStock: 2000 },
  { name: 'Vanilla Ice Cream', category: 'Ice Cream', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.15, minStock: 2000 },
  { name: 'Khua', category: 'Dairy', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.40, minStock: 500 },
  
  { name: 'Sugar', category: 'Sweeteners', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.04, minStock: 3000 },
  
  { name: 'Chocolate Syrup', category: 'Syrups', baseUnit: 'ml', purchaseUnit: 'L', conversionFactor: 1000, costPerBaseUnit: 0.20, minStock: 1000 },
  { name: 'Butterscotch Syrup', category: 'Syrups', baseUnit: 'ml', purchaseUnit: 'L', conversionFactor: 1000, costPerBaseUnit: 0.20, minStock: 1000 },
  { name: 'Blue Curacao Syrup', category: 'Syrups', baseUnit: 'ml', purchaseUnit: 'L', conversionFactor: 1000, costPerBaseUnit: 0.25, minStock: 500 },
  { name: 'Mint Mojito Syrup', category: 'Syrups', baseUnit: 'ml', purchaseUnit: 'L', conversionFactor: 1000, costPerBaseUnit: 0.22, minStock: 500 },
  { name: 'Peach Syrup', category: 'Syrups', baseUnit: 'ml', purchaseUnit: 'L', conversionFactor: 1000, costPerBaseUnit: 0.22, minStock: 500 },
  { name: 'Strawberry Syrup', category: 'Syrups', baseUnit: 'ml', purchaseUnit: 'L', conversionFactor: 1000, costPerBaseUnit: 0.20, minStock: 500 },
  
  { name: 'Oreo Cookies', category: 'Biscuits/Chocolate', baseUnit: 'pcs', purchaseUnit: 'pcs', conversionFactor: 1, costPerBaseUnit: 2.00, minStock: 100 },
  { name: 'KitKat', category: 'Biscuits/Chocolate', baseUnit: 'pcs', purchaseUnit: 'pcs', conversionFactor: 1, costPerBaseUnit: 5.00, minStock: 50 },
  { name: 'Brownie', category: 'Bakery', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.30, minStock: 500 },
  
  { name: 'Coffee Powder', category: 'Coffee', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 1.50, minStock: 500 },
  
  { name: 'Oats', category: 'Dry Ingredients', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.15, minStock: 1000 },
  { name: 'Mixed Dry Fruits', category: 'Dry Ingredients', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.80, minStock: 500 },
  { name: 'Peanut Butter', category: 'Dry Ingredients', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.40, minStock: 500 },
  
  { name: 'Soda', category: 'Beverage', baseUnit: 'ml', purchaseUnit: 'L', conversionFactor: 1000, costPerBaseUnit: 0.03, minStock: 5000 },
  { name: 'Lemon Juice', category: 'Fresh Fruit', baseUnit: 'ml', purchaseUnit: 'L', conversionFactor: 1000, costPerBaseUnit: 0.15, minStock: 500 },
  { name: 'Mint Leaves', category: 'Herbs', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.10, minStock: 200 },
  { name: 'Chat Masala', category: 'Masala', baseUnit: 'g', purchaseUnit: 'kg', conversionFactor: 1000, costPerBaseUnit: 0.30, minStock: 100 },
];

const menuRecipes = {
  // 1. Fruit Juices
  'Watermelon': [{ name: 'Watermelon', qty: 250 }],
  'Pineapple': [{ name: 'Pineapple', qty: 200 }, { name: 'Sugar', qty: 15 }],
  'Orange': [{ name: 'Orange', qty: 250 }, { name: 'Sugar', qty: 10 }],
  'Mausambi (Sweet Lime)': [{ name: 'Mausambi', qty: 250 }, { name: 'Sugar', qty: 15 }],
  'Banana Shake': [{ name: 'Banana', qty: 120 }, { name: 'Milk', qty: 180 }, { name: 'Sugar', qty: 15 }],
  'Mango Shake': [{ name: 'Mango Pulp', qty: 60 }, { name: 'Milk', qty: 180 }, { name: 'Sugar', qty: 15 }],
  'Choco Banana Shake': [{ name: 'Banana', qty: 120 }, { name: 'Milk', qty: 150 }, { name: 'Chocolate Syrup', qty: 30 }, { name: 'Sugar', qty: 10 }],
  'Pineapple Shake': [{ name: 'Pineapple', qty: 150 }, { name: 'Milk', qty: 150 }, { name: 'Vanilla Ice Cream', qty: 30 }, { name: 'Sugar', qty: 15 }],
  'Mix Fruit Juice': [{ name: 'Watermelon', qty: 100 }, { name: 'Pineapple', qty: 50 }, { name: 'Orange', qty: 50 }, { name: 'Sugar', qty: 15 }],

  // 2. Smoothies
  'Oats Choco Banana Smoothie': [{ name: 'Oats', qty: 30 }, { name: 'Banana', qty: 100 }, { name: 'Milk', qty: 150 }, { name: 'Chocolate Syrup', qty: 20 }],
  'Guava Banana Smoothie': [{ name: 'Guava Pulp', qty: 50 }, { name: 'Banana', qty: 80 }, { name: 'Milk', qty: 150 }, { name: 'Sugar', qty: 15 }],
  'Dry Fruit Smoothie': [{ name: 'Mixed Dry Fruits', qty: 30 }, { name: 'Milk', qty: 180 }, { name: 'Vanilla Ice Cream', qty: 30 }, { name: 'Sugar', qty: 10 }],
  'Oats Dry Fruit Smoothie': [{ name: 'Oats', qty: 20 }, { name: 'Mixed Dry Fruits', qty: 20 }, { name: 'Milk', qty: 180 }, { name: 'Sugar', qty: 10 }],
  'Add On: Peanut Butter': [{ name: 'Peanut Butter', qty: 20 }],

  // 3. Milkshakes
  'Oreo': [{ name: 'Milk', qty: 180 }, { name: 'Vanilla Ice Cream', qty: 60 }, { name: 'Oreo Cookies', qty: 5 }, { name: 'Chocolate Syrup', qty: 20 }],
  'KitKat': [{ name: 'Milk', qty: 180 }, { name: 'Vanilla Ice Cream', qty: 60 }, { name: 'KitKat', qty: 2 }, { name: 'Chocolate Syrup', qty: 15 }],
  'Chocolate': [{ name: 'Milk', qty: 180 }, { name: 'Vanilla Ice Cream', qty: 60 }, { name: 'Chocolate Syrup', qty: 40 }],
  'Vanilla': [{ name: 'Milk', qty: 180 }, { name: 'Vanilla Ice Cream', qty: 80 }, { name: 'Sugar', qty: 10 }],
  'Butterscotch': [{ name: 'Milk', qty: 180 }, { name: 'Vanilla Ice Cream', qty: 60 }, { name: 'Butterscotch Syrup', qty: 30 }],
  'Strawberry': [{ name: 'Milk', qty: 180 }, { name: 'Vanilla Ice Cream', qty: 60 }, { name: 'Strawberry Syrup', qty: 30 }],
  'Blueberry': [{ name: 'Milk', qty: 180 }, { name: 'Vanilla Ice Cream', qty: 60 }, { name: 'Blueberry Crush', qty: 30 }],
  'Brownie': [{ name: 'Milk', qty: 180 }, { name: 'Vanilla Ice Cream', qty: 60 }, { name: 'Brownie', qty: 50 }, { name: 'Chocolate Syrup', qty: 20 }],
  'Oreo KitKat': [{ name: 'Milk', qty: 180 }, { name: 'Vanilla Ice Cream', qty: 60 }, { name: 'Oreo Cookies', qty: 3 }, { name: 'KitKat', qty: 1 }, { name: 'Chocolate Syrup', qty: 20 }],

  // 4. Cold Coffee
  'Classic Cold Coffee': [{ name: 'Milk', qty: 180 }, { name: 'Coffee Powder', qty: 3 }, { name: 'Sugar', qty: 20 }],
  'Chocolate Cold Coffee': [{ name: 'Milk', qty: 180 }, { name: 'Coffee Powder', qty: 3 }, { name: 'Chocolate Syrup', qty: 30 }, { name: 'Sugar', qty: 10 }],
  'Oreo Cold Coffee': [{ name: 'Milk', qty: 180 }, { name: 'Coffee Powder', qty: 2 }, { name: 'Oreo Cookies', qty: 3 }, { name: 'Chocolate Syrup', qty: 20 }],
  'Add On: Ice Cream': [{ name: 'Vanilla Ice Cream', qty: 40 }],

  // 5. Lassi
  'Masala Lassi': [{ name: 'Curd/Yogurt', qty: 200 }, { name: 'Chat Masala', qty: 5 }, { name: 'Mint Leaves', qty: 2 }],
  'Khua Lassi': [{ name: 'Curd/Yogurt', qty: 180 }, { name: 'Khua', qty: 30 }, { name: 'Sugar', qty: 25 }],
  'Punjabi Lassi': [{ name: 'Curd/Yogurt', qty: 220 }, { name: 'Sugar', qty: 30 }],
  'Mango Lassi': [{ name: 'Curd/Yogurt', qty: 150 }, { name: 'Mango Pulp', qty: 60 }, { name: 'Sugar', qty: 15 }],
  'Strawberry Lassi': [{ name: 'Curd/Yogurt', qty: 150 }, { name: 'Strawberry Pulp', qty: 60 }, { name: 'Sugar', qty: 15 }],
  'Dry Fruit Lassi': [{ name: 'Curd/Yogurt', qty: 180 }, { name: 'Mixed Dry Fruits', qty: 25 }, { name: 'Sugar', qty: 20 }],

  // 6. Mocktails
  'Blue Lagoon': [{ name: 'Soda', qty: 200 }, { name: 'Blue Curacao Syrup', qty: 30 }, { name: 'Lemon Juice', qty: 10 }],
  'Virgin Mojito': [{ name: 'Soda', qty: 200 }, { name: 'Mint Mojito Syrup', qty: 30 }, { name: 'Mint Leaves', qty: 5 }, { name: 'Lemon Juice', qty: 15 }],
  'Peach Iced Tea': [{ name: 'Soda', qty: 200 }, { name: 'Peach Syrup', qty: 30 }, { name: 'Lemon Juice', qty: 5 }],
  'Watermelon Mojito': [{ name: 'Soda', qty: 150 }, { name: 'Watermelon', qty: 80 }, { name: 'Mint Leaves', qty: 5 }, { name: 'Lemon Juice', qty: 10 }],
  'Strawberry Mojito': [{ name: 'Soda', qty: 200 }, { name: 'Strawberry Syrup', qty: 30 }, { name: 'Mint Leaves', qty: 5 }, { name: 'Lemon Juice', qty: 10 }],
};

export async function seedInventoryAndRecipes() {
  console.log("Starting seed script...");
  
  // 1. Insert Raw Materials (avoiding duplicates by name)
  const existingInv = await db.inventory.toArray();
  const nameToInvId = {};
  
  for (let raw of rawMaterials) {
    let existing = existingInv.find(i => i.name.toLowerCase() === raw.name.toLowerCase());
    if (existing) {
      nameToInvId[raw.name] = existing.id;
      // Update fields if missing
      await db.inventory.update(existing.id, { 
        category: raw.category,
        baseUnit: raw.baseUnit,
        purchaseUnit: raw.purchaseUnit,
        conversionFactor: raw.conversionFactor,
        costPerBaseUnit: raw.costPerBaseUnit,
        minStock: raw.minStock
      });
    } else {
      const newId = await db.inventory.add({
        ...raw,
        currentStock: 0,
        unit: raw.baseUnit, // legacy
        active: true,
        createdAt: new Date().toISOString()
      });
      nameToInvId[raw.name] = newId;
    }
  }
  
  console.log("Raw materials seeded.");

  // 2. Attach Recipes to existing Menu Items
  const existingItems = await db.items.toArray();
  const existingRecipes = await db.recipes.toArray();
  
  for (const [menuName, ingredientsList] of Object.entries(menuRecipes)) {
    // Find item
    const item = existingItems.find(i => i.name.toLowerCase() === menuName.toLowerCase());
    if (!item) {
      console.warn(`Menu item not found: ${menuName}. Skipping recipe.`);
      continue;
    }
    
    // Resolve ingredient IDs
    const resolvedIngredients = [];
    for (let ing of ingredientsList) {
      const invId = nameToInvId[ing.name];
      if (!invId) {
        console.error(`Could not resolve raw material: ${ing.name} for recipe ${menuName}`);
        continue;
      }
      resolvedIngredients.push({
        inventoryId: invId,
        qty: ing.qty
      });
    }
    
    // Check if recipe exists
    const existingRec = existingRecipes.find(r => String(r.itemId) === String(item.id));
    if (existingRec) {
      await db.recipes.update(existingRec.id, { ingredients: resolvedIngredients });
    } else {
      await db.recipes.add({
        itemId: item.id,
        ingredients: resolvedIngredients,
        createdAt: new Date().toISOString()
      });
    }
  }
  
  console.log("Recipes seeded successfully!");
  alert("Recipes seeded successfully!");
}
