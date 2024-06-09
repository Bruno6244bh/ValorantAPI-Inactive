import {openDb} from './configDB.js';
import axios from 'axios'
import cheerio from 'cheerio'
import express from 'express'
import { createTeamsTable, insertTeam, getAllLinks, getAllTeams, deleteTeam, deleteTeamsTable} from './controller/teams.js'
import { createPlayersTable, insertPlayer, deleteAllPlayers, getAllPlayers, deletePlayer} from './controller/players.js'
import {createStatsTable, insertStats, getStdData, deleteStatsTable,} from './controller/vctMastersShanghai.js'
import { Mutex } from 'async-mutex'


const app = express();


app.get('/', function(req, res){
    res.send("Hello World!")
})

app.listen(3000, ()=>console.log("Valorant API is running"))


const fetchData = async(url) => {
    const result = await axios.get(url);
    return result.data;
}


//--------------------------------------------------UPDATE TEAMS INFO FUNCTION------------------------------------------------------------

let isWriting = false;
const writeMutex = new Mutex();
let teamsArray = []

let databaseTeamsList = []
let updateTeamsList = []

async function updateTeams() {

    if (isWriting) {
        console.log('Uma operação de escrita já está em andamento. Aguardando...');
        return;
    }

    try {
        const release = await writeMutex.acquire();
        isWriting = true;

        const regions = [
            { url: "https://www.vlr.gg/event/2004/champions-tour-2024-americas-stage-1/regular-season", region: "Americas" },
            { url: "https://www.vlr.gg/event/1998/champions-tour-2024-emea-stage-1/regular-season", region: "EMEA" },
            { url: "https://www.vlr.gg/event/2002/champions-tour-2024-pacific-stage-1/regular-season", region: "Pacific" },
            { url: "https://www.vlr.gg/event/2006/champions-tour-2024-china-stage-1/regular-season", region: "China" }
        ];

        for (let region of regions) {
            const teamsList = await fetchData(region.url);
            const $ = cheerio.load(teamsList);

            $('a.event-team-name').each(async (index, element) => {

                let link = $(element).attr('href')
                const regexId = /\/(\d+)\//;
                let teamId = link.match(regexId)
                const regexLinkName = /\/\d+\/([a-zA-Z0-9-]+)/;
                let linkName = link.match(regexLinkName)


                const team = {
                    name: $(element).text().trim(),
                    region: region.region,
                    link: "https://www.vlr.gg" + link,
                    team_id: teamId[1],
                    link_name: linkName[1],
                };
                updateTeamsList.push(team.name)
                teamsArray.push(team);
                await insertTeam(team);
            });
        }

        release();

    } catch (error) {
        console.error('Erro ao inserir equipes no banco de dados:', error);
    } finally {
        isWriting = false; // Resetar a variável de estado após a conclusão da operação de escrita
    }
    console.log(updateTeamsList.length, "Teams found in update")
}

async function excludeTeam(array1, array2) {
    let toExclude = await (async () => {
        return array1.filter(name => !array2.includes(name));
    })();
    await deleteTeam(toExclude);
}


//--------------------------------------------------UPDATE PLAYERS INFO FUNCTION------------------------------------------------------------

let databasePlayerList = []
let updatePlayerList = []

let linksList = []
let playersArray = []

const updatePlayers = async () => {
    await getAllLinks(linksList); 

    let playersCount = 0

    for (const link of linksList) {
        const RostersSource = await fetchData(link);
        if (!RostersSource) continue;

        const $ = cheerio.load(RostersSource);

        $('div.team-roster-item:not(:has(.team-roster-item-name-role))').each(async(index, element) => {
            const player = {
                nickname: $(element).find('div.team-roster-item-name-alias').text().trim(),
                name: $(element).find('div.team-roster-item-name-real').text().trim(),
                link: "https://www.vlr.gg" + $(element).find('a').attr('href'),
                team: $('h1.wf-title').text().trim()
            };
            updatePlayerList.push(player.nickname)
            playersCount++
            playersArray.push(player)
            await insertPlayer(player);
        });

    }
    console.log(updatePlayerList.length, "players found in update")
};

async function excludePlayer(array1, array2) {
    let toExclude = await (async () => {
        return array1.filter(name => !array2.includes(name));
    })();
    await deletePlayer(toExclude);
}




//--------------------------------------------------UPCOMING MATCHES FUNCTION------------------------------------------------------------

