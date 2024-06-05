import { openDb } from '../configDB.js'

export async function createStatsTable() {
    openDb().then(db=> {
        db.exec('CREATE TABLE IF NOT EXISTS Stats (id INTEGER PRIMARY KEY, match_id INTEGER, date TEXT, event TEXT, phase TEXT, player TEXT, rating REAL, acs INTEGER, acs_rating REAL, kills INTEGER, kills_rating REAL, deaths INTEGER, deaths_rating REAL, assists INTEGER, assists_rating REAL, adr INTEGER, adr_rating REAL, hs INTEGER, hs_rating REAL, fk INTEGER, fk_rating REAL, fd INTEGER, fd_rating REAL, FOREIGN KEY (player) REFERENCES Players(nickname))')
        console.log("Tabela stats criada com sucesso!")
    })
}

// export async function deleteStatsTable () {
//     openDb().then(db=> {
//         db.exec('DROP TABLE IF EXISTS Stats')
//         console.log("Tabela stats apagada com sucesso!")
//     })
// }

let isInserting = false;
const insertionQueue = [];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processQueue() {
    while (insertionQueue.length > 0) {
        const stats = insertionQueue.shift();
        try {
            const db = await openDb();

            const existingStats = await db.get('SELECT * FROM Stats WHERE match_id = ? AND player = ?', [stats.match_id, stats.player]);

            if (!existingStats) {
                await db.run('INSERT INTO Stats (match_id, date, event, phase, player, acs, kills, deaths, assists, adr, hs, fk, fd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [stats.match_id, stats.date, stats.event, stats.phase, stats.player, stats.acs, stats.kills, stats.deaths, stats.assists, stats.adr, stats.hs, stats.fk, stats.fd]);
                console.log('New stats successfully inserted: match', stats.match_id, 'from', stats.player);
                await delay(2000);
            } else {
                // Lógica para lidar com stats existentes, se necessário
            }

        } catch (error) {
            console.error('Error inserting data:', error);
        }
    }
    isInserting = false;
}

export async function insertStats(statsArray) {

    for (const stats of statsArray) { // Alterado para declarar 'stats' com 'const'

        insertionQueue.push(stats);

        if (!isInserting) {
            isInserting = true;
            processQueue().catch(error => {
                console.error('Error processing queue:', error);
                isInserting = false;
            });
        }
    }
}
