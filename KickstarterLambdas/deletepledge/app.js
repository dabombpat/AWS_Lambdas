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
    
    let getpledgesupporters = (projectname,reward) => {
        return new Promise((resolve,reject) => {
            pool.query("Select * from pledgesupporters WHERE projectname = ? AND reward = ? ", [projectname,reward], (error, rows) => {
                if(error) {return reject("cant get pledge supporters");}
                else {
                    return resolve(rows);
                }
            });
        })}
    let deletepledge = (projectname,reward) => {
        return new Promise((resolve,reject) => {
            pool.query("Delete from pledges where projectname = ? and reward = ? ", [projectname,reward], (error, rows) => {
                if(error) {return reject("cant delete page");}
                else {
                    return resolve(rows);
                }
            });
        })}

    let returnfunds = (susername,amount) => {
        return new Promise((resolve,reject) => {
            pool.query("Update funds set funds= funds + ? where username = ? ", [amount, susername], (error, rows) => {
                if(error) {return reject("cant return funds");}
                if((rows && rows.length == 1)){
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        })}
    let deletefrompledgesupporters = (reward) => {
        return new Promise((resolve,reject) => {
            pool.query("Delete from pledgesupporters where reward = ? ", [reward], (error, rows) => {
                if(error) {return reject("cant delete from pledgesupporters");}
                else {
                    return resolve(true);
                }
            });
        })}
    let removefunds = (username,projectname,amount) => {
        return new Promise((resolve,reject) => {
            pool.query("Update Projects set funds = funds - ? where username = ? and name= ? ", [amount,username,projectname], (error, rows) => {
                if(error) {return reject("cant remove funds");}
                if((rows && rows.length == 1)){
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        })}
        //info needs projectname, reward, amount, dev username
    try {
        const supporters = await getpledgesupporters(info.projectname, info.reward);
        if(supporters.length > 0) {
            let numsupporters=supporters.length;
           // console.log(numsupporters*info.amount);
            const deleted= await deletefrompledgesupporters(info.reward);
            if(deleted){
                response.statusCode=200;
                const removed = await removefunds(info.username, info.projectname,(info.amount*numsupporters))
                if(removed){
                    response.statusCode=200;
                for(let i=0; i< numsupporters; i++){
                const returned = await returnfunds(supporters[i].supporterusername, info.amount);
                if(returned){
                    response.statusCode=200;
                }
                else{
                    response.statusCode=400;
                    response.error="unable to return funds";
                    break;
                }
            } 
            if(response.statusCode==200){
                const pdeleted=await deletepledge(info.projectname,info.reward);
                  if(pdeleted){
                    response.statusCode=200
                    response.body ="deleted pledge";
                }
                else{
                    response.statusCode=400;
                    response.error="unable to delete pledge";
                }
            }
            
                }
                else{response.statusCode=400;
                    response.error="unable to remove funds";
                }
            }
            else{
                response.statusCode = 400;
                response.error = "unable delete pledgesupporters";
            }
        } else {
                const pdeleted=await deletepledge(info.projectname,info.reward);
                  if(pdeleted){
                    response.statusCode=200
                    response.body ="deleted pledge";
                }
                else{
                    response.statusCode=400;
                    response.error="unable to delete pledge";
                }
        }
        
    } catch (error) {
        response.statusCode = 400;
        response.error = error;
    }
    console.log(response);
    return response;
}


//insert into pledgesupporters (projectname,reward,supporterusername) values ('hello: the game', 'Meet Jack!','Luigi');