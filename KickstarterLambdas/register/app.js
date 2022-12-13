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
    
    let InsertDesignerLogin = (username, password,role) => {
        return new Promise((resolve,reject) => {
            pool.query("INSERT INTO Register (username, password,role) VALUES(?,?,?)", [username, password,role], (error, rows) => {
                if(error) {return reject("Invalid Username or Password");}
                if((rows && rows.length == 1)){
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        })}
    let createFunds = (username) => {
        return new Promise((resolve,reject) => {
            pool.query("INSERT INTO funds (username, funds ) VALUES(?,?)", [username,10000], (error, rows) => {
                if(error) {return reject("Unable to create funds");}
                if((rows && rows.length == 1)){
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        })}
        
    try {
        const inserted = await InsertDesignerLogin(info.username, info.password, info.role);
        if(inserted) {
            response.statusCode=  200;
            response.body = "successfully inserted";
        } else {
            response.statusCode = 400;
            response.error = "Invald Username or Password";
        }
        if(info.role=="Supporter"){
            const fundsinserted = await createFunds(info.username);
        if(fundsinserted) {
            response.statusCode=  200;
            response.body = "successfully inserted";
        } else {
            response.statusCode = 400;
            response.error = "Invald fund creation";
        }
        }
        
    } catch (error) {
        response.statusCode = 400;
        response.error = error;
    }
    console.log(response);
    return response;
}
