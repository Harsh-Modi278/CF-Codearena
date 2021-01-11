// fetch
const fetch = require('node-fetch');
const preHandle = "https://codeforces.com/api/user.info?handles=";
const endpointUserStats = "https://codeforces.com/api/user.status?handle=";
const endPointProblems = "https://codeforces.com/api/problemset.problems";
const pre = "https://codeforces.com/contest/";
const Room= require("../models/Rooms");



function getRandomInt(max) 
{
  return Math.floor(Math.random() * Math.floor(max));
}

async function giveRatingOfUser(handle) {
    let response;
    try{
        response = await fetch(preHandle+handle);
    } catch(err) {
        console.error(`Error in fetching rating of ${handle}`,err);
    }
    let jsonResponse = await response.json();
    const rating = jsonResponse.result[0].rating;
    console.log({rating});
    return rating;
}

async function fetchProblems(name,arr){
    let response;
    try{
        response = await fetch(endpointUserStats+String(name));
        // console.log("response:",response);
    } catch(err)
    {
        // console.log("error:",err);
        return false;
    }
    // if(response)
    let temp = await response.json();
    // let temp = response;
    // console.log("hi");
    let obj = {};
    temp.result.forEach( (it)=>{   
            obj = {};
            obj.link = pre + it.contestId + "/" + it.problem.index;
            obj.name = it.problem.name;
            obj.verdict = it.verdict;
            obj.tags = it.problem.tags;
            obj.rating = it.problem.rating;
            obj.date = it.creationTimeSeconds;
            // console.log(typeof obj.rating);
            if (obj.verdict === "OK" && typeof obj.rating === typeof Number(1) ) {
                arr.add(obj.link);
            }
        }
    );
    return true;         
}

// Functions to fetch problem not solved by both user
async function giveProblemNotSolvedByBoth(handles)
{
    let firstUserProblems = new Set();
    let secondUserProblems = new Set();
    await fetchProblems(handles[0], firstUserProblems);
    await fetchProblems(handles[1], secondUserProblems);
    console.log("here");
    let response = await fetch(endPointProblems);
    console.log("here1");
    let jsonResponse = await response.json();
    console.log("here2");
    // console.log(jsonResponse.result.problems);

    const rating1 = Number(await giveRatingOfUser(handles[0]));
    const rating2 = Number(await giveRatingOfUser(handles[1]));

    const problemsNotSolved = Array.from(jsonResponse.result.problems).filter((currProblem)=>{
        const link = pre + currProblem.contestId + "/" + currProblem.index;
        if(!firstUserProblems.has(link) && !secondUserProblems.has(link) && currProblem.rating <= 100 + Math.max(rating1, rating2)
        && currProblem.rating >= Math.min(rating1, rating2) - 100) {
            return true;
        }
    });
    // console.log(problemsNotSolved);
    const indx = getRandomInt(problemsNotSolved.length);
    // console.log(indx);
    return problemsNotSolved[indx];
}


function timer(minutes, roomName, eventName)
{
    
    console.log({minutes, eventName});

    const seconds = minutes*60;
    const now = Date.now();
    const finish = now + seconds*1000;

    // display time once
    io.in(roomName).emit(eventName,seconds);

    // looping starts
    Room.findOne({roomName: roomName})
        .then(room =>{
            roomTimer[roomName] = {};
            const fun = setInterval(function(){
                const secondsLeft = Math.round((finish-Date.now())/1000);
                //console.log({secondsLeft});
                if (secondsLeft<0) {
                    // console.log("this: ", this);
                    io.in(roomName).emit(`time-up-${eventName}`);
                    Room.findOne({roomName: roomName})
                        .then(room => {
                            // console.log("this1: ", this);
                            clearInterval(this);
                        })
                        .catch((err) => console.error("hereee:",err));

                    return;
                }
                // display time
                io.in(roomName).emit(eventName,secondsLeft);
            },1000);
            roomTimer[roomName].timer = fun;
            // console.log({fun});
            
        })
        .catch((err) => console.log(err));
}


module.exports ={timer,giveProblemNotSolvedByBoth}