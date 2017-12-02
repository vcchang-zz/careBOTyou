var restify = require('restify');
var builder = require('botbuilder');

var MICROSOFT_APP_ID = '2b72e45a-84b0-4f50-8615-e80cdcb7068c';
var MICROSOFT_APP_PASSWORD = 'oqwrIM3244!@pckKXBJM8?]';

var headers = {'Content-Type':'application/json', 'Ocp-Apim-Subscription-Key':'300e68bffa5449dfb895b55982140de7'}
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

bot.dialog('/', function(session) {
  session.send("You said: %s", session.message.text);
});
