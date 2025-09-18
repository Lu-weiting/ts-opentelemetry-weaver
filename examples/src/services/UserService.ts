/**
 * Example UserService that will be automatically instrumented
 * Notice: No OpenTelemetry imports or manual span creation needed!
 */

import { UserRepository } from '../repositories/UserRepository.js';
import { EmailService } from './EmailService.js';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService
  ) {}

  /**
   * Public method - will be automatically instrumented
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    console.log('Creating user:', userData.name);

    // Validate user data
    await this._validateUserData(userData);

    // Create user
    const user: User = {
      id: this._generateUserId(),
      name: userData.name,
      email: userData.email,
      createdAt: new Date(),
    };

    // Save to repository
    const savedUser = await this.userRepository.save(user);

    // Send welcome email
    await this._sendWelcomeEmail(savedUser);

    console.log('User created successfully:', savedUser.id);
    return savedUser;
  }

  /**
   * Public method - will be automatically instrumented
   */
  async getUserById(id: string): Promise<User | null> {
    console.log('Fetching user by ID:', id);

    if (!id) {
      throw new Error('User ID is required');
    }

    const user = await this.userRepository.findById(id);
    
    if (user) {
      await this._logUserAccess(user);
    }

    return user;
  }

  /**
   * Public method with error - will be automatically instrumented with error tracking
   */
  async deleteUser(id: string): Promise<void> {
    console.log('Deleting user:', id);

    const user = await this.getUserById(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    await this.userRepository.delete(id);
    await this._sendFarewellEmail(user);

    console.log('User deleted successfully:', id);
  }

  /**
   * Private method - will be automatically instrumented if instrumentPrivateMethods=true
   */
  private async _validateUserData(userData: Omit<User, 'id' | 'createdAt'>): Promise<void> {
    if (!userData.name || userData.name.trim().length === 0) {
      throw new Error('User name is required');
    }

    if (!userData.email || !this._isValidEmail(userData.email)) {
      throw new Error('Valid email is required');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }
  }

  /**
   * Private utility method - will be automatically instrumented
   */
  private _isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Private method - will be automatically instrumented
   */
  private _generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private method - will be automatically instrumented
   */
  private async _sendWelcomeEmail(user: User): Promise<void> {
    await this.emailService.sendWelcomeEmail(user.email, user.name);
  }

  /**
   * Private method - will be automatically instrumented
   */
  private async _sendFarewellEmail(user: User): Promise<void> {
    await this.emailService.sendFarewellEmail(user.email, user.name);
  }

  /**
   * Private method - will be automatically instrumented
   */
  private async _logUserAccess(user: User): Promise<void> {
    console.log(`User accessed: ${user.name} (${user.email})`);
    // In a real app, this might log to analytics service
  }
}
