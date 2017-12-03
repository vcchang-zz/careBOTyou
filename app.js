"use strict";
var restify = require('restify');
var builder = require('botbuilder');
var https = require('https');
var rp = require('request-promise');
var motivation = require("motivation");

var MICROSOFT_APP_ID = '2b72e45a-84b0-4f50-8615-e80cdcb7068c';
var MICROSOFT_APP_PASSWORD = 'oqwrIM3244!@pckKXBJM8?]';

var header = {'Content-Type':'application/json', 'Ocp-Apim-Subscription-Key':'6fb7959510a84e389985fd3343705e6b'}
var requestUrl = 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';
var task;
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: MICROSOFT_APP_ID,
    appPassword: MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
// Listen for messages from users
server.post('/api/messages', connector.listen());

bot.dialog('/', function(session) {
        sendGetSentimentRequest(session.message.text).then(function (parsedBody) {
            console.log(parsedBody);
            var score = parsedBody.documents[0].score.toString()
            if(score > 0.80) {                    // happy
			         session.beginDialog("/happy");
             } else if(score > 0.1) {             // stressed
			         session.beginDialog("/stressed");
             } else {                             // crisis
               session.beginDialog("/crisis");
             }
        })
        .catch(function (err) {
            console.log("POST FAILED: " + err);
        });

  });

bot.dialog("/stressed", [
	//We want to either cheer up the person->tell a joke or something
	function(session) {
		builder.Prompts.text(session, "You sound a bit stressed out, how can I help?");
	},
  function(session, results) {
    switch (stressedCases(session.message.text)) {
      case 1:
        session.send("What do you need to get done?");
        session.replaceDialog("/todo");
        break;
      case 2:
        builder.Prompts.text(session, findAJoke());
        session.endDialog("Hope that cheers you up.")
        break;
      default:
        builder.Prompts.text(session, "Sorry I don't know how to help with that, but I hope this quote will inspire you.");
        session.send(findMotivation());
        // session.send("Your mind will answer most questions if you learn to relax and wait for the answers.  --William S. Burroughs")
    }
	},
  function(session) {
    session.endDialog("I hope that helped:)");
	}
]);

bot.dialog('/todo', [
    function (session) {
        builder.Prompts.text(session, 'Let me know & I will help you schedule a reminder.');
    },
    function (session, results) {
      //setTimeout(startReminders(session.message), 2*60*1000);
      task = `${results.response}`;
      setTimeout(function() { startReminders(session.message); }, 5*1000);
      session.endDialog(`Ok, I will remind you to do *${results.response}* in 30 minutes.`);
    }
]);

// bot.dialog('/reminder', function (session, args, next) {
//     session.endDialog(`Hello, just want to remind you *${task}*`);
// });

bot.dialog('/reminder', [
    function (session) {
        session.send(`Hello, just want to remind you *${task}*`);
        builder.Prompts.choice(session, "Would you like me to remind you again?", "yes|no");
    },
    function (session, results) {
        console.log("LOGGING: " + results.response);
        if (session.message.text == "yes") {
          setTimeout(function() { startReminders(session.message); }, 5*1000);
          session.endDialog(`Ok, I will remind you again in 30 minutes.`);
        } else {
          session.endDialog("OK, hope that helped:)");
        }
    }
]);

function startReminders(msg){
  console.log("SETTING REMINDER");
  bot.beginDialog(msg.address, "/reminder")
}

function stressedCases(message){
  if (message.includes("todo") || message.includes("homework") || message.includes("work")){
    return 1;
  }else if (message.includes("joke") || message.includes("funny") || message.includes("sad")){
    return 2;
  }else {
    return 0;
  }
}

function findMotivation(){
  var m = motivation.get();
  return m;
}

function findAJoke(){
  switch (Math.floor(Math.random() * 4)) {
    case 0:
      return "Why aren’t koalas actual bears? They don’t meet the koalafications."
      break;
    case 1:
      return "You know why you never see elephants hiding up in trees? Because they’re really good at it."
      break;
    case 2:
      return "Two gold fish are in a tank. One looks at the other and says, “You know how to drive this thing?!”"
      break;
    default:
      return "How does NASA organize a party? They planet."
      break;
  }
}
function sendGetSentimentRequest(message) {
    var options = {
        method: 'POST',
        uri: requestUrl,
        body: {
            documents:[{id:'1', language: 'en', text:message}]
        },
        json: true, // Automatically stringifies the body to JSON,
        headers: header
    };
    return rp(options);

}
