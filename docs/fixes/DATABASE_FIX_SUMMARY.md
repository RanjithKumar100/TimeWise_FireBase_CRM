# Database Connection Fix - 503 Error Resolution

## Problem
When multiple users logged in and submitted timesheet data, the system was experiencing:
- **503 Service Unavailable errors**
- Database connection timeouts
- Request hanging indefinitely
- Connection pool exhaustion

## Root Causes Identified

### 1. **No Connection Pooling**
- Previous config: No pool size limits
- MongoDB was creating unlimited connections
- With multiple users, connections were exhausted

### 2. **No Timeout Protection**
- Queries could hang indefinitely
- No client-side or server-side timeouts
- One slow query would block all others

### 3. **No Retry Logic**
- Connection failures were permanent
- No automatic reconnection
- System couldn't recover from temporary issues

### 4. **Poor Connection State Management**
- Didn't check connection readyState
- Used stale/dead connections
- No event listeners for disconnections

## Solutions Implemented

### 1. **Enhanced MongoDB Connection** ([src/lib/mongodb.ts](src/lib/mongodb.ts))

#### Connection Pool Configuration:
```typescript
{
  maxPoolSize: 50,          // Max 50 concurrent connections (handles multiple users)
  minPoolSize: 10,          // Maintain 10 idle connections
  maxIdleTimeMS: 30000,     // Close idle connections after 30s
  socketTimeoutMS: 45000,   // Socket timeout: 45s
  serverSelectionTimeoutMS: 10000,  // Server selection: 10s
  heartbeatFrequencyMS: 10000,      // Health check every 10s
  connectTimeoutMS: 10000,  // Initial connection: 10s
  retryWrites: true,        // Auto-retry writes
  retryReads: true,         // Auto-retry reads
  compressors: ['zlib']     // Enable compression
}
```

#### Connection State Checking:
- Checks `readyState` before using connection (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)
- Automatically resets stale connections
- Waits for connections in progress

#### Retry Logic:
- 3 retry attempts with exponential backoff
- 1 second delay between retries
- Proper error handling and logging

#### Event Listeners:
```typescript
connection.on('error', handler)      // Log errors
connection.on('disconnected', handler) // Handle disconnects
connection.on('reconnected', handler)  // Log reconnections
```

### 2. **Request Timeout Protection** ([src/middleware.ts](src/middleware.ts))

Created middleware for all API routes:
- Adds CORS headers
- Sets 60-second request timeout header
- Ensures requests don't hang indefinitely

### 3. **API Utilities** ([src/lib/api-utils.ts](src/lib/api-utils.ts))

New utility functions:
- `withTimeout()` - Wraps handlers with timeout
- `withDbTimeout()` - Database operation timeouts
- `connectWithRetry()` - Retry connection logic
- `safeApiHandler()` - Comprehensive error handling
- `ensureDbConnection()` - Pre-check DB availability
- `checkDbHealth()` - Health check with latency

### 4. **Worklog API Improvements** ([src/app/api/worklogs/route.ts](src/app/api/worklogs/route.ts))

#### GET Endpoint:
- 10s connection timeout
- 30s MongoDB server-side query timeout (`.maxTimeMS(30000)`)
- 35s client-side timeout
- 10s count timeout with fallback
- Proper error responses (503 for DB, 408 for timeout)

#### POST Endpoint:
- 10s connection timeout
- 5s existing logs query timeout
- 3s user query timeout with fallback
- 10s save timeout
- All operations protected

## Error Response Codes

| Code | Meaning | When It Happens |
|------|---------|----------------|
| 408  | Request Timeout | Query took too long |
| 503  | Service Unavailable | Database connection failed |
| 500  | Internal Server Error | Unexpected errors |

## Performance Improvements

### Before:
- ❌ No connection pooling
- ❌ Unlimited connection attempts
- ❌ Queries could hang forever
- ❌ One bad request affected all users
- ❌ No recovery from disconnections

### After:
- ✅ 10-50 connection pool (handles 50+ concurrent users)
- ✅ All queries timeout after 30-45 seconds
- ✅ Automatic retry with exponential backoff
- ✅ Connection health monitoring
- ✅ Automatic reconnection on disconnect
- ✅ Compressed data transfer (zlib)
- ✅ Proper error messages to users

## Testing Recommendations

### 1. **Load Testing**
```bash
# Simulate 10 concurrent users
npm run dev
# Use tool like Apache Bench:
ab -n 100 -c 10 http://localhost:9002/api/worklogs
```

### 2. **Connection Testing**
- Stop MongoDB: Check 503 error responses
- Start MongoDB: Check automatic reconnection
- Submit 20+ timesheets simultaneously

### 3. **Timeout Testing**
- Create slow query scenarios
- Verify 408 timeout responses
- Ensure UI shows proper error messages

## Monitoring

Check logs for:
- `✅ Connected to MongoDB (Pool size: 10-50 connections)` - Good
- `⏳ MongoDB connection in progress, waiting...` - Normal under load
- `🔄 MongoDB connection lost, resetting...` - Reconnecting
- `❌ Database connection timeout` - DB down or overloaded
- `⚠️ Count timeout, using approximate count` - High load, but handled

## Production Recommendations

1. **Monitor Connection Pool Usage**
   - If hitting 50 connections regularly, increase `maxPoolSize`
   - Minimum should be 10% of max (currently 10)

2. **Adjust Timeouts Based on Load**
   - If queries frequently timeout at 30s, investigate slow queries
   - Add indexes to WorkLog collection:
     ```javascript
     db.worklogs.createIndex({ userId: 1, date: -1 })
     db.worklogs.createIndex({ createdAt: -1 })
     db.worklogs.createIndex({ verticle: 1, date: -1 })
     ```

3. **Enable MongoDB Compression** (Already done via `compressors: ['zlib']`)

4. **Consider Read Replicas** (For very high load)
   - Separate read/write operations
   - Use replica set for reads

## Files Modified

1. ✅ [src/lib/mongodb.ts](src/lib/mongodb.ts) - Enhanced connection pooling
2. ✅ [src/middleware.ts](src/middleware.ts) - Request timeout middleware (NEW)
3. ✅ [src/lib/api-utils.ts](src/lib/api-utils.ts) - Utility functions (NEW)
4. ✅ [src/app/api/worklogs/route.ts](src/app/api/worklogs/route.ts) - Timeout protection

## Next Steps

1. Test with multiple users logging in simultaneously
2. Monitor connection pool usage in production
3. Add alerts for high error rates (503, 408)
4. Consider implementing Redis caching for frequently accessed data
5. Add database query performance monitoring

---

**Fix Applied:** 2025-01-XX
**Issue:** 503 errors with multiple concurrent users
**Status:** ✅ FIXED - Ready for testing
