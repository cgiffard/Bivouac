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
		
		// Style document to avoid scrolling and stuff...
		document.body.style.margin = "0px";
		document.body.style.overflow = "hidden";
		
		var context = canvas.getContext("2d");
		
		var camera		= new perspex.Camera(0,-1*(height/2),-900,0,-0.4,0,800,800,-1000),
			projection	= perspex(camera,{ clamp: false });
			
		// Listening for mouse events
		canvas.addEventListener("mousemove",function(eventData) {
			var cX = canvas.width - eventData.clientX, cY = eventData.clientY;

			crotX = 0;
			crotY = (0.5 - (1-(cX / canvas.width)*1))
			crotZ = 0;
					
			camera.setRotation(crotX, crotY, crotZ);
		});
		
		
		// Mocap render function
		var frame = 10;
		function renderMocap(mocap) {
			// Advance to frame
			mocap.getForFrame(frame);
			
			context.fillStyle = "black";
			context.fillRect(0,0,100,14);
			context.fillStyle = "white";
			context.fillText(frame,10,10);
			context.fillStyle = "black";
			
			for (var bone in mocap.boneList) {
				if (mocap.boneList.hasOwnProperty(bone)) {
					var bone = mocap.boneList[bone];
					
					if (bone.endSite) {
						context.fillStyle = "red";
						context.strokeStyle = "red";
					} else {
						context.fillStyle = "black";
						context.strokeStyle = "black";
					}
					
					if (bone.parent) {
						context.beginPath();
						context.moveTo.apply(context,projection.project(bone.parent.calcPosX,bone.parent.calcPosY,bone.parent.calcPosZ));
						context.lineTo.apply(context,projection.project(bone.calcPosX,bone.calcPosY,bone.calcPosZ));
						context.stroke();
					} else {
						// we're the root element.
						// Draw a line from our root to the floor to enhance visibility.
						
						context.strokeStyle = "grey";
						context.beginPath();
						context.moveTo.apply(context,projection.project(bone.calcPosX,bone.calcPosY,bone.calcPosZ));
						context.lineTo.apply(context,projection.project(bone.calcPosX,0,bone.calcPosZ));
						context.stroke();
						
						context.lineWidth = 1;
						context.lineTo.apply(context,projection.project(0,0,0));
						context.stroke();
						context.lineWidth = 5;
						
						context.fillStyle = "rgba(0,0,0,0.1)";
						context.beginPath();
						context.moveTo.apply(context,projection.project(bone.calcPosX-30,0,bone.calcPosZ-30));
						context.lineTo.apply(context,projection.project(bone.calcPosX-30,0,bone.calcPosZ+30));
						context.lineTo.apply(context,projection.project(bone.calcPosX+30,0,bone.calcPosZ+30));
						context.lineTo.apply(context,projection.project(bone.calcPosX+30,0,bone.calcPosZ-30));
						context.closePath();
						context.fill();
					}
					
					context.fillStyle = "gold";
					context.fillRect.apply(context,projection.project(bone.calcPosX,bone.calcPosY,bone.calcPosZ).concat([5,5]));
				}
			}
			
			if (frame < mocap.frames.length -1) {
				frame ++;
			} else {
				frame = 0;
			}
		}
		
		loadBVH("kashiyuka",function(kashiyuka) {
			loadBVH("aachan",function(aachan) {
				loadBVH("nocchi",function(nocchi) {
					function renderMocapGroup() {
						context.fillStyle = "rgba(255,255,255,0.5)";
						context.fillRect(0,0,width,height);
						context.fillStyle = "black";
						
						context.lineWidth = 1;
						context.beginPath();
						context.moveTo.apply(context,projection.project(0,0,0));
						context.lineTo.apply(context,projection.project(0,0,300));
						context.strokeStyle = "lime";
						context.stroke();
			
						context.beginPath();
						context.moveTo.apply(context,projection.project(0,0,0));
						context.lineTo.apply(context,projection.project(0,300,0));
						context.strokeStyle = "blue";
						context.stroke();
			
						context.beginPath();
						context.moveTo.apply(context,projection.project(0,0,0));
						context.lineTo.apply(context,projection.project(300,0,0));
						context.strokeStyle = "red";
						context.stroke();
						
						context.lineWidth = 5;
						renderMocap(kashiyuka);
						renderMocap(aachan);
						renderMocap(nocchi);
						
						window.setTimeout(function() {
							renderMocapGroup();
						}, nocchi.frameTime*2);
					}
					
					renderMocapGroup();
				});
			});
		});
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