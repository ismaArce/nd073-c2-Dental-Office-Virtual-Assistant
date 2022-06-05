// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

const { QnAMaker } = require('botbuilder-ai');
const DentistScheduler = require('./dentistscheduler');
const IntentRecognizer = require("./intentrecognizer")

class DentaBot extends ActivityHandler {
    constructor(configuration, qnaOptions) {
        // call the parent constructor
        super();
        if (!configuration) throw new Error('[QnaMakerBot]: Missing parameter. configuration is required');

        // create a QnAMaker connector
        this.QnAMaker = new QnAMaker(configuration.QnAConfiguration, qnaOptions)
       
        // create a DentistScheduler connector
        this.dentistScheduler = new DentistScheduler(configuration.SchedulerConfiguration)
        // create a IntentRecognizer connector
        this.intentRecognizer = new IntentRecognizer(configuration.LuisConfiguration);

        this.onMessage(async (context, next) => {
            // send user input to QnA Maker and collect the response in a variable
            // don't forget to use the 'await' keyword
            const qnaResults = await this.QnAMaker.getAnswers(context);
            // send user input to IntentRecognizer and collect the response in a variable
            const LuisResult = await this.intentRecognizer.executeLuisQuery(context);
            // don't forget 'await'
                     
            // determine which service to respond with based on the results from LUIS //

            // if(top intent is intentA and confidence greater than 50){
            //  doSomething();
            //  await context.sendActivity();
            //  await next();
            //  return;
            // }
            // else {...}
            
            // console.log(getAvailable);

            if (LuisResult.luisResult.prediction.topIntent === "GetAvailability" &&
            LuisResult.intents.GetAvailability.score > 0.6 &&
            LuisResult.entities.$instance){
                var datetime = [];
                // var getDateTimeOfAvailability = "";
                // if (LuisResult.entities.$instance.date && LuisResult.entities.$instance.date[0]){
                //     datetime.push(LuisResult.entities.$instance.date[0].text);
                // }
                if (LuisResult.entities.$instance.time && LuisResult.entities.$instance.time[0]){
                    datetime.push(LuisResult.entities.$instance.time[0].text);
                }
                
                const getAvailable = await this.dentistScheduler.getAvailability();

                // if (datetime.length > 1){
                //     getDateTimeOfAvailability = "Yes. The dentist will be available on " 
                // + datetime[0] + " at " + datetime[1] + ".";
                // }else{
                //     getDateTimeOfAvailability = "Yes. The dentist will be available on/at " 
                // + datetime[0] + ".";
                // }
                
                // console.log(getDateTimeOfAvailability);
                await context.sendActivity(getAvailable);
                await next();
                return;
            }


            if (LuisResult.luisResult.prediction.topIntent === "ScheduleAppointment" &&
            LuisResult.intents.ScheduleAppointment.score > 0.6 &&
            LuisResult.entities.$instance){
                var datetime = [];
                // var getDateTimeOfAppointment = "";
                // if (LuisResult.entities.$instance.date && LuisResult.entities.$instance.date[0]){
                //     datetime.push(LuisResult.entities.$instance.date[0].text);
                // }
                if (LuisResult.entities.$instance.time && LuisResult.entities.$instance.time[0]){
                    datetime.push(LuisResult.entities.$instance.time[0].text);
                }

                // if (datetime.length > 1){
                //     getDateTimeOfAppointment = "You can schedule your appointment on " 
                // + datetime[0] + " at " + datetime[1] + ".";
                // }else{
                //     getDateTimeOfAppointment = "You can schedule your appointment on/at " 
                // + datetime[0] + ".";
                // }
                
                // console.log(getDateTimeOfAppointment);
                var time = LuisResult.entities.$instance.time[0].text;
                const scheduleAppointment = await this.dentistScheduler.scheduleAppointment(time);
                await context.sendActivity(scheduleAppointment);
                await next();
                return;
            }

            


            if (qnaResults[0]) {
                // console.log(qnaResults[0])
                await context.sendActivity(`${qnaResults[0].answer}`);
             }
             else {
                 // If no answers were returned from QnA Maker, reply with help.
                 await context.sendActivity(`I'm not sure I found an answer to your question'
                 You can ask me questions about electric vehicles like "how can I charge my car?"`);
              }
            await next();
    });

        this.onMembersAdded(async (context, next) => {
        const membersAdded = context.activity.membersAdded;
        //write a custom greeting
        const welcomeText = 'Hello and welcome!';
        for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
            if (membersAdded[cnt].id !== context.activity.recipient.id) {
                await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
            }
        }
        // by calling next() you ensure that the next BotHandler is run.
        await next();
    });
    }
}

module.exports.DentaBot = DentaBot;
