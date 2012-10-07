var fs = require("fs");
var util = require("util");

module.exports = loadAppDirectory;

function loadAppDirectory(app,dir,target){
	target = target || app;
	//load up the config file
	target.dirRoot = dir;
	target.config = loadJSON(app, dir + "/config.json");
	//load up the loader instructions
	var loader = loadJSON(app, dir + "/.earlybird.conf") || {};
	
	//create our exclude list
	var exclude = {"config.json":true}, arrExclude = loader.exclude || [];
	arrExclude.forEach(function(exc){
		//add to our list of excluded items
		exclude[exc] = true;
	});
	//run through the list of include items
	var include = {}, arrInclude = loader.include || [];
	arrInclude.forEach(function(inc){
		//if the include is a directory they loadAppDirectory - otherwise just load it
		loadContents(app, dir, inc, target);
		//add this to our excluded list as we've now dealt with it
		exclude[inc] = true;
	});
	
	//work through the list of include directories/files and load them
	var arrContents = listDirectory(app, dir);
	arrContents.forEach(function(cnt){
		if(!exclude[cnt]){
			loadContents(app, dir, cnt, target);
		}
	});
};

function loadContents(app, dir, name, target){
	//prohibit loading hidden files
	if(name.indexOf(".") == 0){
		return;
	}
	
	//drop the .js from the name to get the id
	var id = name;
	if(id.indexOf(".") > -1)id = id.substr(0, id.indexOf("."));
	
	var src = dir + "/" + name;
	var stats = loadStats(app, src);
	//console.log("","loading contents","stats",name,stats.isDirectory())
	if(stats.isDirectory()){
		target[id] = {};
		//load up the directory - populating the target on route
		loadAppDirectory(app,src,target[id]);
	}else{
		//load up the contents
		var mod = require(src)(app);
		//if object returned then store it on the app/target
		if(mod)target[id] = mod;
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