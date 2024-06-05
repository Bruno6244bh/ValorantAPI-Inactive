import {openDb} from '../configDB.js';

export async function createTeamsTable() {
    openDb().then(db=>{
        db.exec('CREATE TABLE IF NOT EXISTS Teams (id INTEGER PRIMARY KEY, name TEXT, region TEXT, link TEXT) ')
    })
}

let isInserting = false;
const insertionQueue = [];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function insertTeam(team) {
    insertionQueue.push(team);

    if (!isInserting) {
        processQueue();
    }
}

async function processQueue() {
    isInserting = true;

    while (insertionQueue.length > 0) {
        const team = insertionQueue.shift();
        try {
            const db = await openDb();

            const existingTeam = await db.get('SELECT * FROM Teams WHERE name = ? OR link = ?', [team.name, team.link]);

            if (!existingTeam) {
                await db.run('INSERT INTO Teams (name, region, link) VALUES (?, ?, ?)', [team.name, team.region, team.link]);
                console.log('New team successfully inserted:', team.name);
                await delay(2000);
            } else {
            }

        } catch (error) {
            console.error('Error inserting data:', error);
        }
    }

    isInserting = false;
}


export async function deleteAllTeams(Teams) {
    openDb().then(db=>{
        db.run('DELETE FROM Teams; DELETE FROM sqlite_sequence WHERE name=\'Teams\';');
        console.log('All data has been deleted from the table, and the sequence has been reset.');
    })
}

export async function deleteOldTeamsTeams(array) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const names = array.map(obj => `'${obj.name}'`).join(',');
        db.run(`DELETE FROM Teams WHERE name NOT IN (${names})`, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export async function getAllTeams(array) {
    try {
        const db = await openDb();
        const teamName = await db.all('SELECT name FROM Teams');

        if (teamName.length > 0) {
            teamName.forEach(linkObj => {
                 array.push(linkObj.name)
            });
        } else {
            console.log('No names found in the Teams table.');
        }
    } catch (error) {
        console.error('Error fetching links:', error);
    }
    console.log(array.length, "teams found in database")
    //console.log(array)
}




export async function getAllLinks(array) {
    try {
        const db = await openDb();
        const links = await db.all('SELECT link FROM Teams');

        if (links.length > 0) {
            links.forEach(linkObj => {
                 array.push(linkObj.link)
            });
        } else {
            console.log('No links found in the Teams table.');
        }
    } catch (error) {
        console.error('Error fetching links:', error);
    }
}

export async function deleteTeam(array) {
    if (array.length > 0) {
        const db = await openDb();
        for (let i = 0; i < array.length; i++) {
            try {
                await db.run('DELETE FROM Teams WHERE name = ?', array[i]);
                console.log(`Team ${array[i]} has been excluded successfully`);
            } catch (error) {
                console.error(`Failed to delete Team ${array[i]}:`, error);
            }
        }
    } else {
        console.log("No teams to exclude!");
    }
}
