var cloudfoundry = require('cloudfoundry');
var mongodb = require('mongodb').Db;
var conn;

var http = require('http');

var host = process.env.VCAP_APP_HOST || 'localhost';
var port = process.env.VCAP_APP_PORT || '3000';
var mongourl = cloudfoundry.mongodb['mongoinst1'].credentials.url;

var results = new Array();

var record_visit = function(req, res) {
    /* Connect to the DB and auth */
	require('mongodb').connect(mongourl, function(err, conn){
	    conn.collection('ips', function(err, coll){
	        /* Simple object to insert: ip address and date */
	        object_to_insert = { 'ip': req.connection.remoteAddress, 'ts': new Date().toDateString() };

	        /* Insert the object then print in response */
	        /* Note the _id has been created */
	        coll.insert( object_to_insert, {safe:true}, function(err){
	            res.writeHead(200, {'Content-Type': 'text/plain'});
	            res.write(JSON.stringify(object_to_insert));
	            res.end('\n');
	        });
	    });
	});
};

var print_visits = function(req, res) {
	/* Connect to the DB and auth */
	require('mongodb').connect(mongourl, function(err, conn){
	    conn.collection('ips', function(err, coll){
	        coll.find({}, {limit:100, sort:[['_id','desc']]}, function(err, cursor){
	            cursor.toArray(function(err, items){
	                
	                
	                for (i=0; i < items.length; i++) {
	                    //res.write(JSON.stringify(items[i]) + "\n");
	                    addToSummary(items[i]);
	                }
	                
                    printSummary(req, res);
	            });
	        });
	    });
	});
};


var addToSummary = function(row) {

	for (x=0; x < results.length; x++) {
		if (results[x].ts == row.ts) {
			results[x].count++;
			
			return;
		}
	}
	
	results[results.length] = { 'ts': row.ts, 'count': 0 };
	
};


var printSummary = function(request, response) {
	response.writeHead(200, {'Content-Type': 'text/plain'});
	
	for (y=0; y < results.length; y++) {
		response.write(results[y].ts + " = " + results[y].count + "\n");
	}
	
    response.end();
};

http.createServer(function(request, response){
	
	//params = require('url').parse(request.url);
	
	//response.writeHead(200, {'Content-Type': 'text/plain'});
	if (request.method == 'POST') {
		record_visit(request, response);	
	} else {
		//response.end("Not a POST!!\n");
		print_visits(request, response);
	    //response.end("Path: " + params.pathname);
	}

}).listen(port,host);

console.log('Server running at ' + host + ':' + port);