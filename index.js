var fs = require("fs");
var util = require("util");

module.exports = loadAppDirectory;

function loadAppDirectory(app,dir,target, cb){
	target = target || app;
	//load up the config file
	target.dirRoot = dir;
	target.mode = process.env.NODE_ENV || "production";
	target.config = loadJSON(app, dir + "/config.json");
	
	//console.log("loadAppDirectory", dir);
	
	//load up the loader instructions
	var loader = loadJSON(app, dir + "/.earlybird.conf") || {};
	
	//create our exclude list - including the files we've already loaded
	var exclude = {"config.json":true, ".earlybird.conf" : true}, arrExclude = loader.exclude || [];
	arrExclude.forEach(function(exc){
		//add to our list of excluded items
		exclude[exc] = true;
	});
	
	//run through the list of include items
	var include = {}, arrInclude = loader.include || [];
	//merge the rest of the contents from the directory so we can deal with everything in a single loop
	arrInclude = arrInclude.concat(listDirectory(app, dir));
	//now iterate all the items async
	forEachAsync(arrInclude, function(item, next){
		if(exclude[item]){
			//skip
			next();
		}else{
			loadContents(app, dir, item, target, function(){
				//we have done this item - now exclude it
				exclude[item] = true;
				next();
			});
		}
	},function(){
		//console.log("completed: "+dir);
		if(cb)cb();
	});
};

function loadContents(app, dir, name, target, next){
	//prohibit loading hidden files
	if(name.indexOf(".") == 0){
		return;
	}
	
	//console.log("loadContents", dir, name);
	
	//drop the .js from the name to get the id
	var id = name;
	if(id.indexOf(".") > -1)id = id.substr(0, id.indexOf("."));
	
	var src = dir + "/" + name;
	var stats = loadStats(app, src);
	//console.log("","loading contents","stats",name,stats.isDirectory())
	if(stats.isDirectory()){
		target[id] = {};
		//load up the directory - populating the target on route
		loadAppDirectory(app,src,target[id], function(){
			next();
		});
	}else{
		function attachModule(mod){
			//if object returned then store it on the app/target
			if(mod)target[id] = mod;
			//next - syncronous
			next();
		}
		//load up the contents
		try{
			var mod = require(src)(app, attachModule);

			//backward compatibility
			if(mod !== attachModule){
				//we're not waiting
				attachModule(mod);
			}
		}catch(err){
			console.log("Error loading module: ",src,err);
			//something wrong with this module
			next();
		}
	}
}

function loadStats(app, src){
	return fs.lstatSync(src);
}

function listDirectory(app, src){
	return fs.readdirSync(src);
}

function loadFile(app, src){
	return fs.readFileSync(src, 'utf8');
}

function loadJSON(app, src){
	var result;
	
	try{
		result = JSON.parse(loadFile(app, src));
	}catch(err){
		if(app.get('debug')){
			console.log("error loading json '"+src+"': "+err);
		}
	}
	
	return result;
}

forEachAsync = function(arr, action, cb){
	var i = - 1;
	var lim = arr.length;

	next();

	function next(){
		if(++i < lim){
			action(arr[i], function(err, result){
				//arr[i] = result || arr[i];
				next();
			});
		}else{
			cb();
		}
	}
}
