import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base user schema (keeping original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Weather schema
export const weather = pgTable("weather", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  temp: integer("temp").notNull(),
  humidity: integer("humidity").notNull(),
  condition: text("condition").notNull(),
  icon: text("icon").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertWeatherSchema = createInsertSchema(weather).omit({
  id: true,
});

export type InsertWeather = z.infer<typeof insertWeatherSchema>;
export type Weather = typeof weather.$inferSelect;

// Crypto schema
export const crypto = pgTable("crypto", {
  id: serial("id").primaryKey(),
  coinId: text("coin_id").notNull().unique(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  price: integer("price").notNull(),
  priceChange24h: integer("price_change_24h").notNull(),
  marketCap: integer("market_cap").notNull(),
  volume24h: integer("volume_24h").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertCryptoSchema = createInsertSchema(crypto).omit({
  id: true,
});

export type InsertCrypto = z.infer<typeof insertCryptoSchema>;
export type Crypto = typeof crypto.$inferSelect;

// News schema
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  source: text("source").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  content: text("content").notNull(),
  isBreaking: boolean("is_breaking").default(false),
});

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
});

export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof news.$inferSelect;

// Favorites schema
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'city' or 'crypto'
  itemId: text("item_id").notNull(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
