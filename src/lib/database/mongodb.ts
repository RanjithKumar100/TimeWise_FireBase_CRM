import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Track if event listeners have been attached
let listenersAttached = false;

// Connection retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function dbConnect(): Promise<mongoose.Connection> {
  // Check if connection exists and is ready
  if (cached!.conn && cached!.conn.readyState === 1) {
    return cached!.conn;
  }

  // If connection is connecting, wait for the promise
  if (cached!.conn && cached!.conn.readyState === 2) {
    console.log('⏳ MongoDB connection in progress, waiting...');
    if (cached!.promise) {
      await cached!.promise;
      return cached!.conn!;
    }
  }

  // If connection is disconnected or disconnecting, reset and reconnect
  if (cached!.conn && (cached!.conn.readyState === 0 || cached!.conn.readyState === 3)) {
    console.log('🔄 MongoDB connection lost, resetting...');
    cached!.conn = null;
    cached!.promise = null;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      // Connection pool settings for multiple concurrent users
      maxPoolSize: 50, // Maximum number of connections in the pool (increased for multiple users)
      minPoolSize: 10, // Minimum number of connections to maintain
      maxIdleTimeMS: 300000, // Close connections after 5 minutes of inactivity (increased from 30s)
      socketTimeoutMS: 60000, // Close sockets after 60 seconds of inactivity (increased from 45s)
      serverSelectionTimeoutMS: 30000, // Timeout for server selection (30 seconds - increased from 10s)
      heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
      // Retry settings
      retryWrites: true, // Retry write operations that fail due to network errors
      retryReads: true, // Retry read operations that fail due to network errors
      // Additional settings
      compressors: ['zlib'], // Enable compression for better performance
      connectTimeoutMS: 30000, // Connection timeout (30 seconds - increased from 10s)
    };

    console.log('🔌 Establishing new MongoDB connection...');
    cached!.promise = mongoose.connect(MONGODB_URI!, opts) as any;
  }

  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const mongooseInstance = await cached!.promise;
      if (mongooseInstance && (mongooseInstance as any).connection) {
        cached!.conn = (mongooseInstance as any).connection;

        // Setup connection event listeners ONLY ONCE
        if (!listenersAttached) {
          // Increase max listeners to prevent warnings
          cached!.conn.setMaxListeners(20);

          cached!.conn.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
          });

          cached!.conn.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected. Will reconnect on next request.');
            // Don't reset cached connection here, let dbConnect handle it
          });

          cached!.conn.on('reconnected', () => {
            console.log('✅ MongoDB reconnected successfully');
          });

          listenersAttached = true;
        }

        console.log(`✅ Connected to MongoDB (Pool size: 10-50 connections)`);
        return cached!.conn;
      } else {
        throw new Error('Failed to get mongoose connection');
      }
    } catch (e: any) {
      retries++;
      console.error(`❌ MongoDB connection error (attempt ${retries}/${MAX_RETRIES}):`, e.message);

      if (retries >= MAX_RETRIES) {
        cached!.promise = null;
        cached!.conn = null;
        throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${e.message}`);
      }

      // Wait before retrying
      console.log(`⏳ Retrying connection in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

      // Reset promise for retry
      cached!.promise = null;
    }
  }

  // Should never reach here, but TypeScript needs this
  throw new Error('Failed to establish database connection');
}

// Export connection check function
export async function checkConnection(): Promise<boolean> {
  try {
    if (!cached?.conn) {
      return false;
    }

    // Check connection state
    const state = cached.conn.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    return state === 1;
  } catch (error) {
    console.error('Error checking connection:', error);
    return false;
  }
}

// Export function to get connection stats
export function getConnectionStats() {
  if (!cached?.conn) {
    return null;
  }

  return {
    readyState: cached.conn.readyState,
    readyStateString: ['disconnected', 'connected', 'connecting', 'disconnecting'][cached.conn.readyState],
    host: cached.conn.host,
    name: cached.conn.name,
  };
}

export default dbConnect;