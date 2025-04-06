import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Generate a random session secret if one isn't provided
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
  console.log('Session secret available:', !!sessionSecret);

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for username: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false);
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`Password match for ${username}: ${passwordMatch}`);
        
        if (!passwordMatch) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        console.error('Error during authentication:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log(`Serializing user: ${user.id}`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user ID: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`User ID ${id} not found during deserialization`);
      }
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log(`Registration attempt for username: ${req.body.username}`);
      const existingUser = await storage.getUserByUsername(req.body.username);
      
      if (existingUser) {
        console.log(`Username already exists: ${req.body.username}`);
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      console.log(`Created hashed password for ${req.body.username}`);
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      
      console.log(`Created new user with ID: ${user.id}`);

      req.login(user, (err) => {
        if (err) {
          console.error('Error during login after registration:', err);
          return next(err);
        }
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user;
        console.log(`Registration successful for: ${user.username}`);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error('Error during registration:', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: "Invalid username or password" });
      
      req.login(user, (err: any) => {
        if (err) return next(err);
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user as SelectUser;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err: any) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Don't send password back to client
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
}