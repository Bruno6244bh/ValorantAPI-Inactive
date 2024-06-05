import { openDb } from '../configDB.js'

export async function createPlayersTable() {
    openDb().then(db=> {
        db.exec('CREATE TABLE IF NOT EXISTS Players (id INTEGER PRIMARY KEY, nickname TEXT, name TEXT, link TEXT, team TEXT, FOREIGN KEY (team) REFERENCES Teams(name))')
    })
}
 
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


            const existingPlayer = await db.get('SELECT * FROM Players WHERE nickname = ? OR link = ?', [player.nickname, player.link]);

            if (!existingPlayer) {
                await db.run('INSERT INTO Players (nickname, name, link, team) VALUES (?, ?, ?, ?)', [player.nickname, player.name, player.link, player.team]);
                console.log('New player successfully inserted:', player.nickname, 'to', player.team);
                await delay(2000);
            } else {
            }

        } catch (error) {
            console.error('Error inserting data:', error);
        }
    }
    isInserting = false;
}

export async function insertPlayer(player) {
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

export async function getAllPlayers(array) {
    try {
        const db = await openDb();
        const nick = await db.all('SELECT nickname FROM Players');

        if (nick.length > 0) {
            nick.forEach(linkObj => {
                 array.push(linkObj.nickname)
            });
        } else {
            console.log('No nicknames found in the Teams table.');
        }
    } catch (error) {
        console.error('Error fetching links:', error);
    }
    console.log(array.length, "players found in database")
    //console.log(array)
}

export async function deletePlayer(array) {
    if (array.length > 0) {
        const db = await openDb();
        for (let i = 0; i < array.length; i++) {
            try {
                await db.run('DELETE FROM Players WHERE nickname = ?', array[i]);
                console.log(`Player ${array[i]} has been excluded successfully`);
            } catch (error) {
                console.error(`Failed to delete player ${array[i]}:`, error);
            }
        }
    } else {
        console.log("No players to exclude!");
    }
}