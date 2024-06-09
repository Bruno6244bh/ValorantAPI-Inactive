import { openDb } from '../configDB.js'

export async function createStatsTable() {
    openDb().then(db=> {
        db.exec('CREATE TABLE IF NOT EXISTS vctMastersShanghai (id INTEGER PRIMARY KEY, match_id INTEGER, date TEXT, event TEXT, phase TEXT, player TEXT, opponent TEXT, rating REAL, acs INTEGER, acs_rating REAL, kills INTEGER, kills_rating REAL, deaths INTEGER, deaths_rating REAL, assists INTEGER, assists_rating REAL, adr INTEGER, adr_rating REAL, hs INTEGER, hs_rating REAL, fk INTEGER, fk_rating REAL, fd INTEGER, fd_rating REAL, kpr REAL, kpr_rating REAL, dpr REAL, dpr_rating REAL, apr REAL, apr_rating REAL, fkpr REAL, fkpr_rating REAL, fdpr REAL, fdpr_rating REAL, srv REAL, srv_rating REAL, FOREIGN KEY (player) REFERENCES Players(nickname), FOREIGN KEY (opponent) REFERENCES Teams(name))')
        console.log("Tabela vctMastersShanghai criada com sucesso!")
    })
}

export async function deleteStatsTable () {
    openDb().then(db=> {
        db.exec('DROP TABLE IF EXISTS vctMastersShanghai')
        console.log("Tabela vctMastersShanghai apagada com sucesso!")
    })
}

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

            const existingStats = await db.get('SELECT * FROM vctMastersShanghai WHERE match_id = ? AND player = ?', [stats.match_id, stats.player]);

            if (!existingStats) {
                await db.run('INSERT INTO vctMastersShanghai (match_id, date, event, phase, player, opponent, acs, kills, deaths, assists, adr, hs, fk, fd, kpr, dpr, apr, fkpr, fdpr, srv) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [stats.match_id, stats.date, stats.event, stats.phase, stats.player, stats.opponent, stats.acs, stats.kills, stats.deaths, stats.assists, stats.adr, stats.hs, stats.fk, stats.fd, stats.kpr, stats.dpr, stats.apr, stats.fkpr, stats.fdpr, stats.srv]);
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
let normalizedData = []
let ArrayData = [];
let arraySqrtData = [];
let arrayResult = []

let nomezinho

function quadrado(numero) {
    return numero * numero;
}



let acsArray = [];
let killsArray = [];
let deathsArray = [];
let assistsArray = [];
let adrArray = [];
let hsArray = [];
let fkArray = [];
let fdArray = [];
let kprArray = [];
let dprArray = [];
let aprArray = [];
let fkprArray = [];
let fdprArray = [];
let srvArray = [];


function insertArrayData () {
    switch (nomezinho) {
        case 'acs':
            acsArray = arrayResult.slice();
            console.log("Gravado em acsArray");
            break;
        case 'kills':
            killsArray = arrayResult.slice();
            console.log("Gravado em killsArray");
            break;
        case 'deaths':
            deathsArray = arrayResult.slice();
            console.log("Gravado em deathsArray");
            break;
        case 'assists':
            assistsArray = arrayResult.slice();
            console.log("Gravado em assistsArray");
            break;
        case 'adr':
            adrArray = arrayResult.slice();
            console.log("Gravado em adrArray");
            break;
        case 'hs':
            hsArray = arrayResult.slice();
            console.log("Gravado em hsArray");
            break;
        case 'fk':
            fkArray = arrayResult.slice();
            console.log("Gravado em fkArray");
            break;
        case 'fd':
            fdArray = arrayResult.slice();
            console.log("Gravado em fdArray");
            break;
        case 'kpr':
            kprArray = arrayResult.slice();
            console.log("Gravado em kprArray");
            break;
        case 'dpr':
            dprArray = arrayResult.slice();
            console.log("Gravado em dprArray");
            break;
        case 'apr':
            aprArray = arrayResult.slice();
            console.log("Gravado em aprArray");
            break;
        case 'fkpr':
            fkprArray = arrayResult.slice();
            console.log("Gravado em fkprArray");
            break;
        case 'fdpr':
            fdprArray = arrayResult.slice();
            console.log("Gravado em fdprArray");
            break;
        case 'srv':
            srvArray = arrayResult.slice();
            console.log("Gravado em srvArray");
            break;
        default:
            console.log("Opção inválida. Por favor, escolha um dos casos válidos.");
    }
}


async function objectToInsert () {
    for (let i = 0; i<acsArray.length; i++) {

        let updateId = i+1

        const ratings = {
            acs: acsArray[i],
            kills: killsArray[i],
            deaths: deathsArray[i],
            assists: assistsArray[i],
            adr: adrArray[i],
            hs: hsArray[i],
            fk: fkArray[i],
            fd: fdArray[i],
            kpr: kprArray[i],
            dpr: dprArray[i],
            apr: aprArray[i],
            fkpr: fkprArray[i],
            fdpr: fdprArray[i],
            srv: srvArray[i]
        };

        try {
            const db = await openDb();
        
            const consultaSQL = `
            UPDATE vctMastersShanghai
            SET 
                acs_rating = ?,
                kills_rating = ?,
                deaths_rating = ?,
                assists_rating = ?,
                adr_rating = ?,
                hs_rating = ?,
                fk_rating = ?,
                fd_rating = ?,
                kpr_rating = ?,
                dpr_rating = ?,
                apr_rating = ?,
                fkpr_rating = ?,
                fdpr_rating = ?,
                srv_rating = ?
            WHERE 
                id = ?
        `;
        
        const valores = [
            ratings.acs,
            ratings.kills,
            ratings.deaths,
            ratings.assists,
            ratings.adr,
            ratings.hs,
            ratings.fk,
            ratings.fd,
            ratings.kpr,
            ratings.dpr,
            ratings.apr,
            ratings.fkpr,
            ratings.fdpr,
            ratings.srv,
            updateId
        ];
        const verify = await db.get('SELECT * FROM vctMastersShanghai WHERE id = ? AND acs_rating = ?', [updateId, ratings.acs]);
        if (!verify) {
            await db.run(consultaSQL, valores);
            console.log(`ratings ${updateId} inserted!`)
            await delay(2000);
        }else {
            console.log(`ratings ${updateId} already exists!`)
            await delay(200);
        }

        } catch (error) {
            console.error('Error inserting data:', error);
        }

    }
}

//Função para Normalização do rating

async function Normalizate (array) {

let min = Math.min(...array);
let max = Math.max(...array);

let a = 0; // Limite inferior do novo intervalo
let b = 2;   // Limite superior do novo intervalo

normalizedData = array.map(x => a + ((x - min) * (b - a)) / (max - min));

//console.log(normalizedData);

// Verificar média aproximada
let sum = normalizedData.reduce((acc, val) => acc + val, 0);
let avg = sum / normalizedData.length;

console.log("Média normalizada:", avg);
}



// Função para realizar o cálculo de desvio padrão e rating

async function getStd(currentArray) {
    
    const sum = ArrayData.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    let avg = sum / ArrayData.length;

    console.log("Data average:", avg);

    for (let i = 0; i < ArrayData.length; i++) {
        arraySqrtData[i] = quadrado(ArrayData[i] - avg);
    }

    const sum2 = arraySqrtData.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    let std = Math.sqrt(sum2 / arraySqrtData.length);

    for (let i = 0; i < ArrayData.length; i++) {
        let standardScore = ((ArrayData[i] - avg) / std)
        arrayResult[i] = standardScore;
    }

    console.log("Standard deviation:", std);
    await Normalizate(arrayResult)
    arrayResult = normalizedData.map(value => parseFloat(value.toFixed(3)));


    insertArrayData()

    ArrayData = [];
    arraySqrtData = [];
}

// Função para selecionar os dados para o cálculo de desvio padrão e rating
export async function getStdData() {
    const columns = [
        { name: 'acs', log: 'Calculating ACS standard deviation',},
        { name: 'kills', log: 'Calculating Kills standard deviation',},
        { name: 'deaths', log: 'Calculating deaths standard deviation',},
        { name: 'assists', log: 'Calculating assists standard deviation',},
        { name: 'adr', log: 'Calculating adr standard deviation'},
        { name: 'hs', log: 'Calculating hs standard deviation'},
        { name: 'fk', log: 'Calculating first kills standard deviation'},
        { name: 'fd', log: 'Calculating first deaths standard deviation'},
        { name: 'kpr', log: 'Calculating kpr standard deviation'},
        { name: 'dpr', log: 'Calculating dpr standard deviation'},
        { name: 'apr', log: 'Calculating apr standard deviation'},
        { name: 'fkpr', log: 'Calculating fkpr standard deviation'},
        { name: 'fdpr', log: 'Calculating fdpr standard deviation'},
        { name: 'srv', log: 'Calculating srv standard deviation'}
    ];

    try {
        const db = await openDb();

        for (let i = 0; i < columns.length; i++) {
            const { name, log} = columns[i];
            nomezinho = columns[i].name
            const stat = await db.all(`SELECT ${name} FROM vctMastersShanghai`);

            if (stat.length > 0) {
                stat.forEach(linkObj => {
                    ArrayData.push(linkObj[name]);
                });
            } else {
                console.log(`No data found in the vctMastersShanghai table for ${name}.`);
            }

            console.log(log);
            await getStd();
        }
    } catch (error) {
        console.error('Error fetching links:', error);
    }
    objectToInsert()
}



  







