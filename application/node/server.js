var cloudfoundry = require('cloudfoundry');
var mongodb = require('mongodb').Db;
var conn;

var http = require('http');

var host = process.env.VCAP_APP_HOST || 'localhost';
var port = process.env.VCAP_APP_PORT || '3000';
var mongourl = cloudfoundry.mongodb['mongoinst1'].credentials.url;


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

var mapFunction = function() {
	emit(this.ts, 1);
};

var reduceFunction = function(key, vals) {
	var sum =  0;
	
	for (var x=0; x < vals.length; x++) {
		sum += vals[x];
	} 
	
	return sum;
}

var print_visits = function(req, response) {
	
	/* Connect to the DB and auth */	
	require('mongodb').connect(mongourl, function(err, conn){
			
	    // Create map reduce command
		var command = {
			    mapreduce: "ips",
				out: "summary",
				map: mapFunction.toString(),
				reduce: reduceFunction.toString()
		};
			
	    conn.executeDbCommand(command, function(err, results){
	    	conn.collection('summary', function(err, coll){
		        coll.find({}, {}, function(err, cursor){
		            cursor.toArray(function(err, items){		                
		                
		            	response.writeHead(200, {'Content-Type': 'text/plain'});
		            	
		                for (i=0; i < items.length; i++) {
		                    response.write(items[i]._id + " = " + items[i].value + "\n");
		                }
		                
		                response.end();
		            });
		        });
		    });
	    	
	        //response.writeHead(200, {'Content-Type': 'text/plain'});
            //response.write("Ran command\n");
            //response.write("Error: " + JSON.stringify(err) + "\n");
            //response.write("Command results: " + JSON.stringify(results) + "\n");
            //response.end();
	    });
	});
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