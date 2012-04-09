// Bivouac and perspex demo
// Christopher Giffard 2012

// Kinda chunky at the moment. Please don't look too hard at the maths.

(function() {
	
	window.addEventListener("load",function() {
		var width = window.innerWidth,
			height = window.innerHeight;
		
		var canvas = document.createElement("canvas");
			canvas.height = height;
			canvas.width = width;
			document.body.appendChild(canvas);
		
		var context = canvas.getContext("2d");
		
		// Add a message about the loading + music...
		context.fillText("Loading...",Math.floor(width/2),Math.floor(height/2));
		context.fillText("WARNING: There is music.",Math.floor(width/2),Math.floor(height/2)+20);
		context.fillText("There are also a few display bugs. Work in progress!",Math.floor(width/2),Math.floor(height/2)+40);
		
		// Camera settings...
		var viewWidth = 1064, //width,
			viewHeight = 690, //height,
			viewDistance = -100,
			cameraX = -500,
			cameraY = 400,
			cameraZ = -1500,
			cameraRotZ = 0,
			cameraRotY = -0.1,
			cameraRotX = -0.2;
			
		// Calculate the camera distance from the 0,0 point in the XZ plane
		var xzDistance = Math.sqrt(Math.pow(Math.abs(cameraZ),2) + Math.pow(Math.abs(cameraX),2));
		
		// Now we can calculate the vertical diagonal distance in 3D.
		var vDistance = Math.sqrt(Math.pow(Math.abs(cameraY),2) + Math.pow(xzDistance,2));
		
		// Calculate the X rotation of the camera
		// cameraRotZ = 1 - Math.tan(xzDistance);
		
		var camera		= new perspex.Camera(cameraX,cameraY,cameraZ,cameraRotX,cameraRotY,cameraRotZ,viewWidth,viewHeight,viewDistance),
			projection	= perspex(camera,{ clamp: false });
		
		// Create audio...
		var music = document.createElement("audio");
			music.src = "http://dl.dropbox.com/u/23733308/Perfume_globalsite_sound.wav";
			music.controls = false;
			document.body.appendChild(music);
			music.load();
		
		var frame = 100;
		var cumulativeRenderTime = 0;
		var cameraAngle = 0;
		var cameraOrbitRadius = 1000;
		var orbitSpeed = 0.3;
		
		loadBVH("kashiyuka",function(kashiyuka) {
			loadBVH("aachan",function(aachan) {
				loadBVH("nocchi",function(nocchi) {
					var crazyHue = Math.random()*360, tweenOut;
					
					function renderMocapGroup() {
						var renderStart = (new Date()).getTime();
						
						// Camera rotation
						cameraAngle = cameraAngle < 360 ? cameraAngle + orbitSpeed : cameraAngle = 0;
						cameraX = (Math.sin(cameraAngle * (Math.PI/180)) * cameraOrbitRadius);
						cameraZ = (Math.cos(cameraAngle * (Math.PI/180)) * cameraOrbitRadius);
						cameraRotY = ((cameraAngle-250) * (Math.PI/180));
						
						if (cameraY > -600) {
							tweenOut = (600 - Math.abs(cameraY)) / 5;
							tweenOut = 5 < tweenOut ? 5 : tweenOut;
							cameraY -= tweenOut;
						}
						
						camera.setPosition(cameraX,cameraY,cameraZ);
						camera.setRotation(cameraRotX,cameraRotY,cameraRotZ);
																	
						if (viewDistance > -1400) {
							var tweenOut = (1400 - Math.abs(viewDistance)) / 2;
							tweenOut = 1 < tweenOut ? 1 : tweenOut;
							viewDistance -= tweenOut
							camera.setViewOffset(viewWidth,viewHeight,viewDistance);
						}
						
						if (frame === 1) {
							cumulativeRenderTime = 0;
						}
						
						if (frame === 1 && music.readyState > 1) {
							music.currentTime = 0;
							music.play();
						}
						
						if (frame % 18 === 0) {
							crazyHue = Math.random()*360;
						}
						
						context.fillStyle = "hsla(" + crazyHue + ",100%,80%,1)";
						context.fillRect(0,0,width,height);
						context.fillStyle = "black";
						
						// checkerboard
						var checkWidth = 100;
						for (var x = -1000; x <=1000; x += checkWidth) {
							for (var z = -1000; z <=1000; z += checkWidth) {
								
								if ((z - x) % (checkWidth * 2)) {
									
									var firstCorner = projection.project(x,0,z),
										lastCorner = projection.project(x+checkWidth,0,z+checkWidth),
										midCorner1 = projection.project(x+checkWidth,0,z),
										midCorner2 = projection.project(x,0,z+checkWidth);
									
									if (!(firstCorner[0] < 0	|| firstCorner[0] > width	|| firstCorner[1] < 0 	| firstCorner[1] > height) ||
										!(lastCorner[0] < 0		|| lastCorner[0] > width	|| lastCorner[1] < 0	|| lastCorner[1] > height) ||
										!(midCorner1[0] < 0		|| midCorner1[0] > width	|| midCorner1[1] < 0	|| midCorner1[1] > height) ||
										!(midCorner2[0] < 0		|| midCorner2[0] > width	|| midCorner2[1] < 0	|| midCorner2[1] > height)) {
										
										var alphaVariation = 1 - (Math.sqrt(Math.pow(Math.abs(z),2) + Math.pow(Math.abs(x),2)) / 1000);
										
										context.fillStyle = "rgba(255,255,255," + alphaVariation + ")";
									
										context.lineWidth = 1;
										context.beginPath();
										context.moveTo.apply(context,projection.project(x,0,z));
										context.lineTo.apply(context,projection.project(x+checkWidth,0,z));
										context.lineTo.apply(context,projection.project(x+checkWidth,0,z+checkWidth));
										context.lineTo.apply(context,projection.project(x,0,z+checkWidth));
										context.lineTo.apply(context,projection.project(x,0,z));
										context.closePath();
										context.fill();
									}
								}
							}
						}
						
						
						// context.lineWidth = 3;
						// 						context.beginPath();
						// 						context.moveTo.apply(context,projection.project(0,0,0));
						// 						context.lineTo.apply(context,projection.project(0,0,300));
						// 						context.strokeStyle = "lime";
						// 						context.stroke();
						// 							
						// 						context.beginPath();
						// 						context.moveTo.apply(context,projection.project(0,0,0));
						// 						context.lineTo.apply(context,projection.project(0,300,0));
						// 						context.strokeStyle = "blue";
						// 						context.stroke();
						// 							
						// 						context.beginPath();
						// 						context.moveTo.apply(context,projection.project(0,0,0));
						// 						context.lineTo.apply(context,projection.project(300,0,0));
						// 						context.strokeStyle = "red";
						// 						context.stroke();
						
						context.lineWidth = 5;
						renderMocap(kashiyuka);
						renderMocap(aachan);
						renderMocap(nocchi);
						
						// context.fillStyle = "black";
						// 						context.fillRect(0,0,100,14);
						// 						context.fillStyle = "white";
						// 						context.fillText(frame,10,10);
						// 						context.fillStyle = "black";
						// 						
						var renderTime = (new Date()).getTime() - renderStart;
						cumulativeRenderTime += renderTime;
						// 						
						// 						context.fillStyle = "black";
						// 						context.fillRect(110,0,100,14);
						// 						context.fillStyle = "white";
						// 						context.fillText(renderTime,120,10);
						// 						context.fillStyle = "black";
						// 						
						// 						context.fillStyle = "black";
						// 						context.fillRect(220,0,100,14);
						// 						context.fillStyle = "white";
						// 						context.fillText(Math.round(cumulativeRenderTime/frame,2),230,10);
						// 						context.fillStyle = "black";
						
						
						if (frame < nocchi.frames.length -1) {
							frame ++;
						} else {
							frame = 1;
						}
						
						var nextFrameTimeout = nocchi.frameTime - renderTime;
						
						if (nextFrameTimeout < 0) {
							// Skip some frames to catch up!
							var frameSkip = Math.ceil(renderTime / nocchi.frameTime) - 1;
							frame = frame + frameSkip > nocchi.frames.length ? 1 : frame + frameSkip;
							
							// And how much time is left until the next frame?
							nextFrameTimeout = renderTime % nocchi.frameTime;
							
							// console.log("Skipped %d frames, (due to excessive rendering time of %dms) timeout to next frame in %dms.",frameSkip,renderTime,nextFrameTimeout);
							// console.log(cumulativeRenderTime/frame);
						}
						
						window.setTimeout(function() {
							renderMocapGroup();
						}, nextFrameTimeout*5);
					}
					
					// music.addEventListener("loadeddata",function() {
					// 	if (music.readyState > 2) {
							renderMocapGroup();
					// 	}
					// });
				});
			});
		});
		
		// Mocap render function
		function renderMocap(mocap) {
			// Advance to frame
			mocap.getForFrame(frame);
			
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
						
					}
					
					if (bone.endSite && bone.name.match(/toe/i)) {
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
					
					var jointPos = projection.project(bone.calcPosX,bone.calcPosY,bone.calcPosZ);
					context.fillStyle = "rgba(0,0,0,0.3)";
					
					if (bone.endSite || 1) {
						context.fillText(bone.name,jointPos[0]+20,jointPos[1]);
						// context.fillText(Math.round(bone.channelValues["Xrotation"]||0) + " x " + Math.round(bone.channelValues["Yrotation"]||0) + " x " + Math.round(bone.channelValues["Zrotation"]||0),jointPos[0]+20,jointPos[1]);
					}
				}
			}
		}
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