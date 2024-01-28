const db = require("./config.js");

class Review {
  static async getAllByUser(id) {
    return db.any("SELECT * FROM review WHERE author = $1", id);
  }

  static async getAllByLetter(id) {
    return db.any("SELECT * FROM review WHERE letter = $1", id);
  }

  static async create(data) {
    const { author, letter, status, comment } = data;

    return db.one(
      "INSERT INTO review (author, letter, status, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [author, letter, status, comment]
    );
  }

  static async notExistsByUser(id) {
    return db.any(
      `select * from letter
      where status = 'G'
        and (sender = $1 or recipient = $1)
        and now() > meet_date
        and not id in (select letter from review where author = $1)`,
      id
    );
  }
}

module.exports = Review;
