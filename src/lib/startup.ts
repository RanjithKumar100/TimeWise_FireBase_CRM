import { cronService } from './cron-service';

let isInitialized = false;

export function initializeServices() {
  if (isInitialized) {
    return;
  }

  try {
    console.log('🚀 Initializing application services...');
    
    // Initialize cron service for automated notifications
    cronService.initialize();
    
    isInitialized = true;
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
  }
}

// Auto-initialize services when the module is loaded
if (typeof window === 'undefined') { // Only on server side
  initializeServices();
}