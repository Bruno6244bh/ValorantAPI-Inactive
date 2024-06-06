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

//--------------------------------------------------Funções para cálculo de rating--------------------------------------------------

let ArrayData = []
let arraySqrtData = []

function quadrado(numero) {
    return numero * numero;
}

//Essa função realiza o cálculo de Desvio padrão

function getStd() {

    const sum = ArrayData.reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
    }, 0);
    

    let media = sum / ArrayData.length

    console.log("Data average:", media);

    for(let i = 0; i < ArrayData.length; i++) {
        arraySqrtData[i] = ArrayData[i] - media
        arraySqrtData[i] = quadrado(arraySqrtData[i])
    }

    const sum2 = arraySqrtData.reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
    }, 0);

    let somao = sum2/arraySqrtData.length

    //console.log("A soma dos quadrados da diferença entre cada item e a média é:", somao)
    console.log("Standard deviation:", Math.sqrt(somao))
    console.log("-------------------------------------------")



    ArrayData = []
    arraySqrtData = []
}

//Essa função pega os dados da table e coloca no array pra executar o cáculo

export async function getStdData () {

    for(let i = 0; i < 8; i++) {
        switch (i) {
            case (0):
                try {
                    const db = await openDb();
                    const combat = await db.all('SELECT acs FROM Stats');
            
                    if (combat.length > 0) {
                        combat.forEach(linkObj => {
                            ArrayData.push(linkObj.acs)
                        });
                    } else {
                        console.log('No data found in the stats table.');
                    }
                } catch (error) {
                    console.error('Error fetching links:', error);
                }
                //console.log(ArrayData.length, "itens found in database")
                console.log("Calculating ACS standard deviation")
            
                getStd()
                break;
            case (1):
                try {
                    const db = await openDb();
                    const combat = await db.all('SELECT kills FROM Stats');
            
                    if (combat.length > 0) {
                        combat.forEach(linkObj => {
                            ArrayData.push(linkObj.kills)
                        });
                    } else {
                        console.log('No data found in the stats table.');
                    }
                } catch (error) {
                    console.error('Error fetching links:', error);
                }
                //console.log(ArrayData.length, "itens found in database")
                console.log("Calculating Kills standard deviation")
            
                getStd()
                break;
            case (2):
                try {
                    const db = await openDb();
                    const combat = await db.all('SELECT deaths FROM Stats');
            
                    if (combat.length > 0) {
                        combat.forEach(linkObj => {
                            ArrayData.push(linkObj.deaths)
                        });
                    } else {
                        console.log('No data found in the stats table.');
                    }
                } catch (error) {
                    console.error('Error fetching links:', error);
                }
                //console.log(ArrayData.length, "itens found in database")
                console.log("Calculating deaths standard deviation")
            
                getStd()
                break;
            case (3):
                try {
                    const db = await openDb();
                    const combat = await db.all('SELECT assists FROM Stats');
            
                    if (combat.length > 0) {
                        combat.forEach(linkObj => {
                            ArrayData.push(linkObj.assists)
                        });
                    } else {
                        console.log('No data found in the stats table.');
                    }
                } catch (error) {
                    console.error('Error fetching links:', error);
                }
                //console.log(ArrayData.length, "itens found in database")
                console.log("Calculating assists standard deviation")
            
                getStd()
                break;
            case (4):
                try {
                    const db = await openDb();
                    const combat = await db.all('SELECT adr FROM Stats');
            
                    if (combat.length > 0) {
                        combat.forEach(linkObj => {
                            ArrayData.push(linkObj.adr)
                        });
                    } else {
                        console.log('No data found in the stats table.');
                    }
                } catch (error) {
                    console.error('Error fetching links:', error);
                }
                //console.log(ArrayData.length, "itens found in database")
                console.log("Calculating adr standard deviation")
            
                getStd()
                break;
            case (5):
                try {
                    const db = await openDb();
                    const combat = await db.all('SELECT hs FROM Stats');
            
                    if (combat.length > 0) {
                        combat.forEach(linkObj => {
                            ArrayData.push(linkObj.hs)
                        });
                    } else {
                        console.log('No data found in the stats table.');
                    }
                } catch (error) {
                    console.error('Error fetching links:', error);
                }
                //console.log(ArrayData.length, "itens found in database")
                console.log("Calculating hs standard deviation")
            
                getStd()
                break;
            case (6):
                try {
                    const db = await openDb();
                    const combat = await db.all('SELECT fk FROM Stats');
            
                    if (combat.length > 0) {
                        combat.forEach(linkObj => {
                            ArrayData.push(linkObj.fk)
                        });
                    } else {
                        console.log('No data found in the stats table.');
                    }
                } catch (error) {
                    console.error('Error fetching links:', error);
                }
                //console.log(ArrayData.length, "itens found in database")
                console.log("Calculating first kills standard deviation")
            
                getStd()
                break;
            case (7):
                try {
                    const db = await openDb();
                    const combat = await db.all('SELECT fd FROM Stats');
            
                    if (combat.length > 0) {
                        combat.forEach(linkObj => {
                            ArrayData.push(linkObj.fd)
                        });
                    } else {
                        console.log('No data found in the stats table.');
                    }
                } catch (error) {
                    console.error('Error fetching links:', error);
                }
                //console.log(ArrayData.length, "itens found in database")
                console.log("Calculating first deaths standard deviation")
            
                getStd()
                break;
        }
    }



    // try {
    //     const db = await openDb();
    //     const combat = await db.all('SELECT kills FROM Stats');

    //     if (combat.length > 0) {
    //         combat.forEach(linkObj => {
    //             ArrayData.push(linkObj.kills)
    //         });
    //     } else {
    //         console.log('No acs found in the stats table.');
    //     }
    // } catch (error) {
    //     console.error('Error fetching links:', error);
    // }
    // console.log(ArrayData.length, "acs stats found in database")
    // console.log("Base ACS", ArrayData)

    // getStd()

}

