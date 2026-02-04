import mongoose from 'mongoose';

// Declare the global mongoose variable to persist connection across hot reloads in dev
declare global {
  var mongoose: { conn: any; promise: any } | undefined;
}

// In Next.js, we must access the global scope via globalThis in some contexts, 
// or simply global in Node. Here we align with the declaration above.
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (cached && cached.conn) {
    return cached.conn;
  }

  if (!cached) {
      // Should effectively be unreachable due to initialization above, but for TS safety:
      cached = { conn: null, promise: null };
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    // Fallback URI for build time or if env var is missing
    const uri = MONGODB_URI || 'mongodb://localhost:27017/user_management_system';

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
