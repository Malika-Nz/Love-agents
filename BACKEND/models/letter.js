const db = require('./config.js');

class Letter {
    static async getAll() {
        return db.any('SELECT * FROM letter');
    }

    static async getAllByUser(id) {
        return db.any('SELECT * FROM letter WHERE sender = $1 OR recipient = $1', id);
    }

    static async getOne(id) {
        return db.oneOrNone('SELECT * FROM letter WHERE sender = $1 OR recipient = $1', id);
    }

    static async create(data) {
        const { sender, recipient, body, place, address, meet_date, meet_time, status } = data;

        return db.one(
            'INSERT INTO letter (sender, recipient, body, place, address, meet_date, meet_time, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *',
            [sender, recipient, body, place, address, meet_date, meet_time, status]
        );
    }
}

module.exports = Letter;