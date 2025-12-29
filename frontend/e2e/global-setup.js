/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */

async function globalSetup() {
  console.log('🚀 Starting global setup for E2E tests...');
  
  // Wait for the development server to be ready
  const maxRetries = 30;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch('http://localhost:3001');
      if (response.ok) {
        console.log('✅ Development server is ready');
        break;
      }
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        throw new Error('❌ Development server failed to start');
      }
      console.log(`⏳ Waiting for development server... (${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Additional setup can go here
  // - Database seeding
  // - Authentication setup
  // - Mock service configuration
  
  console.log('✅ Global setup completed');
}

export default globalSetup;