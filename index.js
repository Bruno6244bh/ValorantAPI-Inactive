//const axios = require('axios');
//const express = require ('express');
//const cheerio = require('cheerio');
import {openDb} from './configDB.js';
import axios from 'axios'
import cheerio from 'cheerio'
import express from 'express'
import { createTable, insertTeam, deleteAll } from './controller/teams.js'
import { Mutex } from 'async-mutex'

const app = express();

createTable();

app.get('/', function(req, res){
    res.send("Hello World!")
})

app.listen(3000, ()=>console.log("Valorant API is running"))


const fetchData = async(url) => {
    const result = await axios.get(url);
    return result.data;
}

//-----------------------------------------------------------------------------------------------------------------

// var americasTeamsLink = [];

// const getTeamsRoster = async () => {
//     const teamsLinkSource = await fetchData("https://www.vlr.gg/event/2004/champions-tour-2024-americas-stage-1/regular-season");
//     const $ = cheerio.load(teamsLinkSource);

//     $('a.event-team-name').each((index, element) => {

//         americasTeamsLink[index] = "https://www.vlr.gg" + $(element).attr('href');
//         //console.log(americasTeamsLink[index])

//     })

//     for(let i = 0; i<= americasTeamsLink.length; i++) {

//         const RostersSource = await fetchData(americasTeamsLink[i]);
//         const $ = cheerio.load(RostersSource);

//         const teamName = $('h1.wf-title').text().trim()
//         console.log(teamName);

//         $('div.team-roster-item-name:not(:has(.team-roster-item-name-role))').each((index, element) => {

//             const playerName = $(element).find('div.team-roster-item-name-alias').text().trim()
//             console.log(playerName);
//         })

//         console.log("-----------------");

//     }
// }

// getTeamsRoster();

//-----------------------------TEAMS UPDATE FUNCTIONS----------------------------------------------
var teamsLink = [];
var teamsName = [];
var teamsRegion = [];

const americasInfo = async () => {
    const teamsList = await fetchData("https://www.vlr.gg/event/2004/champions-tour-2024-americas-stage-1/regular-season");
    const $ = cheerio.load(teamsList);

    $('a.event-team-name').each((index, element) => {
        teamsLink.push("https://www.vlr.gg" + $(element).attr('href'));
        teamsName.push($(element).text().trim());
        teamsRegion.push("Americas");
    });
    await Promise.all(teamsLink.map(async (link) => {
        const teamPath = await fetchData(link);
    }));
    console.log("Americas teams information has been updated successfully");
}

const emeaInfo = async () => {
    const teamsList = await fetchData("https://www.vlr.gg/event/1998/champions-tour-2024-emea-stage-1/regular-season");
    const $ = cheerio.load(teamsList);

    $('a.event-team-name').each((index, element) => {
        teamsLink.push("https://www.vlr.gg" + $(element).attr('href'));
        teamsName.push($(element).text().trim());
        teamsRegion.push("EMEA");
    });
    await Promise.all(teamsLink.map(async (link) => {
        const teamPath = await fetchData(link);
    }));
    console.log("EMEA teams information has been updated successfully");
}

const pacificInfo = async () => {
    const teamsList = await fetchData("https://www.vlr.gg/event/2002/champions-tour-2024-pacific-stage-1/regular-season");
    const $ = cheerio.load(teamsList);

    $('a.event-team-name').each((index, element) => {
        teamsLink.push("https://www.vlr.gg" + $(element).attr('href'));
        teamsName.push($(element).text().trim());
        teamsRegion.push("Pacific");
    });
    await Promise.all(teamsLink.map(async (link) => {
        const teamPath = await fetchData(link);
    }));
    console.log("Pacific teams information has been updated successfully");

}

const chinaInfo = async () => {
    const teamsList = await fetchData("https://www.vlr.gg/event/2006/champions-tour-2024-china-stage-1/regular-season");
    const $ = cheerio.load(teamsList);

    $('a.event-team-name').each((index, element) => {
        teamsLink.push("https://www.vlr.gg" + $(element).attr('href'));
        teamsName.push($(element).text().trim());
        teamsRegion.push("China");
    });
    await Promise.all(teamsLink.map(async (link) => {
        const teamPath = await fetchData(link);
    }));
    console.log("Chinese teams information has been updated successfully");
    
}

  //------------------------------INSERT TEAMS IN DATABASE----------------------


