import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if MongoDB connection exists and is ready
    const connectionState = mongoose.connection.readyState;
    
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (connectionState === 1) {
      // Already connected, test with a simple operation with timeout
      try {
        // Test with both ping and a simple collection query to verify actual connectivity
        // Add timeout to detect slow/hanging connections
        const pingPromise = mongoose.connection.db.admin().ping();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database ping timeout')), 5000)
        );
        
        await Promise.race([pingPromise, timeoutPromise]);
        
        // Additional test: try to access a collection (this will fail if DB is truly down)
        const collectionsPromise = mongoose.connection.db.listCollections().toArray();
        const collectionsTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Collections list timeout')), 5000)
        );
        
        const collections = await Promise.race([collectionsPromise, collectionsTimeoutPromise]);
        
        // Test a simple query to a user collection to ensure DB is actually responding
        try {
          const testQuery = await mongoose.connection.db.collection('users').findOne({}, { limit: 1 });
        } catch (queryError) {
          // If query fails, DB might be down even if ping succeeded
          throw new Error('Database query test failed: ' + queryError.message);
        }
        
        return createSuccessResponse('Database connection healthy', {
          status: 'connected',
          readyState: connectionState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          collections: Array.isArray(collections) ? collections.length : 0,
          timestamp: new Date().toISOString()
        });
      } catch (pingError: any) {
        // Force disconnect to clear cached connection
        try {
          await mongoose.connection.close();
        } catch (closeError) {
          console.error('Error closing connection:', closeError);
        }
        
        return createErrorResponse('Database ping failed', 503, {
          status: 'error',
          readyState: connectionState,
          error: pingError.message || 'Ping failed',
          timestamp: new Date().toISOString()
        });
      }
    } else if (connectionState === 2) {
      // Currently connecting
      return createErrorResponse('Database connecting', 503, {
        status: 'connecting',
        readyState: connectionState,
        timestamp: new Date().toISOString()
      });
    } else {
      // Disconnected or disconnecting, try to connect
      try {
        await dbConnect();
        
        // Test connection with ping and collection access with timeout
        const pingPromise = mongoose.connection.db.admin().ping();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database ping timeout')), 5000)
        );
        
        await Promise.race([pingPromise, timeoutPromise]);
        
        const collectionsPromise = mongoose.connection.db.listCollections().toArray();
        const collectionsTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Collections list timeout')), 5000)
        );
        
        const collections = await Promise.race([collectionsPromise, collectionsTimeoutPromise]);
        
        return createSuccessResponse('Database connection established', {
          status: 'connected',
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          collections: Array.isArray(collections) ? collections.length : 0,
          timestamp: new Date().toISOString()
        });
      } catch (connectError: any) {
        return createErrorResponse('Database connection failed', 503, {
          status: 'disconnected',
          readyState: connectionState,
          error: connectError.message || 'Connection failed',
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error: any) {
    return createErrorResponse('Database health check failed', 500, {
      status: 'error',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}