const upcMatches = async () => {
    const contentMatches = await fetchData("https://www.vlr.gg/matches");
    const $ = cheerio.load(contentMatches);
    let matchList = [];

    // Selecionar elementos relevantes uma vez
    const matchItems = $('a.wf-module-item.match-item.mod-color.mod-left.mod-bg-after-striped_purple');

    matchItems.each((index, element) => {
        const matchStatus = $(element).find('.ml-status').text().trim();
        if (matchStatus === "Upcoming") {
            const teams = $(element).find('.match-item-vs-team-name .text-of');
            const matchDivParent = $(element).parent();
            const event = $(element).find('.match-item-event').text().trim().replace(/\s+/g, ' ');
            const splitTournmentName = event.split(/Champions/);

            const team1 = teams.first().text().trim();
            const team2 = teams.last().text().trim();
            const date = matchDivParent.prev().text().trim().replace(/\s+/g, ' ');
            const time = $(element).find('.match-item-time').text().trim();
            const tournmentPhase = splitTournmentName[0].trim();
            const eventName = ("Champions" + splitTournmentName[1]).trim();

            const newMatch = {
                team1,
                team2,
                date,
                time,
                tournmentPhase,
                eventName
            };

            matchList.push(newMatch);
        }
    });

    console.log(matchList.slice(0, 5));
}

//upcMatches();


//--------------------------------------------------LIVE MATCHES FUNCTION------------------------------------------------------------

const liveMatches = async () => {
    const contentMatches = await fetchData("https://www.vlr.gg/matches");
    const $ = cheerio.load(contentMatches);

    let liveList = [];

    $('a.wf-module-item.match-item.mod-color.mod-left.mod-bg-after-striped_purple').each((index, element) => {

        //Check which matches are live, look for the status "LIVE" and retrieve the link for each one.
        const matchStatus = $(element).find('.ml-status').text().trim();
        if (matchStatus === "LIVE") {

            const matchLink = "https://www.vlr.gg" + $(element).attr('href');

            //Function that will return the data for each match.
            const matchData = async () => {

                
                const matchPath = await fetchData(matchLink);
                const $ = cheerio.load(matchPath);

                let liveTeam1, liveTeam2, liveScoreTeam1, liveScoreTeam2, map;
                let maps = []
                let overallScore


                //Get teams name
                $('.team-name').each((index, element) => {
                    
                    if (index === 0) {
                        liveTeam1 = $(element).text().trim();
                    } else if (index === 1) {
                        liveTeam2 = $(element).text().trim();
                    }

                });

                //Get overall score
                const scores = $(element).find('.js-spoiler')
                const team1score = scores.first().text().trim();
                const team2score = scores.last().text().trim();

                //Verify if it's a MD3 match or MD5
                const howMuchMaps = $('.vm-stats-game').length

                overallScore = `${liveTeam1} ${team1score} : ${team2score} ${liveTeam2}`

                //Map by map score
                for (let i = 0; i < howMuchMaps; i++) {
                    if (i !== 1) {

                        //Get score by map
                        const liveScoreDiv = $('.vm-stats-game').eq(i);
                        const liveScore = liveScoreDiv.find('.vm-stats-game-header .team .score').text().trim();
                        [liveScoreTeam1, liveScoreTeam2] = liveScore.split(" ");
                        
                        //Get picked maps 
                        switch (i) {
                            case 0:
                                map = $('.vm-stats-gamesnav-item').eq(1).find('div').text().trim();
                                break;
                            case 2:
                                map = $('.vm-stats-gamesnav-item').eq(2).find('div').text().trim();
                                break;
                            case 3:
                                map = $('.vm-stats-gamesnav-item').eq(3).find('div').text().trim();
                                break;
                            case 4:
                                map = $('.vm-stats-gamesnav-item').eq(4).find('div').text().trim();
                                break;
                            case 5:
                                map = $('.vm-stats-gamesnav-item').eq(5).find('div').text().trim();
                                break;
                        }
                
                        map = map.replace(/\d+/g, '').replace(/\s+/g, '').trim();
                        maps.push(map, "-", liveScoreTeam1 + ":" + liveScoreTeam2)

                    }
                }

                //Get stream link
                const streamLink = $(".match-streams-btn").find("a.match-streams-btn-external").attr('href')
                
                const match = {
                    overallScore,
                    maps,
                    streamLink
                }

                liveList.push(match)
                console.log(liveList)

            }
            matchData();
        }
    });
}

//liveMatches();


const Initiator = ['Sova','Breach','Skye','Kayo','Fade','Gekko']
const Duelist = ['Phoenix','Reyna','Jett','Raze','Yoru','Neon','Iso']
const Controller = ['Brimstone','Viper','Omen','Astra','Harbor','Clove']
const Sentinel = ['Sage','Cypher','Killjoy','Chamber','Deadlock']


