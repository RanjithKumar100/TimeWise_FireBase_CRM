import { cronService } from '../services/cron';

// Use global to persist across hot reloads in development
declare global {
  var _servicesInitialized: boolean | undefined;
}

export function initializeServices() {
  // Check global flag that persists across hot reloads
  if (global._servicesInitialized) {
    console.log('ℹ️ Services already initialized, skipping...');
    return;
  }

  try {
    console.log('🚀 Initializing application services...');

    // Initialize cron service for automated notifications
    cronService.initialize();

    global._servicesInitialized = true;
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
  }
}

// Auto-initialize services when the module is loaded
if (typeof window === 'undefined') { // Only on server side
  initializeServices();
}