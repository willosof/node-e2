var debug		= require("debug")("e2-lib")
var net			= require('net');

module.exports = {
	connect: function(host) {
		debug("info","Well, we want to connect to",host)
	}
};

// Constructor
function e2(param) {
  // always initialize all instance properties
	if (param == undefined) {
		param = {};
	}

  this.localaddr = param.localaddr ? param.localaddr : "0.0.0.0";

	this.addr = param.addr ? param.addr : "10.20.30.10";
	this.port = param.port ? param.port : "9876";
	this.keepaliveInterval = param.keepalive ? param.keepalive : 2000;

	this.client = undefined;
	this.lastseen = 0;
	this.keepaliveTimer = undefined;
	this.client_version = "0.0.0";

}

// Give ourselves a better life.
String.prototype.endsWith = function(suffix) { return this.indexOf(suffix, this.length - suffix.length) !== -1; };
Date.snow = function() { return this.now() / 1000; }


// class methods
e2.prototype.connect = function(param) {

	var client;
	var e2 = this;
	var buffer = "";

	client = net.connect({
		port: this.port,
		host: this.addr
	}, function() {

		this.client = client;

		client.write('<System id="0" reset="yes"><XMLType>3</XMLType><Query>3</Query><Recursive>1</Recursive></System>');

		// så sier klienten: <System id="0"></System>
		// og får svar fra vp: <System id="0" GUID=""><XMLType>4</XMLType><Resp>0</Resp></System>

		param.success(1,"Connected to server");
	});

	client.on('data', function(data) {
		buffer += data.toString();
		if (buffer.endsWith("</System>")) {
			e2.process(client,buffer);
			buffer = "";
		}
	  //this.client.end();
	});

	client.on('end', function() {
	  param.error(1,"Client disconnected / Socket closed")
	});

};

e2.prototype.keepaliveCheck = function(client) {
	//debug("keepalive","check");
	client.write('<System id="0"></System>');

	var obj = this;
	this.keepaliveTimer = setTimeout(function() {
		obj.keepaliveFail(client);
	}, this.keepaliveInterval);

};

e2.prototype.keepaliveFail = function(client) {
	debug("keepalive","not responding. disconnecting");
	client.end();
	console.log("#### LOST CONNECTION ####");

};

e2.prototype.keepaliveOK = function(client) {
	//debug("keepalive","ok");
	this.lastseen = Date.snow();
	this.keepaliveReset(client);
};

e2.prototype.keepaliveReset = function(client) {
	clearTimeout(this.keepaliveTimer);
	var obj = this;
	this.keepaliveTimer = setTimeout(function() {
		obj.keepaliveCheck(client);
	}, this.keepaliveInterval);
}

e2.prototype.process = function(client,data) {

	if (data.endsWith("<XMLType>4</XMLType><Resp>0</Resp></System>")) {
		// keepalive garbage
	}
	else {

		debug("process",data);

	}

	this.keepaliveOK(client);
};

// export the class
module.exports = e2;
