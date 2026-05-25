import sqlite3 from 'sqlite3';
import { promisify } from 'util';

class Database {
  constructor(path) {
    this.path = path;
    this.db = null;
  }

  initialize() {
    this.db = new sqlite3.Database(this.path, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('Connected to SQLite database');
      }
    });

    // Create tables
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS test_suites (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS test_cases (
          id TEXT PRIMARY KEY,
          suite_id TEXT NOT NULL,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          expected_events TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (suite_id) REFERENCES test_suites(id)
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS test_results (
          id TEXT PRIMARY KEY,
          test_case_id TEXT NOT NULL,
          status TEXT NOT NULL,
          captured_events TEXT,
          errors TEXT,
          run_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          duration_ms INTEGER,
          FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
        )
      `);
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export default Database;
