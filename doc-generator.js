var fs = require('fs');
var parseXML = require('xml2js').parseString;

Array.prototype.hack = function() {
        if (this[0]['_'] != undefined) {
                return this[0]['_'];
        }
        if (this[0] != "undefined") {
                return this[0];
        }
};

function recurse(obj) {

	console.log(obj.data);

	for(var index in obj.data) { 
		var attr = obj.data[index];
		console.log("index:",index," attr:", attr);
	}

	return {
		arr: obj.data,
		level: 1,
		result: "",
	};
}

fs.readFile(__dirname + '/doc.xml', function(err, data) {
	parseXML(data, function (err, r) {
		console.log("Lol",data);

		var obj = recurse({
			arr: data,
			level: 1,
			result: ""
		});

		console.log(obj.result);
	});
});

