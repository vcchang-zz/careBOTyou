var restify = require('restify');
var builder = require('botbuilder');
var https = require('https');
var rp = require('request-promise');

var MICROSOFT_APP_ID = '2b72e45a-84b0-4f50-8615-e80cdcb7068c';
var MICROSOFT_APP_PASSWORD = 'oqwrIM3244!@pckKXBJM8?]';

var header = {'Content-Type':'application/json', 'Ocp-Apim-Subscription-Key':'300e68bffa5449dfb895b55982140de7'}
var requestUrl = 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';

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

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded && message.membersAdded.length > 0) {
        // Say hello
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello! How is your day so far?");
        bot.send(reply);
    } else if (message.membersRemoved) {
        // See if bot was removed
        var botId = message.address.bot.id;
        for (var i = 0; i < message.membersRemoved.length; i++) {
            if (message.membersRemoved[i].id === botId) {
                // Say goodbye
                var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                bot.send(reply);
                break;
            }
        }
    }
});

bot.dialog('/', function(session) {
        sendGetSentimentRequest(session.message.text).then(function (parsedBody) {
            console.log(parsedBody);
            var sentimentValue = parsedBody.documents[0].score;

            if(parsedBody.documents[0].score < 0.1) {
              session.beginDialog("/crisis");
            }
        })
        .catch(function (err) {
            console.log("POST FAILED: " + err);
        });
  });

  bot.dialog("/crisis", [
  	function(session) {
  		var question = "";
  		if(session.message.text.includes("suicidal")) {
  			question = "Could you do me a favour and call this helpline: 1-833-456-4566?";
  		} else if(session.message.text.includes("sad")) {
  			question = "Could you do me a favour and text a friend.";
  		} else if(session.message.text.includes("depressed")) {
  			question = "Could you do me a favour and set up an appointment with a professional.";
  		}
  		builder.Prompts.text(session, question);
  	},

  	function(session, results) {
  		session.send("Thank you. Remember that you are important, strong and you can get through this. This is just a temporary feeling! You can get through this.");
  		session.endDialog();
  	}
  ]);




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
