var fs = require('fs');
var parseXML = require('xml2js').parseString;

function spaces(num,pref) {
	var res = "";
	for (var n = 1; n <= num; n++) {
		res += "  ";
	}

  if (!pref){
    res += "* ";
  }

	return res;
};
var globalcount = 0;

function recurse(obj) {
  //console.log("entry");
  if (obj.arr != undefined) {
    if (typeof obj.arr == "boolean" || typeof obj.arr == "string" || typeof obj.arr == "number") {
      //console.log(spaces(obj.level) + " = ("+typeof(obj.arr)+"): " + obj.arr);

    }
    else {

    //  console.log("for index in obj.arr");
    	for (var index in obj.arr) {
  //      console.log(" .. index");

    		var attr = obj.arr[index];

        if (index != undefined && index != "$") {
          if (index == "0" && attr["_"] != undefined) {
            //console.log(spaces(obj.level) + "VALUE: "+ attr["_"]);
          } else {
            var hide = false;

            if (index == 0) { // lol. check for int properly later.
//              console.log(spaces(obj.level,false) + "*(ArrayElement: "+index+")*");
              console.log(spaces(obj.level,true) + " (array)");
              obj.level--;

            }
            else if (index >= 1) {
              hide = true;
      //        console.log(spaces(obj.level,false) + "*(ArrayElement: "+index+")*");
            }
            else {
              var uri = obj.path+"/"+index;
              var url = uri.replace(/\/0\//g,"/").replace(/\/\//g,"").replace(/\//g,".");

              console.log(spaces(obj.level,false) + "**["+index+"]("+url+")**");
            }
        		obj.level++;
            if (hide) {
//              console.log(spaces(obj.level,false) + "*hidden*");
            }
        		if (attr != undefined && !hide) {
        			recurse({
        				arr: attr,
        				level: obj.level,
                path: obj.path+"/"+index,
        			});
        		}

        		obj.level--;
        	}
        }
        else if (index == "$") {
          //console.log("here live treasures:",attr);
        }
      }
    }
  }

}

fs.readFile(__dirname + '/api.xml', function(err, data) {
	var plaindata = data.toString('utf-8');
	parseXML(plaindata, function (err, r) {
		var obj = recurse({
			arr: r,
			level: -1,
			path: "/"
		});
	});
});
