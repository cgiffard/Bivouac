// Bivouac and perspex demo
// Christopher Giffard 2012

(function() {
	
	window.addEventListener("load",function() {
		loadBVH("kashiyuka");
		loadBVH("aachan");
		loadBVH("nocchi");
		
	},false);
	
	function loadBVH(name) {
		loadFile("data/" + name + ".bvh",function(data){
			var mocap = bivouac(data);
			window[name + "Mocap"] = mocap;
		});
	}
	
	function loadFile(file,callback) {
		var xhr = new XMLHttpRequest(),
			callback = callback instanceof Function ? callback : function(){};
		
		xhr.open('GET', file, true);
		xhr.onreadystatechange = function (eventData) {
			if (xhr.readyState === 4) {
				if(xhr.status === 200) {
					callback(xhr.responseText);
				} else {
					console.log("Failed to load resource.");
				}
			}
		};
		
		try {
			xhr.send(null);
		} catch(Error) {
			console.log(Error);
		}
		
	}
})()