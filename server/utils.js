var http = require('http')
, url = require('url')
, fs = require('fs')
, path = require('path')
, express = require('express');

var utils = {
  jadeOptions: {
    filename: '',
    pretty: true,
    debug: false,
    compileDebug: false
  },

  loadClient: function(req, res, page){
    var url = path.normalize(__dirname + '/../client/' + page);
    console.log(url);
    fs.readFile(url, function(err, data){
      console.log(data);
      res.send(200, data);
    });
  }
};

exports.utils = utils;
