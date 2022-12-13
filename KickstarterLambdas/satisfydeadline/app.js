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
    
    let satisfydeadline = (username,name) => {
        return new Promise((resolve,reject) => {
            pool.query("Update Projects Set success = true where username = ? and name = ?", [username,name], (error, rows) => {
                if(error) {return reject("cannot satisfy deadline");}
                if(rows && rows.length == 1){
                    return resolve(true);
                }
                else {
                    return resolve(true);
                }
            });
        })}
    try {
        const currentdate = new Date();
        console.log("currentdate" , currentdate);
        //date MUST BE IN MM/DD/YYYY, time is automatically set to midnight on that day
        const deadline =  new Date(info.deadline);
        console.log("deadline", deadline);
        if(info.funds>=info.goal && currentdate<=deadline){
            const launched = await satisfydeadline(info.username, info.name);
            if(launched) {
                response.statusCode=  200;
                response.body = "successfully satisfied deadline" ;
            } else {
                response.statusCode = 400;
            response.error = "unable to satisfy the deadline";
            }
        }
        else{
            response.body="deadline not satisfied";
        }
    } catch (error) {
        response.statusCode = 400;
        response.error = error;
    }
    console.log(response);
    return response;
}
