// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;
const mysql = require('mysql');

var config = require('./config.json');
var pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});


function query(conx, sql, params){
    return new Promise((resolve, reject) => {
        conx.query(sql, params, function(err, rows){
            if(err){
                reject(err);
            }else{
                resolve(rows);
            }
        });
    });
}
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    
   let response = { 
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST"
        }
    };
    let actual_event = event.body
    let info = JSON.parse(actual_event)
    
     let addsupportertopledges = (projectname, reward) => {
        return new Promise((resolve,reject) => {
            pool.query("UPDATE pledges SET currentsupporters = currentsupporters + 1 WHERE projectname=? AND reward = ?", [projectname, reward], (error, rows) => {
                if(error) {return reject("Unable to update");}
                if((rows && rows.length == 1)){
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        })}
    let removefunds = (username,amount) => {
        return new Promise((resolve,reject) => {
            pool.query("UPDATE funds SET funds = funds- ? WHERE username = ?", [amount,username], (error, rows) => {
                if(error) {return reject("Unable to remove funds");}
                if((rows && rows.length == 1)){
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        })}
      let addtoactivity = (project,supporter,claimedpledge) => {
        return new Promise((resolve,reject) => {
            pool.query("INSERT INTO Activity (project,supporter,claimedpledge) VALUES(?,?,?)", [project,supporter,claimedpledge], (error, rows) => {
                if(error) {return reject("Unable to insert activity");}
                if((rows && rows.length == 1)){
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        })}
     let addprojectfunds = (projectname,amount) => {
        return new Promise((resolve,reject) => {
            pool.query("UPDATE Projects SET funds=funds+? WHERE name = ?", [amount,projectname], (error, rows) => {
                if(error) {return reject("Unable to insert addprojectfunds");}
                if((rows && rows.length == 1)){
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        })}   
      let addtopledgesupporters = (projectname,reward,username) => {
        return new Promise((resolve,reject) => {
            pool.query("INSERT INTO pledgesupporters (projectname,reward,supporterusername) VALUES(?,?,?)", [projectname,reward,username], (error, rows) => {
                if(error) {return reject("Unable to add supporter");}
                if((rows && rows.length == 1)){
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        })}   
        
        //info needed: username,project name, pledge reward, pledge amount, pledge maxsupporters, pledge current supporters
    try {
        console.log(info.username + info.projectname+info.amount+info.reward);
            const incrementedsupporters=await addsupportertopledges(info.projectname, info.reward);
            if(incrementedsupporters){
                response.statusCode=200;
                response.body = "successfully incremented pledgesupporters";
                let fundsremoved = await removefunds(info.username, info.amount);
                if(fundsremoved){
                    response.statusCode=200;
                    response.body = "successfully removed funds";
                    let addedtoActivity= await addtoactivity(info.projectname,info.username, info.reward);
                    if(addedtoActivity){
                        response.statusCode=200;
                        response.body="successfully added to activity";
                        let addedfunds = await addprojectfunds(info.projectname, info.amount);
                        if(addedfunds){
                            response.statusCode=200;
                            response.body="successfully added funds";
                            let addedtosupporters = await addtopledgesupporters(info.projectname,info.reward,info.username);
                            if(addedtosupporters){
                                response.statusCode=200;
                                response.body="successfully added to supporters";
                            }
                            else{
                                response.statusCode=400;
                                response.body="unable to add supporter to archive";
                            }
                        }
                        else{
                            response.statusCode=400;
                            response.error= "unable to add funds";
                        }
                    }
                    else{
                        response.statusCode=400;
                        response.error = "unable to add to activity";
                    }
                }
                else{
                    response.statusCode=400;
                    response.error = "unable to remove funds";
                }
            }
            else {
                response.statusCode = 400;
                response.error = "Unable to increment Pledge";
            }
        
    } catch (error) {
        response.statusCode = 400;
        response.error = error;
    }
    console.log(response);
    return response;
}
