var http = require('http');  //HTTP library
var parseString = require('xml2js').parseString; //Library to convert XML to JSON

var stopId = 15425  //Temporary hardcoded stop ID for testig

//Set up URL
var options = {
  host: 'webservices.nextbus.com',
  path: '/service/publicXMLFeed?command=predictions&a=sf-muni&stopId=' + stopId
};

extractPredictions = function(result) {
	//console.log(str);  //Log response for debug
	
	//Parse the XML result into JSON	
	parseString(str, function (err, result) {
		//var json = JSON.stringify(result);  //View entire JSON for debug
		//cosole.dir(json);
		
		//The Stop
		console.log(result.body.predictions[0].$.stopTitle);
		
		//For each 'prediction' (bus route), pull the data from the next bus
		//and format it like "The 23-Monterey Inbound to the Bayview District will arrive in 27 minutes and 17 seconds"
		var Min = "";
		for (i=0; i < Object.keys(result.body.predictions).length; i++){
			if (result.body.predictions[i].direction[0].prediction[0].$.minutes == 0){
				Min="";
			} else if (result.body.predictions[i].direction[0].prediction[0].$.minutes==1){
				Min="1 minute";
			} else {
				Min = result.body.predictions[i].direction[0].prediction[0].$.minutes + "XXXminutes";
			};
			console.log(Min);
			console.log("The %s %s will arrive in %s and %d seconds",
				result.body.predictions[i].$.routeTitle,
				result.body.predictions[i].direction[0].$.title,
				//Math.floor(result.body.predictions[i].direction[0].prediction[0].$.minutes),
				Min,
				Math.round((result.body.predictions[i].direction[0].prediction[0].$.minutes -
					Math.floor(result.body.predictions[i].direction[0].prediction[0].$.seconds/60)) * 60)
			);
		}
	}
	);

}

//Callback fucntion to process HTTP response
callback = function(response) {
  var str = '';

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });


	
  response.on('end', function () {
	//console.log(str);  //Log response for debug
		
	//Parse the XML result into JSON	
	parseString(str, function (err, result) {
		//var json = JSON.stringify(result);  //View entire JSON for debug
		//console.dir(json);
		
		
		
		//The Stop
		var spokenResponse = result.body.predictions[0].$.stopTitle + ".\r";
		var busPrediction = '';
		var buses=[];

		//For each 'prediction' (bus route), pull the data from the next bus
		//and format it like "The 23-Monterey Inbound to the Bayview District will arrive in 27 minutes and 17 seconds"
		//Append that to an object array with the time in the first key so that it can be sorted:
		// [{time: XXX, Text: YYYY}]
		
	
		
		for (i=0; i < Object.keys(result.body.predictions).length; i++){
		  for (j=0; j < result.body.predictions[i].direction[0].prediction.length; j++){
		  
			var Min = "";
			if (result.body.predictions[i].direction[0].prediction[0].$.minutes == 0){
				Min="";
			} else if (result.body.predictions[i].direction[0].prediction[0].$.minutes==1){
					Min="1 minute";
			} else {
					Min = result.body.predictions[i].direction[0].prediction[0].$.minutes + " minutes";
			};
			console.log(Min);
			console.log("The %s %s will arrive in %s and %d seconds",
				result.body.predictions[i].$.routeTitle,
				result.body.predictions[i].direction[0].$.title,
				//Math.floor(result.body.predictions[i].direction[0].prediction[0].$.minutes),
				Min,
				Math.round((result.body.predictions[i].direction[0].prediction[0].$.minutes -
					Math.floor(result.body.predictions[i].direction[0].prediction[0].$.seconds/60)) * 60)
			);
		  
			busPrediction = 
				" The " + result.body.predictions[i].$.routeTitle +
				" " + result.body.predictions[i].direction[0].$.title +
				" will arrive in " +
				(Math.floor(result.body.predictions[i].direction[0].prediction[j].$.seconds/60)).toFixed(0) + " minutes " +
				((result.body.predictions[i].direction[0].prediction[j].$.seconds/60 -
					Math.floor(result.body.predictions[i].direction[0].prediction[j].$.seconds/60)) * 60).toFixed(0) + " seconds.\r";
			
			buses.push({time:result.body.predictions[i].direction[0].prediction[j].$.seconds, text:busPrediction});
		  }
		}
		
		//This is the best I could do for a sort funtion:
		
		buses.sort(function (a, b) {
			if (a.time/1 > b.time/1) {
				return 1;
			}
			if (a.time/1 < b.time/1) {
				return -1;
			}
			// a must be equal to b
			return 0;
		});
		
		//Concatenate the responses and print (This won't be used in the Alexa code)
		for (i=0; i < buses.length; i++){spokenResponse = spokenResponse + buses[i].text;}
		console.log(spokenResponse);
	});
	
  });

}

//Run the damn thing!
http.request(options, callback).end();




