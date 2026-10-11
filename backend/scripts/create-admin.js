// Creates the first School Administrator account. A fresh database (loaded
// from educheck_schema.sql) has no users, and every other account is made by
// an Administrator in User Management, so this is the bootstrap step.
//
//   npm run create-admin -- <username> <email> <password>
//
// The password follows the same rule as the app: 8+ characters, with at
// least one letter and one number.

const path = require("path");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const [username, email, password] = process.argv.slice(2);

if (!username || !email || !password) {
    console.error("Usage: npm run create-admin -- <username> <email> <password>");
    process.exit(1);
}

if (!PASSWORD_RULE.test(password)) {
    console.error("Password must be at least 8 characters and include a letter and a number.");
    process.exit(1);
}

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

(async () => {
    try {
        const existing = await pool.query(
            "SELECT 1 FROM users WHERE username = $1 OR email = $2",
            [username, email]
        );

        if (existing.rows.length > 0) {
            console.error("A user with that username or email already exists.");
            process.exitCode = 1;
            return;
        }

        await pool.query(
            "INSERT INTO users (username, email, password_hash, role, status) VALUES ($1, $2, $3, 'admin', 'Active')",
            [username, email, await bcrypt.hash(password, 10)]
        );

        console.log(`Administrator "${username}" created. Log in and set up the rest in the web app.`);
    } catch (error) {
        console.error("Could not create the Administrator:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
})();
