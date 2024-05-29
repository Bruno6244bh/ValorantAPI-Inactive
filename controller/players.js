import { openDb } from '../configDB.js'

export async function createPlayersTable() {
    openDb().then(db=> {
        db.exec('CREATE TABLE IF NOT EXISTS Players (id INTEGER PRIMARY KEY, nickname TEXT, name TEXT, link TEXT, team TEXT, FOREIGN KEY (team) REFERENCES Teams(name))')
    })
}

// let isInserting = false;
// const insertionQueue = [];

// async function processQueue() {
//     while (insertionQueue.length > 0) {
//         const player = insertionQueue.shift();
//         try {
//             const db = await openDb();

//             const existingPlayer = await db.get('SELECT * FROM Players WHERE nickname = ? OR name = ? OR link = ? OR team = ?', [player.nickname, player.name, player.link, player.team]);

//             if (!existingPlayer) {
//                 await db.run('INSERT INTO Players (nickname, name, link, team) VALUES (?, ?, ?, ?)', [player.nickname, player.name, player.link, player.team]);
//                 console.log('New player successfully inserted:', player.nickname);
//             } else {
//                 console.log('Player already exists:', player.nickname);
//             }

//         } catch (error) {
//             console.error('Error inserting data:', error);
//         }
//     }
//     isInserting = false;
// }

// export async function insertPlayer(player) {
//     insertionQueue.push(player);

//     if (!isInserting) {
//         isInserting = true;
//         processQueue().catch(error => {
//             console.error('Error processing queue:', error);
//             isInserting = false;
//         });
//     }
// }

let isInserting = false;
const insertionQueue = [];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processQueue() {
    while (insertionQueue.length > 0) {
        const player = insertionQueue.shift();
        try {
            const db = await openDb();

            console.log(`Checking player: ${player.nickname}`);

            const existingPlayer = await db.get('SELECT * FROM Players WHERE nickname = ? OR link = ?', [player.nickname, player.link]);

            if (!existingPlayer) {
                await db.run('INSERT INTO Players (nickname, name, link, team) VALUES (?, ?, ?, ?)', [player.nickname, player.name, player.link, player.team]);
                console.log('New player successfully inserted:', player.nickname);
                await delay(2000);
            } else {
                console.log('Player already exists:', player.nickname);
            }

        } catch (error) {
            console.error('Error inserting data:', error);
        }
    }
    isInserting = false;
}

export async function insertPlayer(player) {
    console.log(`Queueing player: ${player.nickname}`);
    insertionQueue.push(player);

    if (!isInserting) {
        isInserting = true;
        processQueue().catch(error => {
            console.error('Error processing queue:', error);
            isInserting = false;
        });
    }
}




export async function deleteAllPlayers(Players) {
    openDb().then(db=>{
        db.run('DELETE FROM Players; DELETE FROM sqlite_sequence WHERE nickname=\'Teams\';');
        console.log('All data has been deleted from the table, and the sequence has been reset.');
    })
}