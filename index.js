/* The express module is used to look at the address of the request and send it to the correct function */
var express = require('express');

var bodyParser = require('body-parser');

/* The http module is used to listen for requests from a web browser */
var http = require('http');

/* The path module is used to transform relative paths to absolute paths */
var path = require('path');

var mongoose = require('mongoose');

var fs = require('fs');

var pdfjsLib = require("pdfjs-dist/build/pdf.js");

var dbAddress = process.env.MONGODB_URI || 'mongodb://127.0.0.1';

/* Creates an express application */
var app = express();

/* Creates the web server */
var server = http.createServer(app);

/* Defines what port to use to listen to web requests */
var port =  process.env.PORT
						? parseInt(process.env.PORT):
						8128;

function startServer() {

	app.use(bodyParser.json({ limit: '16mb' }));
	app.use(express.static(path.join(__dirname, 'public')));

	app.get('/', (req, res, next) => {
		var filePath = path.join(__dirname, './index.html');

		res.sendFile(filePath);
	})

	app.get('/pdf', (req, res, next) => {
		/* Any copyright is dedicated to the Public Domain.
		 * http://creativecommons.org/publicdomain/zero/1.0/ */

		//
		// Basic node example that prints document metadata and text content.
		// Requires single file built version of PDF.js -- please run
		// `gulp singlefile` before running the example.
		//

		// Loading file from file system into typed array
		var pdfPath = req.body.file;

		// Will be using promises to load document, pages and misc data instead of
		// callback.
		var loadingTask = pdfjsLib.getDocument(pdfPath);
		loadingTask.promise
		  .then(function (doc) {
		    var numPages = doc.numPages;
		    console.log("# Document Loaded");
		    console.log("Number of Pages: " + numPages);
		    console.log();

		    var lastPromise; // will be used to chain promises
		    lastPromise = doc.getMetadata().then(function (data) {
		      console.log("# Metadata Is Loaded");
		      console.log("## Info");
		      console.log(JSON.stringify(data.info, null, 2));
		      console.log();
		      if (data.metadata) {
		        console.log("## Metadata");
		        console.log(JSON.stringify(data.metadata.getAll(), null, 2));
		        console.log();
		      }
		    });

		    var loadPage = function (pageNum) {
		      return doc.getPage(pageNum).then(function (page) {
		        console.log("# Page " + pageNum);
		        var viewport = page.getViewport({ scale: 1.0 });
		        console.log("Size: " + viewport.width + "x" + viewport.height);
		        console.log();
		        return page
		          .getTextContent()
		          .then(function (content) {
		            // Content contains lots of information about the text layout and
		            // styles, but we need only strings at the moment
		            var strings = content.items.map(function (item) {
		              return item.str;
		            });
		            console.log("## Text Content");
		            console.log(strings.join(" "));
		          })
		          .then(function () {
		            console.log();
		          });
		      });
		    };
		    // Loading of the first page will wait on metadata and subsequent loadings
		    // will wait on the previous pages.
		    for (var i = 1; i <= numPages; i++) {
		      lastPromise = lastPromise.then(loadPage.bind(null, i));
		    }
		    return lastPromise;
		  })
		  .then(
		    function () {
		      console.log("# End of Document");
		    },
		    function (err) {
		      console.error("Error: " + err);
		    }
		  );

		res.send('OK')
	})

	/* Defines what function to all when the server recieves any request from http://localhost:8080 */
	server.on('listening', () => {

		/* Determining what the server is listening for */
		var addr = server.address()
			, bind = typeof addr === 'string'
				? 'pipe ' + addr
				: 'port ' + addr.port
		;

		/* Outputs to the console that the webserver is ready to start listenting to requests */
		console.log('Listening on ' + bind);
	});

	/* Tells the server to start listening to requests from defined port */
	server.listen(port);

}

mongoose.connect(dbAddress, startServer);
