import {
  User,
  InsertUser,
  Weather,
  InsertWeather,
  Crypto,
  InsertCrypto,
  News,
  InsertNews,
  Favorite,
  InsertFavorite,
} from "@shared/schema";

import session from "express-session";

export interface IStorage {
  // User methods (keeping original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Weather methods
  getWeatherByCity(city: string): Promise<Weather | undefined>;
  getWeatherByCities(cities: string[]): Promise<Weather[]>;
  createWeather(weather: InsertWeather): Promise<Weather>;
  updateWeather(city: string, weather: Partial<InsertWeather>): Promise<Weather | undefined>;
  
  // Crypto methods
  getCryptoByCoinId(coinId: string): Promise<Crypto | undefined>;
  getCryptosByCoinIds(coinIds: string[]): Promise<Crypto[]>;
  createCrypto(crypto: InsertCrypto): Promise<Crypto>;
  updateCrypto(coinId: string, crypto: Partial<InsertCrypto>): Promise<Crypto | undefined>;
  
  // News methods
  getNews(limit?: number): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
  
  // Favorites methods
  getFavoritesByUserId(userId: number, type: 'city' | 'crypto'): Promise<Favorite[]>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(userId: number, type: 'city' | 'crypto', itemId: string): Promise<boolean>;
  
  // Session storage
  sessionStore: session.Store;
}

import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private weather: Map<string, Weather>;
  private crypto: Map<string, Crypto>;
  private newsList: News[];
  private favoritesList: Favorite[];
  
  private userCurrentId: number;
  private weatherCurrentId: number;
  private cryptoCurrentId: number;
  private newsCurrentId: number;
  private favoritesCurrentId: number;

  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.weather = new Map();
    this.crypto = new Map();
    this.newsList = [];
    this.favoritesList = [];
    
    this.userCurrentId = 1;
    this.weatherCurrentId = 1;
    this.cryptoCurrentId = 1;
    this.newsCurrentId = 1;
    this.favoritesCurrentId = 1;
    
    // Initialize memory store for sessions with cleanup
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods (keeping original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Weather methods
  async getWeatherByCity(city: string): Promise<Weather | undefined> {
    return this.weather.get(city.toLowerCase());
  }
  
  async getWeatherByCities(cities: string[]): Promise<Weather[]> {
    return cities.map(city => city.toLowerCase())
      .filter(city => this.weather.has(city))
      .map(city => this.weather.get(city)!);
  }
  
  async createWeather(weather: InsertWeather): Promise<Weather> {
    const id = this.weatherCurrentId++;
    const timestamp = weather.timestamp || new Date();
    const newWeather: Weather = { ...weather, id, timestamp };
    this.weather.set(weather.city.toLowerCase(), newWeather);
    return newWeather;
  }
  
  async updateWeather(city: string, weather: Partial<InsertWeather>): Promise<Weather | undefined> {
    const existingWeather = await this.getWeatherByCity(city.toLowerCase());
    
    if (!existingWeather) {
      return undefined;
    }
    
    const updatedWeather: Weather = { ...existingWeather, ...weather };
    this.weather.set(city.toLowerCase(), updatedWeather);
    return updatedWeather;
  }
  
  // Crypto methods
  async getCryptoByCoinId(coinId: string): Promise<Crypto | undefined> {
    return this.crypto.get(coinId.toLowerCase());
  }
  
  async getCryptosByCoinIds(coinIds: string[]): Promise<Crypto[]> {
    return coinIds.map(id => id.toLowerCase())
      .filter(id => this.crypto.has(id))
      .map(id => this.crypto.get(id)!);
  }
  
  async createCrypto(crypto: InsertCrypto): Promise<Crypto> {
    const id = this.cryptoCurrentId++;
    const lastUpdated = crypto.lastUpdated || new Date();
    const newCrypto: Crypto = { ...crypto, id, lastUpdated };
    this.crypto.set(crypto.coinId.toLowerCase(), newCrypto);
    return newCrypto;
  }
  
  async updateCrypto(coinId: string, crypto: Partial<InsertCrypto>): Promise<Crypto | undefined> {
    const existingCrypto = await this.getCryptoByCoinId(coinId.toLowerCase());
    
    if (!existingCrypto) {
      return undefined;
    }
    
    const updatedCrypto: Crypto = { ...existingCrypto, ...crypto };
    this.crypto.set(coinId.toLowerCase(), updatedCrypto);
    return updatedCrypto;
  }
  
  // News methods
  async getNews(limit?: number): Promise<News[]> {
    const sortedNews = [...this.newsList].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    return limit ? sortedNews.slice(0, limit) : sortedNews;
  }
  
  async createNews(news: InsertNews): Promise<News> {
    const id = this.newsCurrentId++;
    const isBreaking = news.isBreaking ?? null;
    const newNews: News = { ...news, id, isBreaking };
    this.newsList.push(newNews);
    return newNews;
  }
  
  // Favorites methods
  async getFavoritesByUserId(userId: number, type: 'city' | 'crypto'): Promise<Favorite[]> {
    return this.favoritesList.filter(
      favorite => favorite.userId === userId && favorite.type === type
    );
  }
  
  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const id = this.favoritesCurrentId++;
    const newFavorite: Favorite = { ...favorite, id };
    this.favoritesList.push(newFavorite);
    return newFavorite;
  }
  
  async deleteFavorite(userId: number, type: 'city' | 'crypto', itemId: string): Promise<boolean> {
    const initialLength = this.favoritesList.length;
    this.favoritesList = this.favoritesList.filter(
      favorite => !(favorite.userId === userId && favorite.type === type && favorite.itemId === itemId)
    );
    return initialLength > this.favoritesList.length;
  }
}

export const storage = new MemStorage();
