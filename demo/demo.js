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
		context.fillText("WARNING: There is music. (was. it's coming back soon.)",Math.floor(width/2),Math.floor(height/2)+20);
		context.fillText("There are also a few display bugs. Work in progress!",Math.floor(width/2),Math.floor(height/2)+40);
		
		// Camera settings...
		var viewWidth = 1*1.6, //width,
			viewHeight = 1, //height,
			viewDistance = 100,
			cameraX = 500,
			cameraY = 500,
			cameraZ = 1500,
			cameraRotZ = 0,
			cameraRotY = 0.1,
			cameraRotX = 0.2;
		
		var camera		= new perspex.Camera(cameraX,cameraY,cameraZ,cameraRotX,cameraRotY,cameraRotZ,viewWidth,viewHeight,viewDistance),
			projection	= perspex(camera,{ clamp: false });
		
		// Create audio...
		var music = document.createElement("audio");
			music.src = "http://dl.dropbox.com/u/23733308/Perfume_globalsite_sound.wav";
			music.controls = false;
			document.body.appendChild(music);
			music.load();
		
		var frame = 500;
		var cumulativeRenderTime = 0;
		var cameraAngle = 0;
		var cameraOrbitRadius = 1000;
		var orbitSpeed = 0.3;
		var cameraHeightOffset = 500;
		
		loadBVH("kashiyuka",function(kashiyuka) {
			loadBVH("aachan",function(aachan) {
				loadBVH("nocchi",function(nocchi) {
					var crazyHue = Math.random()*360, tweenOut;
					
					function renderMocapGroup() {
						var renderStart = (new Date()).getTime();
						
						// Camera rotation
						cameraAngle = cameraAngle < 360 ? cameraAngle + orbitSpeed : -360;
						cameraX = (Math.sin(cameraAngle * (Math.PI/180)) * cameraOrbitRadius);
						cameraZ = (Math.cos(cameraAngle * (Math.PI/180)) * cameraOrbitRadius);
						cameraRotY = ((cameraAngle - 15) * (Math.PI/180));
						
						// Height oscillation
						cameraHeightOffset = cameraHeightOffset > 110 ? cameraHeightOffset - 1 : cameraHeightOffset;
						cameraY = cameraHeightOffset + Math.sin(Math.abs(cameraAngle)/360) * 200
						cameraRotX = (((Math.sin(Math.abs(cameraAngle)/360)*3) - 3) * (Math.PI/180));
						
						// Assign the position
						camera.setPosition(cameraX,cameraY,cameraZ);
						camera.setRotation(cameraRotX,cameraRotY,cameraRotZ);
						
						// Initial zoom-in						
						if (viewDistance < 1400) {
							var tweenOut = (1400 - Math.abs(viewDistance)) / 2;
							tweenOut = 1 < tweenOut ? 1 : tweenOut;
							viewDistance += tweenOut
							camera.setViewOffset(viewWidth,viewHeight,viewDistance);
						}
						
						if (frame === 1) {
							cumulativeRenderTime = 0;
						}
						
						if (frame === 1 && music.readyState > 1) {
							// music.currentTime = 0;
							// music.play();
						}
						
						if (frame % 18 === 0) {
							crazyHue = Math.random()*360;	
						}
						
						context.fillStyle = "hsla(" + crazyHue + ",100%,80%,1)";
						context.fillRect(0,0,width,height);
						context.fillStyle = "black";
						
						// checkerboard
						var checkWidth = 50, renderDistance = 1000;
						for (var x = renderDistance * -1; x <= renderDistance; x += checkWidth) {
							for (var z = renderDistance * -1; z <= renderDistance; z += checkWidth) {
								
								if ((z - x) % (checkWidth * 2)) {
									
									var points = [
										[x,					0,	z				],
										[x + checkWidth,	0,	z				],
										[x + checkWidth,	0,	z + checkWidth	],
										[x,					0,	z + checkWidth	]
									];
									
									// If we're supposed to render this polygon...
									if (projection.shouldDrawPolygon(points,width,height)) {
										var alphaVariation = 1 - (Math.sqrt(Math.pow(z,2) + Math.pow(x,2)) / renderDistance);
										
										context.fillStyle = "rgba(255,255,255," + alphaVariation + ")";
										context.beginPath();
										context.moveTo.apply(context,projection.project.apply(projection,points[points.length-1]));
										points.forEach(function(point) {
											context.lineTo.apply(context,projection.project.apply(projection,point));
										});
										context.closePath();
										context.fill();
									}
								}
							}
						}
						
						// Draw 3D Axis
						
						context.lineWidth = 3;
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
						
						
						// Draw, well... the actual mocap
						context.lineWidth = 5;
						renderMocap(kashiyuka);
						renderMocap(aachan);
						renderMocap(nocchi);
						
						// Get the render time and add for cumulative time
						var renderTime = (new Date()).getTime() - renderStart;
						cumulativeRenderTime += renderTime;
						
						// Draw boxes for displaying the data..
						context.fillStyle = "white";
						context.fillRect(0,0,100,14);
						context.fillRect(110,0,100,14);
						context.fillRect(220,0,100,14);
						
						// Now spit out render stats: Frame, render time for frame, average render time.
						context.fillStyle = "black";
						context.fillText(frame,10,10);
						context.fillText(renderTime,120,10);
						context.fillText(Math.round((cumulativeRenderTime/frame)*100)/100,230,10);
						
						// Advance frame if we need to
						if (frame < nocchi.frames.length -1) {
							frame ++;
						} else {
							frame = 1;
						}
						
						// All this crap needs to be worked out.
						var nextFrameTimeout = nocchi.frameTime - renderTime;
						
						if (nextFrameTimeout < 0) {
							// Skip some frames to catch up!
							var frameSkip = Math.ceil(renderTime / nocchi.frameTime) - 1;
							frame = frame + frameSkip > nocchi.frames.length ? 1 : frame + frameSkip;
							
							// And how much time is left until the next frame?
							nextFrameTimeout = renderTime % nocchi.frameTime;
						}
						
						window.setTimeout(function() {
							renderMocapGroup();
						}, nextFrameTimeout);
					}
					
					// music.addEventListener("canplaythrough",function() {
						renderMocapGroup();
					// });
				});
			});
		});
		
		// Mocap render function
		function renderMocap(mocap) {
			// Advance to frame
			try {
				mocap.getForFrame(frame);
			} catch(Error) {
				// Some frameskip happened or something was misaligned.
				// Dust ourselves off and move on.
			}
			
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
					var viewdist = Math.sqrt(Math.pow(bone.calcPosX - camera.cX,2) + Math.pow(bone.calcPosZ - camera.cZ,2));
					var jointNameOpacity = (1000 - viewdist) > 0 ? (1000 - viewdist) / 2000 : 0;
					
					context.fillStyle = "rgba(0,0,0," + jointNameOpacity + ")";
					
					if (bone.endSite || 1) {
						context.fillText(bone.name,jointPos[0]+20,jointPos[1]);
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
})();