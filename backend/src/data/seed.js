/**
 * Seed Script for PageTurner Bookstore
 * Populates MongoDB with 8 realistic bookstore products.
 * Safe to run multiple times: avoids duplicates using upsert.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { connectDB, disconnectDB } = require('../config/db');

const sampleBooks = [
  {
    name: 'The Great Gatsby',
    description: 'F. Scott Fitzgerald’s 1925 classic novel examining jazz-age decadence, idealism, and social upheaval on Long Island.',
    price: 14.99,
    category: 'Fiction',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
    stock: 25
  },
  {
    name: 'To Kill a Mockingbird',
    description: 'Harper Lee’s Pulitzer Prize-winning masterpiece exploring racial injustice and the destruction of innocence in the American South.',
    price: 16.5,
    category: 'Fiction',
    imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
    stock: 30
  },
  {
    name: '1984',
    description: 'George Orwell’s dystopian social science fiction novel that introduced the concepts of Big Brother, doublethink, and the Thought Police.',
    price: 12.99,
    category: 'Sci-Fi',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
    stock: 40
  },
  {
    name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    description: 'Robert C. Martin’s definitive guide on writing readable, maintainable, and robust software code.',
    price: 39.99,
    category: 'Technology',
    imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=600',
    stock: 18
  },
  {
    name: 'Sapiens: A Brief History of Humankind',
    description: 'Yuval Noah Harari explores the evolutionary history and societal developments that shaped Homo sapiens.',
    price: 22.0,
    category: 'Non-Fiction',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
    stock: 22
  },
  {
    name: 'The Silent Patient',
    description: 'Alex Michaelides’s psychological thriller about a woman’s act of violence against her husband—and the therapist obsessed with uncovering her motive.',
    price: 15.25,
    category: 'Mystery',
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600',
    stock: 15
  },
  {
    name: 'Steve Jobs',
    description: 'Walter Isaacson’s exclusive biography chronicling the roller-coaster life and searingly intense personality of Apple co-founder Steve Jobs.',
    price: 28.5,
    category: 'Biography',
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600',
    stock: 12
  },
  {
    name: 'Dune',
    description: 'Frank Herbert’s epic science fiction saga set in the distant future amidst a huge feudal interstellar empire.',
    price: 18.75,
    category: 'Sci-Fi',
    imageUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600',
    stock: 35
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Seeding PageTurner bookstore catalog...');

    for (const book of sampleBooks) {
      // Upsert: update if book name already exists, otherwise insert
      await Product.findOneAndUpdate(
        { name: book.name },
        { $set: book },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const count = await Product.countDocuments();
    console.log(`[Seed] Database successfully seeded! Total products in catalog: ${count}`);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

// Only run immediately if executed directly from CLI (e.g. `npm run seed`)
if (require.main === module) {
  seedDatabase();
}

module.exports = { sampleBooks, seedDatabase };
