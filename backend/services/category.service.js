import Category from "../models/Category.js";

const DEFAULT_CATEGORIES = [
  { name: "Elektronik", slug: "elektronik", icon: "📱", description: "Handys, PCs, Audio und mehr" },
  { name: "Mode", slug: "mode", icon: "👗", description: "Kleidung, Schuhe und Accessoires" },
  { name: "Möbel & Wohnen", slug: "moebel-wohnen", icon: "🛋️", description: "Einrichtung und Dekoration" },
  { name: "Bücher", slug: "buecher", icon: "📚", description: "Bücher, Magazine und Comics" },
  { name: "Sport & Freizeit", slug: "sport-freizeit", icon: "⚽", description: "Sportgeräte und Freizeitartikel" },
  { name: "Kinder & Baby", slug: "kinder-baby", icon: "🧸", description: "Spielzeug, Kinderwagen und Babysachen" },
  { name: "Garten", slug: "garten", icon: "🌱", description: "Gartenmöbel, Pflanzen und Werkzeug" },
  { name: "Auto & Motorrad", slug: "auto-motorrad", icon: "🚗", description: "Ersatzteile und Zubehör" },
  { name: "Hobby & Kunst", slug: "hobby-kunst", icon: "🎨", description: "Instrumente, Basteln und Kunst" },
  { name: "Sonstiges", slug: "sonstiges", icon: "✨", description: "Alles, was nirgends sonst passt" },
];

/** Inserts the ten default German categories once and returns all active ones. */
export async function seedDefaultCategories() {
  const operations = DEFAULT_CATEGORIES.map((category, index) => ({
    updateOne: {
      filter: { slug: category.slug },
      update: {
        $setOnInsert: {
          ...category,
          parent: null,
          isActive: true,
          sortOrder: index + 1,
        },
      },
      upsert: true,
    },
  }));

  if (operations.length) {
    await Category.bulkWrite(operations, { ordered: false });
  }

  return Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
}

export { DEFAULT_CATEGORIES };
export default { seedDefaultCategories, DEFAULT_CATEGORIES };
