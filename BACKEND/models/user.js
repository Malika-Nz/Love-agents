const db = require('./config.js');

class User {
  static async getAll() {
    return db.any('SELECT * FROM users');
  }

  static async getOne(email) {
    return db.oneOrNone('SELECT * FROM users WHERE email = $1', email);
  }

  static async getOneById(id) {
    return db.oneOrNone('SELECT * FROM users WHERE id = $1', id);
  }

  static async create(data) {
    const { fio, email, password, about, avatar, telegram, city, gender, gender_cand, birthday } = data;
    return db.one(
      'INSERT INTO users (fio, email, password, about, avatar, telegram, city, gender, gender_cand, birthday) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [fio, email, password, about, avatar, telegram, city, gender, gender_cand, birthday]
    );
  }

  static async update(email, data) {
    // если пришел аватар, то обновляем его
    if (data.avatar) {
      const { avatar } = data;
      db.one(
        'UPDATE users SET avatar = $1 WHERE email = $2 RETURNING *',
        [avatar, email]
      );
    }
    // запишем в БД остальные данные
    const { fio, about, telegram, city } = data;
    return db.one(
      'UPDATE users SET fio = $1, about = $2, telegram = $3, city = $4 WHERE email = $5 RETURNING *',
      [fio, about, telegram, city, email]
    );
  }

  static async updatePassword(email, password) {
    return db.one(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING *',
      [password, email]
    );
  }

  static async delete(email) {
    const result = await db.result('DELETE FROM users WHERE email = $1', email);
    return result.rowCount > 0;
  }
}

module.exports = User;