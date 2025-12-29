/**
 * Global teardown for Playwright tests
 * Runs once after all tests
 */

async function globalTeardown() {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  // Cleanup tasks can go here
  // - Database cleanup
  // - File cleanup
  // - Service shutdown
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;