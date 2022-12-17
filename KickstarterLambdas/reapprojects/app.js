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
            "Access-Control-Allow-Methods": "GET"
        }
    };
    /*let actual_event = event.body
    let info = JSON.parse(actual_event)*/
    //admin can view everything, no need for info
    
    let getProjects = () => {
        return new Promise((resolve,reject) => {
            pool.query("SELECT * FROM Projects where failed = false and success=false", (error, rows) => {
                if(error) {return reject("Unable to list Projects");}
                else {
                    return resolve(rows);
                }
            });
        })}
    let getPledge = (projectname,reward) => {
        return new Promise((resolve,reject) => {
            pool.query("SELECT * FROM pledges where projectname = ? and reward = ? ", [projectname, reward], (error, rows) => {
                if(error) {return reject("Unable to list Projects");}
                else {
                    return resolve(rows);
                }
            });
        })}
    let failproject = (username,name) => {
        return new Promise((resolve,reject) => {
            pool.query("Update Projects Set failed = true where username = ? and name = ?", [username,name], (error, rows) => {
                if(error) {return reject("cannot fail project");}
                if(rows && rows.length == 1){
                    return resolve(true);
                }
                else {
                    return resolve(true);
                }
            });
        })}
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
    let getpledgesupporters = (projectname) => {
        return new Promise((resolve,reject) => {
            pool.query("Select * from pledgesupporters WHERE projectname = ?", [projectname], (error, rows) => {
                if(error) {return reject("cant get pledge supporters");}
                else {
                    return resolve(rows);
                }
            });
        })}
    let deletefrompledgesupporters = (reward,username) => {
        return new Promise((resolve,reject) => {
            pool.query("Delete from pledgesupporters where reward = ? and supporterusername = ?", [reward,username], (error, rows) => {
                if(error) {return reject("cant delete from pledgesupporters");}
                else {
                    return resolve(true);
                }
            });
        })}
    let getdirectsupport = (projectname) => {
        return new Promise((resolve,reject) => {
            pool.query("Select * from Activity where project = ? and directsupport is not null ", [projectname], (error, rows) => {
                if(error) {return reject("cant return funds");}
                if((rows)){
                    return resolve(rows);
                } else {
                    return resolve(true);
                }
            });
        })}
    let deletefromactivity = (projectname,amount) => {
        return new Promise((resolve,reject) => {
            pool.query("Delete from Activity where project = ? and directsupport = ? ", [projectname,amount], (error, rows) => {
                if(error) {return reject("cant return funds");}
                if((rows)){
                    return resolve(rows);
                } else {
                    return resolve(true);
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
    try {
        const projects = await getProjects();
        const currentdate = new Date();
        for(let i=0; i<projects.length; i++){
        //date MUST BE IN MM/DD/YYYY
        const deadline =  new Date(projects[i].deadline);
        console.log("currentdate: " + currentdate);
        console.log("due date: " + projects[i].deadline);
        if(deadline<currentdate){
            if(projects[i].funds>= projects[i].goal){
             const satisfied = await satisfydeadline(projects[i].username, projects[i].name);
            if(satisfied) {
                response.statusCode=  200;
                response.body = "successfully satisfied deadline" ;
            } else {
                response.statusCode = 400;
            response.error = "unable to satisfy the deadline";
                }
                } else {
                   //project failed
            const failed = await failproject(projects[i].username, projects[i].name);
            if(failed) {
                response.statusCode=  200;
                response.body = "successfully failed project" ;
            } else {
                response.statusCode = 400;
                response.error = "unable to fail project";
            }
            //refunds: pledges
            let supporters = await getpledgesupporters(projects[i].name);
            for(let j=0; j<supporters.length; j++ ){
                const pledge= await getPledge(supporters[j].projectname, supporters[j].reward);
                const refunded = await returnfunds(supporters[j].supporterusername, pledge[0].amount);
                if(refunded) {
                    response.statusCode=  200;
                    response.body = "successfully redunded" ;
                } else {
                    response.statusCode = 400;
                    response.error = "unable to refund";
                }
                const deleted = await deletefrompledgesupporters(supporters[j].reward, supporters[j].supporterusername);
                if(deleted) {
                    response.statusCode=  200;
                    response.body = "successfully deleted pledgesupporter" ;
                } else {
                    response.statusCode = 400;
                    response.error = "unable to delete pledgesupporter";
                }
            }
            let directsupport = await getdirectsupport(projects[i].name);
            for(let j=0; j< directsupport.length; j++){
                const refunded= await returnfunds(directsupport[j].supporter, directsupport[j].directsupport);
                    if(refunded) {
                    response.statusCode=  200;
                    response.body = "successfully redunded" ;
                } else {
                    response.statusCode = 400;
                    response.error = "unable to refund";
                }
                const deleted = await deletefromactivity(directsupport[j].project,directsupport[j].directsupport)
                    if(deleted) {
                    response.statusCode=  200;
                    response.body = "successfully deleted" ;
                } else {
                    response.statusCode = 400;
                    response.error = "unable to delete";
                }
                
            }
            
                }
            }
        }
        
    } catch (error) {
        response.statusCode = 400;
        response.error = error;
    }
    console.log(response);
    return response;
}
