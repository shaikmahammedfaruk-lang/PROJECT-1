const db = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/bcrypt');

class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const { email, password, name, role = 'student', college, regulation } = userData;

    const passwordHash = await hashPassword(password);

    const [user] = await db('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role,
        college,
        regulation
      })
      .returning(['id', 'email', 'name', 'role', 'college', 'regulation', 'created_at']);

    return user;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const user = await db('users')
      .where({ email })
      .first();

    return user;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const user = await db('users')
      .where({ id })
      .first();

    return user;
  }

  /**
   * Verify user password
   */
  static async verifyPassword(plainPassword, hash) {
    return await comparePassword(plainPassword, hash);
  }

  /**
   * Update user profile (excluding password)
   */
  static async updateProfile(id, updates) {
    const user = await db('users')
      .where({ id })
      .update({
        ...updates,
        updated_at: db.fn.now()
      })
      .returning(['id', 'email', 'name', 'role', 'college', 'regulation', 'updated_at']);

    return user[0];
  }

  /**
   * Update password
   */
  static async updatePassword(id, newPasswordHash) {
    const user = await db('users')
      .where({ id })
      .update({
        password_hash: newPasswordHash,
        updated_at: db.fn.now()
      })
      .returning(['id', 'email', 'name']);

    return user[0];
  }

  /**
   * Get all users (with optional filters)
   */
  static async findAll(filters = {}) {
    const query = db('users').select(
      'id',
      'email',
      'name',
      'role',
      'college',
      'regulation',
      'created_at'
    );

    if (filters.role) {
      query.where({ role: filters.role });
    }
    if (filters.college) {
      query.where({ college: filters.college });
    }
    if (filters.regulation) {
      query.where({ regulation: filters.regulation });
    }
    if (filters.search) {
      query.where(function() {
        this.where('name', 'ilike', `%${filters.search}%`)
          .orWhere('email', 'ilike', `%${filters.search}%`);
      });
    }

    query.orderBy('created_at', 'desc');

    return await query;
  }

  /**
   * Delete user
   */
  static async delete(id) {
    const result = await db('users')
      .where({ id })
      .del();

    return result > 0;
  }

  /**
   * Get statistics for admin dashboard
   */
  static async getStats() {
    const totalStudents = await db('users').where({ role: 'student' }).count('id as count').first();
    const totalAdmins = await db('users').where({ role: 'admin' }).count('id as count').first();
    const todaySignups = await db('users')
      .whereDate('created_at', db.fn.now())
      .count('id as count').first();
    const byRegulation = await db('users')
      .where({ role: 'student' })
      .groupBy('regulation')
      .select('regulation', db.count('id as count'));

    const byCollege = await db('users')
      .where({ role: 'student' })
      .groupBy('college')
      .select('college', db.count('id as count'));

    return {
      totalStudents: parseInt(totalStudents.count) || 0,
      totalAdmins: parseInt(totalAdmins.count) || 0,
      todaySignups: parseInt(todaySignups.count) || 0,
      byRegulation,
      byCollege
    };
  }
}

module.exports = User;