//-------------------------GET PLAYER STATS FUNCTION-------------------------

const playerStats = []

const extractId = (url) => {
    const regex = /vlr\.gg\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

const getPlayerStats = async ($, matchId) => {
    

    const rawDate = $('div.match-header-date > div.moment-tz-convert:first-child').attr('data-utc-ts')
    const dateRegex = /^(\d{4}-\d{2}-\d{2})/;
    const match = rawDate.match(dateRegex)
    const event = $('.match-header-event > div > div:first-child').text().trim();
    const phase = $('div.match-header-event-series').text().trim()

    let rounds = 0

    let overall1 = parseInt($('span.match-header-vs-score-winner').text().trim())
    let overall2 = parseInt($('span.match-header-vs-score-loser').text().trim())
    
    if(overall1 + overall2 === 3) {
    for (let i = 0; i<6; i++) {
        let score = parseInt($('div.score').eq(i).text().trim())
        rounds = rounds + score
        }
    }else {
        for (let i = 0; i<4; i++) {
            let score = parseInt($('div.score').eq(i).text().trim())
            rounds = rounds + score
            }
    }
    

    $('div.vm-stats-game').eq(1).find('table.wf-table-inset.mod-overview tbody tr').each((index, element) => {

        let opponent

        if(index == 0 || index == 1 || index == 2 || index == 3 || index == 4 ) {
             opponent = $('div.wf-title-med').eq(1).text().trim()
        }else {
             opponent = $('div.wf-title-med').eq(0).text().trim()
        }

        const player = $(element).find('td.mod-player div.text-of').text().trim();
        const hs = $(element).find('td.mod-stat').eq(8).text().trim()
        const kpr = parseInt($(element).find('td.mod-stat').eq(2).text().trim())/rounds
        const dpr = parseInt($(element).find('.mod-vlr-deaths .side.mod-both').text().trim())/rounds
        const apr = parseInt($(element).find('td.mod-stat').eq(4).text().trim())/rounds
        const fkpr = parseInt($(element).find('td.mod-stat').eq(9).text().trim())/rounds
        const fdpr = parseInt($(element).find('td.mod-stat').eq(10).text().trim())/rounds
        const srv = ((rounds - parseInt($(element).find('.mod-vlr-deaths .side.mod-both').text().trim()))*100)/rounds

        const stats = {
            match_id: matchId,
            date: match[1],
            event: event,
            phase: phase.replace(/\n\s*/, ''),
            player: player,
            opponent: opponent,
            acs: $(element).find('td.mod-stat').eq(1).text().trim(),
            kills: $(element).find('td.mod-stat').eq(2).text().trim(),
            deaths: $(element).find('.mod-vlr-deaths .side.mod-both').text().trim(),
            assists: $(element).find('td.mod-stat').eq(4).text().trim(),
            adr: $(element).find('td.mod-stat').eq(7).text().trim(),
            hs: hs.replace('%', ''),
            fk: $(element).find('td.mod-stat').eq(9).text().trim(),
            fd: $(element).find('td.mod-stat').eq(10).text().trim(),
            kpr: kpr,
            dpr: dpr,
            apr: apr,
            fkpr: fkpr,
            fdpr: fdpr,
            srv: srv
        };

        playerStats.push(stats);
        insertStats(playerStats);
        
    });

};

const getMatchUrl = async () => {
    const matches = await fetchData("https://www.vlr.gg/event/matches/1999/champions-tour-2024-masters-shanghai/?series_id=all&group=completed");
    const $ = cheerio.load(matches);

    let links = [];

    $('a.wf-module-item.match-item').each((index, element) => {
        links.push("https://vlr.gg" + $(element).attr('href'));
    });

    links.reverse();

    const allPlayerStats = [];

    for (let link of links) {
        const matchPage = await fetchData(link);
        const $$ = cheerio.load(matchPage);

        const matchId = extractId(link);
        const getFunction = getPlayerStats($$, matchId);

    }

};

//getMatchUrl();


//getStdData()

const update = async () => {
    await updateTeams()
    await getAllTeams (databaseTeamsList)
    await excludeTeam(databaseTeamsList, updateTeamsList)
    await updatePlayers()
    await getAllPlayers(databasePlayerList)
    await excludePlayer(databasePlayerList, updatePlayerList)
    await getMatchUrl();
    await getStdData()
    await console.log("Database updated successfully")
}

//update()










