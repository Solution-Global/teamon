var http = require('http');
var fs = require('fs');
var url = require('url');
var httpProxy  = require('http-proxy');
var mime = require('mime-types'); // for contentType
var proxy;

// Create a server
http.createServer( function (request, response) {

  // Parse the request containing file name
  var pathname = url.parse(request.url).pathname;

  if (pathname.startsWith("/rest")) {
    console.log("Proxy for " + pathname + " received.");
    if (!proxy) {
        proxy = httpProxy.createProxyServer({});
    }
    return proxy.web(request, response, { target : 'http://192.168.1.164:7587/' } );
  }

   // Print the name of the file for which request is made.
   console.log("Request for " + pathname + " received.");

   // Read the requested file content from file system
   fs.readFile(pathname.substr(1), function (err, data) {
      if (err) {
         console.log(err);
         // HTTP Status: 404 : NOT FOUND
         // Content Type: text/plain
         response.writeHead(404, {'Content-Type': 'text/html'});
      }else{
        //Page found
        // HTTP Status: 200 : OK
        var contentType = mime.lookup(pathname);
        var responseHeardrs = {};

        if(contentType) {
          responseHeardrs['Content-Type'] = contentType;

          switch (contentType) {
            case 'application/font-woff2':
              // responseHeardrs['Accept-Ranges'] = 'bytes';
              // responseHeardrs['Content-Length'] = data.length / 8;
              break;
          }
        }

        response.writeHead(200, responseHeardrs);


         // Write the content of the file to response body
         response.write(data.toString());
      }
      // Send the response body
      response.end();
   });
}).listen(8082);

// Console will print the message
console.log('Server running at http://127.0.0.1:8082/');
