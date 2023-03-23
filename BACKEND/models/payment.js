const db = require('./config.js');

class Payment {
    static async getAll() {
        return db.any('SELECT * FROM payment');
    }

    static async getOne(id) {
        return db.oneOrNone('SELECT * FROM payment WHERE id = $1', id);
    }

    static async create(data) {
        const { amount, user_id, card_number, card_date, card_cvv } = data;

        return db.one(
            'INSERT INTO payment (amount, user_id, card_number, card_date, card_cvv) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [amount, user_id, card_number, card_date, card_cvv]
        );
    }
}

module.exports = Payment;