let isWriting = false; // Variável de estado para controlar o acesso ao banco de dados
const writeMutex = new Mutex(); // Mutex para garantir exclusão mútua durante operações de escrita

async function insertTeamsDb() {
    if (isWriting) {
        console.log('Uma operação de escrita já está em andamento. Aguardando...');
        return;
    }

    try {
        const release = await writeMutex.acquire(); // Adquire o bloqueio antes de iniciar a operação de escrita
        isWriting = true; // Marcar que uma operação de escrita está em andamento

        for (let i = 0; i < 44; i++) {
            await insertTeam({
                name: teamsName[i],
                region: teamsRegion[i],
                link: teamsLink[i]
            });
        }

        // Liberar o bloqueio apenas se for adquirido com sucesso
        release();

    } catch (error) {
        console.error('Erro ao inserir equipes no banco de dados:', error);
    } finally {
        isWriting = false; // Resetar a variável de estado após a conclusão da operação de escrita
    }
}

    //------------------------------UPDATE TEAMS----------------------

async function updateTeams() {
    try {
        await americasInfo();
        await emeaInfo();
        await pacificInfo();
        await chinaInfo();
        await console.log(teamsName.length, "Teams updated successfully")
        await insertTeamsDb();
    } catch (error) {
        console.error('Ocorreu um erro:', error);
    }
}

//Uncomment below to run "Update teams function"
//updateTeams();





//--------------------------------------------------UPCOMING MATCHES FUNCTIONS------------------------------------------------------------

const upcMatches = async () => {
    const contentMatches = await fetchData("https://www.vlr.gg/matches");
    const $ = cheerio.load(contentMatches);

    $('a.wf-module-item.match-item.mod-color.mod-left.mod-bg-after-striped_purple').each((index, element) => {

        const matchStatus = $(element).find('.ml-status').text().trim();
        if (matchStatus === "Upcoming") {

            const teams = $(element).find('.match-item-vs-team-name .text-of')
            const team1 = teams.first().text().trim();
            const team2 = teams.last().text().trim();

            //Get match date
            const matchDivParent = $(element).parent();
            const date = matchDivParent.prev().text().trim().replace(/\s+/g, ' ')
            //Get match time
            const time = $(element).find('.match-item-time').text().trim(); 
            //Get tournment infos
            const event = $(element).find('.match-item-event').text().trim().replace(/\s+/g, ' ');
            const splitTournmentName = event.split(/Champions/);
            const tournmentPhase = splitTournmentName[0].trim();
            const eventName = ("Champions" + splitTournmentName[1]).trim();

            //print upcoming matches infos: teams name, date, time and tornment infos
            console.log(`${team1} vs ${team2}`);
            console.log(date);
            console.log(time, "gmt -3");
            console.log(tournmentPhase);
            console.log(eventName);
            console.log('---');
        }
     });
}

//Uncomment below to run "Upcoming Matches function"
//upcMatches();

//--------------------------------------------------LIVE MATCHES FUNCTIONS------------------------------------------------------------

const liveMatches = async () => {
    const contentMatches = await fetchData("https://www.vlr.gg/matches");
    const $ = cheerio.load(contentMatches);

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

                //Print Overall scoreboard
                console.log(liveTeam1, team1score, ":", team2score, liveTeam2);

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
                        }
                
                        map = map.replace(/\d+/g, '').replace(/\s+/g, '').trim();


                        //Print the maps with their respective scores
                        console.log(map, "-", liveScoreTeam1 + ":" + liveScoreTeam2);

                    }
                }

                //Get and print stream link
                const streamLink = $(".match-streams-btn").find("a.match-streams-btn-external").attr('href')
                console.log("Watch on: ", streamLink)

            }
            matchData();
        }
    });
}
//Uncomment below to run "Live Matches function"
liveMatches();

