/**
 * Example UserRepository that will be automatically instrumented
 */

import { User } from '../services/UserService.js';

export class UserRepository {
  private users: Map<string, User> = new Map();

  /**
   * Save user - will be automatically instrumented
   */
  async save(user: User): Promise<User> {
    console.log('Saving user to database:', user.id);
    
    await this._validateUser(user);
    await this._persistUser(user);
    
    console.log('User saved successfully');
    return user;
  }

  /**
   * Find user by ID - will be automatically instrumented
   */
  async findById(id: string): Promise<User | null> {
    console.log('Finding user by ID:', id);
    
    await this._simulateDbQuery();
    const user = this.users.get(id) || null;
    
    if (user) {
      console.log('User found:', user.name);
    } else {
      console.log('User not found');
    }
    
    return user;
  }

  /**
   * Find user by email - will be automatically instrumented
   */
  async findByEmail(email: string): Promise<User | null> {
    console.log('Finding user by email:', email);
    
    await this._simulateDbQuery();
    
    for (const user of this.users.values()) {
      if (user.email === email) {
        console.log('User found by email:', user.name);
        return user;
      }
    }
    
    console.log('User not found by email');
    return null;
  }

  /**
   * Delete user - will be automatically instrumented
   */
  async delete(id: string): Promise<void> {
    console.log('Deleting user:', id);
    
    await this._simulateDbQuery();
    
    if (this.users.has(id)) {
      this.users.delete(id);
      console.log('User deleted from database');
    } else {
      throw new Error('User not found for deletion');
    }
  }

  /**
   * Get all users - will be automatically instrumented
   */
  async findAll(): Promise<User[]> {
    console.log('Finding all users');
    
    await this._simulateDbQuery();
    const users = Array.from(this.users.values());
    
    console.log(`Found ${users.length} users`);
    return users;
  }

  /**
   * Private method - will be automatically instrumented
   */
  private async _validateUser(user: User): Promise<void> {
    if (!user.id || !user.name || !user.email) {
      throw new Error('Invalid user data');
    }
  }

  /**
   * Private method - will be automatically instrumented
   */
  private async _persistUser(user: User): Promise<void> {
    // Simulate database write operation
    await this._simulateDbQuery();
    this.users.set(user.id, user);
  }

  /**
   * Private method - will be automatically instrumented
   */
  private async _simulateDbQuery(): Promise<void> {
    // Simulate database latency
    const delay = Math.random() * 100 + 50; // 50-150ms
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
