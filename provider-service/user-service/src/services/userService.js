const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

class UserService {
  static async getAllUsers() {
    const users = await User.findAll();
    return users;
  }

  static async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user profile if exists
    const profile = await UserProfile.findByUserId(id);
    return {
      ...user,
      profile,
    };
  }

  static async createUser(userData) {
    const { username, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email) || await User.findByUsername(username);
    if (existingUser) {
      throw new Error('User already exists with this email or username');
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash,
      role: role || 'user',
    });

    return user;
  }

  static async updateUser(id, userData) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if email or username is being changed and already exists
    if (userData.email) {
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser && existingUser.id !== parseInt(id)) {
        throw new Error('Email already exists');
      }
    }

    if (userData.username) {
      const existingUser = await User.findByUsername(userData.username);
      if (existingUser && existingUser.id !== parseInt(id)) {
        throw new Error('Username already exists');
      }
    }

    const updatedUser = await User.update(id, userData);
    return updatedUser;
  }

  static async deleteUser(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await User.delete(id);
    return { success: true };
  }

  static async getUserProfile(userId) {
    const profile = await UserProfile.findByUserId(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }
    return profile;
  }

  static async updateUserProfile(userId, profileData) {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const profile = await UserProfile.upsert(userId, profileData);
    return profile;
  }
}

module.exports = UserService;

