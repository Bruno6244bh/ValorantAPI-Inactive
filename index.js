//const axios = require('axios');
//const express = require ('express');
//const cheerio = require('cheerio');
import {openDb} from './configDB.js';
import axios from 'axios'
import cheerio from 'cheerio'
import express from 'express'
import { createTeamsTable, insertTeam, getAllLinks} from './controller/teams.js'
import { createPlayersTable, insertPlayer, deleteAllPlayers} from './controller/players.js'
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

async function updateTeams() {

    let teamsCount = 0

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
                const team = {
                    name: $(element).text().trim(),
                    region: region.region,
                    link: "https://www.vlr.gg" + $(element).attr('href')
                };
                //console.log(`Listed team ${team.name} from ${team.region}`);
                teamsCount++
                await insertTeam(team);
            });
        }

        release();

    } catch (error) {
        console.error('Erro ao inserir equipes no banco de dados:', error);
    } finally {
        isWriting = false; // Resetar a variável de estado após a conclusão da operação de escrita
    }
    console.log(teamsCount, "teams updated!")
}


//--------------------------------------------------UPDATE PLAYERS INFO FUNCTION------------------------------------------------------------

let linksList = []

const updatePlayers = async () => {
    await getAllLinks(linksList); // Use await para garantir que getAllLinks terminou

    let playersCount = 0
    //console.log(linksList.length);

    for (const link of linksList) {
        const RostersSource = await fetchData(link);
        if (!RostersSource) continue; // Skip this iteration if fetchData failed

        const $ = cheerio.load(RostersSource);

        //const teamName = $('h1.wf-title').text().trim();
        //console.log(teamName);

        $('div.team-roster-item:not(:has(.team-roster-item-name-role))').each(async(index, element) => {
            const player = {
                nickname: $(element).find('div.team-roster-item-name-alias').text().trim(),
                name: $(element).find('div.team-roster-item-name-real').text().trim(),
                link: "https://www.vlr.gg" + $(element).find('a').attr('href'),
                team: $('h1.wf-title').text().trim()
            };
            playersCount++
            await insertPlayer(player);
        });

        //console.log("-----------------");
    }
    console.log(playersCount, "players updated!")
};

// let linksList = []
// let playersList = []

// const updatePlayers = async () => {
//     await getAllLinks(linksList); // Use await para garantir que getAllLinks terminou

//     let playersCount = 0
//     //console.log(linksList.length);

//     for (const link of linksList) {
//         const RostersSource = await fetchData(link);
//         if (!RostersSource) continue; // Skip this iteration if fetchData failed

//         const $ = cheerio.load(RostersSource);

//         //const teamName = $('h1.wf-title').text().trim();
//         //console.log(teamName);

//         $('div.team-roster-item:not(:has(.team-roster-item-name-role))').each(async(index, element) => {
//             const player = {
//                 nickname: $(element).find('div.team-roster-item-name-alias').text().trim(),
//                 name: $(element).find('div.team-roster-item-name-real').text().trim(),
//                 link: "https://www.vlr.gg" + $(element).find('a').attr('href'),
//                 team: $('h1.wf-title').text().trim()
//             };
//             playersCount++
//             await playersList.push(player)
//             //await insertPlayer(player);
//         });

//         //console.log("-----------------");
//     }
//     console.log(playersCount, "players updated!")
//     console.log(playersList.length, "players waiting to be inserted")
    
//     async function insert() {
//         for(let i = 0; i<= playersList.length; i++) {
//             await insertPlayer(playersList[i])
//         }
//     }

//     insert()

// };


const update = async () => {
    await updateTeams()
    await updatePlayers()
}

update()



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

// Uncomment below to run "Upcoming Matches function"
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
