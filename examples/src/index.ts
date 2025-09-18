/**
 * Example application demonstrating @waiting/ts-otel-weaver
 * 
 * This file shows how the library works with zero code changes needed
 * for instrumentation. All the business logic classes (UserService, 
 * EmailService, UserRepository) will be automatically instrumented.
 */

// Initialize OpenTelemetry first
import './tracing.js';

import { UserService } from './services/UserService.js';
import { EmailService } from './services/EmailService.js';
import { UserRepository } from './repositories/UserRepository.js';

async function main() {
  console.log('🚀 Starting ts-otel-weaver example application');
  console.log('');

  // Create service instances - no special wrapping needed!
  // The TypeScript transformer has already injected tracing code during compilation
  const userRepository = new UserRepository();
  const emailService = new EmailService();
  const userService = new UserService(userRepository, emailService);

  try {
    console.log('=== Example 1: Creating a new user ===');
    const newUser = await userService.createUser({
      name: 'John Doe',
      email: 'john.doe@example.com',
    });
    console.log('✅ User created:', newUser.id);
    console.log('');

    console.log('=== Example 2: Fetching user by ID ===');
    const fetchedUser = await userService.getUserById(newUser.id);
    console.log('✅ User fetched:', fetchedUser?.name);
    console.log('');

    console.log('=== Example 3: Creating another user ===');
    const anotherUser = await userService.createUser({
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
    });
    console.log('✅ Another user created:', anotherUser.id);
    console.log('');

    console.log('=== Example 4: Trying to create user with duplicate email (will fail) ===');
    try {
      await userService.createUser({
        name: 'John Clone',
        email: 'john.doe@example.com', // This email already exists
      });
    } catch (error) {
      console.log('❌ Expected error:', (error as Error).message);
    }
    console.log('');

    console.log('=== Example 5: Fetching all users ===');
    const allUsers = await userRepository.findAll();
    console.log('✅ All users:', allUsers.map(u => u.name).join(', '));
    console.log('');

    console.log('=== Example 6: Deleting a user ===');
    await userService.deleteUser(newUser.id);
    console.log('✅ User deleted successfully');
    console.log('');

    console.log('=== Example 7: Trying to delete non-existent user (will fail) ===');
    try {
      await userService.deleteUser('non-existent-id');
    } catch (error) {
      console.log('❌ Expected error:', (error as Error).message);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('🎉 Example application completed!');
  console.log('');
  console.log('📊 Check the console output above to see the detailed trace spans');
  console.log('🔍 All traces are exported to console for easy demonstration');
  console.log('');
  console.log('You should see spans like:');
  console.log('  - example-app.UserService.createUser');
  console.log('  - example-app.UserService._validateUserData');
  console.log('  - example-app.UserRepository.findByEmail');
  console.log('  - example-app.UserRepository.save');
  console.log('  - example-app.EmailService.sendWelcomeEmail');
  console.log('  - And many more!');
}

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
