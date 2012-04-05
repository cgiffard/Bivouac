// Bivouac and perspex demo
// Christopher Giffard 2012

(function() {
	
	window.addEventListener("load",function() {
		var width = window.innerWidth,
			height = window.innerHeight;
		
		var canvas = document.createElement("canvas");
			canvas.height = height;
			canvas.width = width;
			document.body.appendChild(canvas);
		
		var context = canvas.getContext("2d");
		
		var camera		= new perspex.Camera(-400,-400,-400,-0.4,0,-0.2,height,width,-200),
			projection	= perspex(camera,{ clamp: false });
			
		// Listening for mouse events
		canvas.addEventListener("mousemove",function(eventData) {
			var cX = canvas.width - eventData.clientX, cY = eventData.clientY;
			crotY = 0.2 - (0.2 - (cX / canvas.width)*0.4)
			crotX = 0.4 - (0.2 - (cY / canvas.height)*0.4)
			crotZ = 0;
			
			camera.setRotation(crotX, crotY, crotZ);
		});
		
		
		// Mocap render function
		var frame = 0;
		function renderMocap(mocap) {
			// Advance to frame
			mocap.getForFrame(frame);
			
			context.fillStyle = "rgba(255,255,255,0.03)";
			context.fillRect(0,0,width,height);
			context.fillStyle = "black";
			
			context.fillRect(0,0,100,14);
			context.fillStyle = "white";
			context.fillText(frame,10,10);
			context.fillStyle = "black";
			
			for (var bone in mocap.boneList) {
				if (mocap.boneList.hasOwnProperty(bone)) {
					var bone = mocap.boneList[bone];
					context.fillRect.apply(context,projection.project(bone.cachedPositionX,bone.cachedPositionY,bone.cachedPositionZ).concat([3,3]));
				}
			}
			
			if (frame < mocap.frames.length -1) {
				frame ++;
			} else {
				frame = 0;
			}
			
			window.setTimeout(function() {
				renderMocap(mocap);
			}, mocap.frameTime);
		}
		
		loadBVH("kashiyuka",renderMocap);
		loadBVH("aachan",renderMocap);
		loadBVH("nocchi",renderMocap);
	},false);
	
	function loadBVH(name,callback) {
		loadFile("data/" + name + ".bvh",function(data){
			var mocap = bivouac(data);
			window[name + "Mocap"] = mocap;
			callback(mocap);
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