import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

// you would have to import / invoke this in another file
export async function openDb () {
  return open({
    filename: './database.db',
    driver: sqlite3.Database,
    timeout: 5000,
  })

  db.run('PRAGMA busy_timeout = 10000'); // Definindo o tempo limite como 10 segundos (10000 ms)

  return db;
}

