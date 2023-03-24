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

    static async getOneById(id) {
        return db.oneOrNone('SELECT * FROM letter WHERE id = $1', id);
    }

    static async create(data) {
        const { sender, recipient, body, place, address, meet_date, meet_time, status } = data;

        return db.one(
            'INSERT INTO letter (sender, recipient, body, place, address, meet_date, meet_time, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *',
            [sender, recipient, body, place, address, meet_date, meet_time, status]
        );
    }

    static async update(id, data) {
        const { readed, status } = data;
        console.log(readed, status);

        if (readed === true || readed === false) {
            console.log('readed', readed);
            db.one(
                'UPDATE letter SET readed = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [readed, id]
            );
        }
        if (status) {
            console.log('status', status);
            db.one(
                'UPDATE letter SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [status, id]
            );
        }
    }
}

module.exports = Letter;