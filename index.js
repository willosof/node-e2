/*
  Node-E2 Library
  Copyright (c) 2015 William Viker
*/

var debug          = require("debug")("e2-lib")
var net            = require('net');
var parseXML      = require('xml2js').parseString;
var util          = require('util');
var EventEmitter  = require('events').EventEmitter;

exports = module.exports = e2;

// Constructor
function e2(param) {

  if (param == undefined) {
    param = {};
  }

  this.localaddr  = param.localaddr            ? param.localaddr    : "0.0.0.0";
  this.addr        = param.addr                ? param.addr         : "10.20.30.10";
  this.port        = param.port                ? param.port        : "9876";
  this.ready      = param.ready != undefined  ? param.ready        : undefined;
  this.keepaliveInterval = param.keepalive    ? param.keepalive    : 2000;
  this.client     = undefined;
  this.lastseen    = 0;
  this.gotSyncup  = false;

  this.keepaliveTimer = undefined;
  this.client_version = "0.0.0";
  this.sync           = {};

}

util.inherits(e2, EventEmitter);

// Give ourselves a better life.
String.prototype.endsWith = function(suffix) { return this.indexOf(suffix, this.length - suffix.length) !== -1; };
Date.snow = function() { return this.now() / 1000; }

Array.prototype.hack = function() {
  if (this[0]['_'] != undefined) {
    return this[0]['_'];
  }
  if (this[0] != "undefined") {
    return this[0];
  }
};

// class methods
e2.prototype.connect = function(param) {

  var client;
  var self = this;
  var buffer = "";

  client = net.connect(
    {

      port: this.port,
      host: this.addr

    }, function() {

    self.client = client;

    // Ask E2 to recusively send all configuration in the config-tree
    client.write('<System id="0" reset="yes"><XMLType>3</XMLType><Query>3</Query><Recursive>1</Recursive></System>');

    self.emit('connected');
  });

  client.on('data', function(data) {

    buffer += data.toString();

    if (buffer.endsWith("</System>")) {
      self.process(client,buffer);
      buffer = "";
    }

  });

  client.on('end', function() {
    self.emit('error', "Client disconnected / Socket closed");
  });

};

e2.prototype.keepaliveCheck = function(client) {
  //debug("keepalive","check");
  client.write('<System id="0"></System>');

  var self = this;
  this.keepaliveTimer = setTimeout(function() {
    self.keepaliveFail(client);
  }, this.keepaliveInterval);

};

e2.prototype.keepaliveFail = function(client) {
  debug("keepalive","not responding. disconnecting");
  client.end();

  console.log("#### LOST CONNECTION ####");
};

e2.prototype.keepaliveOK = function(client) {
  this.lastseen = Date.snow();
  this.keepaliveReset(client);
};

e2.prototype.keepaliveReset = function(client) {
  clearTimeout(this.keepaliveTimer);
  var self = this;
  this.keepaliveTimer = setTimeout(function() {
    self.keepaliveCheck(client);
  }, this.keepaliveInterval);
}

e2.prototype.syncUp = function(data) {

  debug("syncup","Done syncing.",
    "VPID:",data.VPID.hack(),
    "NAME:", data.Name.hack(),
    "RATE:", data.NativeRate.hack(),
    "MAC:", data.MacAddress.hack()
  );

  this.sync = data;
  this.ready();
};

e2.prototype.process = function(client,data) {

  var self = this;

  if (data == '<System id="0" GUID=""><XMLType>4</XMLType><Resp>0</Resp></System>') {
    // keepalive garbage
  }

  else {

    parseXML(data, function (err, r) {

      if (r.System != undefined) {
        var s = r.System;

        if (s.MacAddress != undefined && self.gotSyncup == false) {
          self.syncUp(s);
          self.gotSyncup = true;
        }

        else {
          debug("UNKNOWN XML",r);
        }

      }
      else {
        debug("process","missing System tag. Dunnowhat.")
      }
    });

  }

  this.keepaliveOK(client);
};

// export the class
module.exports = e2;
