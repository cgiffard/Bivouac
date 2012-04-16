// Bivouac
// Javascript BVH Parser.
// Chritopher Giffard 2012

(function(glob) {
	
	// These are channel types we support...
	var allowedChannels = {"Xposition":1, "Yposition":1, "Zposition":1, "Xrotation":1, "Yrotation":1, "Zrotation":1};
	
	// Functions for running rotational transforms
	function rotateX(point, angle) {
	    var rad		= angle * Math.PI / 180,
			cosa	= Math.cos(rad),
			sina	= Math.sin(rad),
			x, y, z;
		
	    y = point[1] * cosa - point[2] * sina;
	    z = point[1] * sina + point[2] * cosa;
	    return [point[0], y, z];
	}
							
	function rotateY(point, angle) {
	    var rad		= angle * Math.PI / 180,
			cosa	= Math.cos(rad),
			sina	= Math.sin(rad),
			x, y, z;
		
	    z = point[2] * cosa - point[0] * sina;
	    x = point[2] * sina + point[0] * cosa;
	    return [x, point[1], z];
	}
							
	function rotateZ(point, angle) {
	    var rad		= angle * Math.PI / 180,
			cosa	= Math.cos(rad),
			sina	= Math.sin(rad),
			x, y, z;
		
	    x = point[0] * cosa - point[1] * sina;
	    y = point[0] * sina + point[1] * cosa;
	    return [x, y, point[2]];
	}
	
	// Function for recursing through skeleton and processing bone position/rotation
	function processBone(bone,transformationList) {
		// This function probably needs a bit of a cleanup.
		
		// Because rotational transformations are cumulative, we need somewhere to store them as we recurse through
		transformationList = transformationList && transformationList instanceof Array ? transformationList : [];
		
		// Storage for positional data
		var tmpPosition = [
			bone.offsetX,
			bone.offsetY,
			bone.offsetZ
		];
		
		if (!!bone.parent) {
			var parentPosition = bone.parent.getPosition();
			var transformSubject = bone.parent;
			
			// Run through a list of our collected transformations for this bone...
			transformationList.forEach(function(transformation,index) {
				["Z","X","Y"].forEach(function(d,i) {
					var rFunction = d === "X" ? rotateX : d === "Y" ? rotateY : rotateZ;
					tmpPosition = rFunction(tmpPosition,transformation.rotation[i]);
				});
			});
			
			// Now we set our position relative to that of our direct parent.
			tmpPosition[0] = tmpPosition[0] + parentPosition[0] + (!isNaN(bone.channelValues["Xposition"]) ? bone.channelValues["Xposition"] : 0);
			tmpPosition[1] = tmpPosition[1] + parentPosition[1] + (!isNaN(bone.channelValues["Yposition"]) ? bone.channelValues["Yposition"] : 0);
			tmpPosition[2] = tmpPosition[2] + parentPosition[2] + (!isNaN(bone.channelValues["Zposition"]) ? bone.channelValues["Zposition"] : 0);
			
		} else {
			// Haven't found any good BVH documentation yet, so working this out as I go.
			// I'm assuming the channel values for x/y/z position are relative to the offset and not exclusive.
			// Because my test data has the root node offset at 0,0,0 I can't really test this. Feel free to
			// correct me.
			
			// If we're the root node, we don't calculate rotation, since we're just a point.
			// Any rotation applied to this node is initially calculated one level up.
			
			tmpPosition[0] = !isNaN(bone.channelValues["Xposition"]) ?
									bone.offsetX + parseFloat(bone.channelValues["Xposition"]) : 
									bone.offsetX;
			
			tmpPosition[1] = !isNaN(bone.channelValues["Yposition"]) ?
									bone.offsetY + parseFloat(bone.channelValues["Yposition"]) : 
									bone.offsetY;
			
			tmpPosition[2] = !isNaN(bone.channelValues["Zposition"]) ?
									bone.offsetZ + parseFloat(bone.channelValues["Zposition"]) :
									bone.offsetZ;
		}
		
		// Save the bone values back to the bone
		bone.calcPosX = tmpPosition[0];
		bone.calcPosY = tmpPosition[1];
		bone.calcPosZ = tmpPosition[2];
		
		// Save any transformations in the transformation stack...
		transformationList.unshift({
			"rotation":[
				(bone.channelValues["Zrotation"] || 0),
				(bone.channelValues["Xrotation"] || 0),
				(bone.channelValues["Yrotation"] || 0)
			],
			"origin": tmpPosition.slice(0)
		});
		
		// Now process all our children
		bone.children.forEach(function(bone) {
			
			// We're slicing the list so we generate a new array for this recursion - rather than modifying it.
			// If we don't create a new instance of this data, we'll retain transformations from sibling skeleton
			// branches which shouldn't apply.
			processBone(bone,transformationList.slice(0));
		});
	}
	
	function Bone(name) {
		this.name = name ? name : "Untitled";
		
		this.endSite = false;
		this.children = [];
		this.parent = null;
		this.channels = [];
		
		this.offsetX = 0;
		this.offsetY = 0;
		this.offsetZ = 0;
		
		// Store for calculated position data...
		this.calcPosX = 0;
		this.calcPosY = 0;
		this.calcPosZ = 0;
		
		// Storage for channel transformations
		this.channelValues = {};
	}
	
	Bone.prototype = {
		"constructor": Bone,  // Appear as a bivouac object
		
		"getPosition": function() {
			return [this.calcPosX, this.calcPosY, this.calcPosZ];
		},
		
		"setChannelValue": function(channelName,value) {
			if (!!allowedChannels[channelName]) {
				if (this.channelValues[channelName] !== parseFloat(value)) {
					this.channelValues[channelName] = parseFloat(value);
					
					// Clear cache
					this.calcPosX = null;
					this.calcPosY = null;
					this.calcPosZ = null;
				}
			} else {
				throw new Error("Fatal Error: Unknown/disallowed channel type: " + token);
			}
		}
	};
	
	function Bivouac(data) {
		this.skeleton = null;
		this.boneList = {};
		this.channels = [];
		this.offsetX = 0;
		this.offsetY = 0;
		this.offsetZ = 0;
		this.frameTime = 0;
		this.frameCount = 0;
		this.frames = [];
		
		if (data && data.length) this.parse(data); this.getForFrame(0);
	}
	
	Bivouac.prototype = {
		"constructor": Bivouac, // Appear as a bivouac object
		
		"structure": function() {
			// Is this a synonym for skeleton (in which case it should be removed)
			// or is it something else?
			// Or is it the public interface to skeleton (which should be made private?)
			return this.skeleton;
		},
		
		"getForFrame": function(frame) {
			var self = this;
			if (self.frames.length && self.frames[frame] && self.frames[frame].length) {
				self.channels.forEach(function(channel,index) {
					// Set value...
					self.boneList[channel[0]].setChannelValue(channel[1],self.frames[frame][index]);
				});
				
				// Kick off skeleton processing
				self.skeleton.forEach(processBone);
				
				// Return processed skeleton
				return self.skeleton;
			} else {
				throw new Error("Could not seek to frame. Missing frame or bad index.");
			}
		},
		
		"setOffset": function(x,y,z) {
			this.offsetX = x;
			this.offsetY = y;
			this.offsetZ = z;
		},
		
		"parse": function(data) {
			var self = this;
			
			var tokens =
				data
				.split(/\nMOTION\n/)
				.shift()
				.split(/(\s+)/ig)			// There's a reason I'm including whitespace: the parser needs \n to work.
				.filter(function(item) {
					return !!item && (item.match(/\S/g) || item.match(/\n/ig));
				})
				.map(function(item) {
					return item.replace(/[ \t]+/ig,"");
				});
			
			var motionData = 
				data
				.split(/\nMOTION\n/)
				.pop()
				.split(/\n+/ig);
			
			var hierarchy			= [];				// Base store
			var parseMode			= "UNINITIALISED",	// Parser state!
				currentToken		= null,				// Retain current token for parser operation
				previousToken		= null,				// Mostly for debugging
				currentBone			= hierarchy,		// For hierarchy creation
				parentBone			= currentBone,		// For hierarchy creation
				channelMappings		= [],				// Map indexed channels to bone attributes
				blocksOpen			= 0,				// For ensuring the file is balanced...
				parameterCount		= 0;				// For tracking ordered parameters to declarations (like XYZ)
			
			String.prototype.rep = function(c) { var r = ""; while (r.length < this.length * c) {r+=this}return r;};
			
			tokens.forEach(function(token) {
				// What's our parse mode? (What tokens are we expecting next?)
				// We're not expecting anything yet...
				if (parseMode === "UNINITIALISED") {
						
					// What kind of token are we dealing with here?
					if (token === "HIERARCHY") {
						// Ignore. We already assume we're processing the heirarchy here.
						
					} else if (token === "ROOT" || token === "OFFSET" || token === "CHANNELS" || token === "JOINT") {
						// Core directive. Tell parser to expect more tokens.
						
						currentToken = token;
						parseMode = "TOKEN";
							
						// Reset parameter count, ready for next declaration.
						parameterCount = 0;
						
					} else if (token === "End" || token === "Site") {
						// End site...
						// Don't run this twice for 'End' and 'Site'.
						if (currentToken !== "End") {
							currentToken = "End";
						
							if (currentBone instanceof Bone) {
								if (currentBone.endSite) {
									throw new Error("Fatal Error: Can't nest bone End Sites.");
								}
							
								var currentBoneName = currentBone.name + "EndSite";
							
								// Set up endsite bone...
								var tmpBone = new Bone(currentBoneName);
								tmpBone.endSite = true;
								tmpBone.parent = currentBone;
							
								// And relegate current bone to be the parent...
								parentBone = currentBone;
								parentBone.children.push(tmpBone);
								currentBone = tmpBone;
							
								// Add current bone to list...
								self.boneList[currentBoneName] = currentBone;
							} else {
								throw new Error("Fatal Error: Uncontained end-site.")
							}
						}
					} else if (token === "{") {
						// Opening block...
						blocksOpen ++;
						
					} else if (token === "}") {
						// Closing block...
						// Jump up the heirarchy by one bone (hah!)
						if (blocksOpen > 0) {
							blocksOpen --;
							
							// We're tracking a parent for this bone.
							if (currentBone instanceof Bone && currentBone.parent !== null) {
										
								// Shift pointer back to parent bone
								currentBone = currentBone.parent;
								parentBone = currentBone.parent;
										
							// We're not tracking a parent for this bone. Jump to root level.
							} else {
								currentBone = hierarchy;
								parentBone = null;
							}
						} else {
							throw new Error("Fatal Error: Unbalanced block index!");
						}
						
					} else if (token.match(/\n/ig)) {
						// New line. Not expecting anything any more.
						// But we're already uninitialised, so we'll just ignore this one.
						
					} else {
						throw new Error("Fatal Error: Unexpected token " + token + " - previous token: " + previousToken);
					}
				
				// We've already parsed a token or something, and we're expecting token data
				} else if (parseMode === "TOKEN") {
						
					// Hit a new line?	
					if (token.match(/\n+/g)) {
						parseMode = "UNINITIALISED";
						currentToken = null;
						
					// Expecting bone name
					} else if (currentToken === "ROOT" || currentToken === "JOINT") {
							
						// Set parse mode
						parseMode = "UNINITIALISED";
							
						if (self.boneList[token] instanceof Bone) {
							throw new Error("Fatal Error: Duplicate bone ID " + token);
						}
							
						var tmpBone = new Bone(token);
							
						if (currentBone instanceof Bone) {
							tmpBone.parent = currentBone;
							parentBone = currentBone;
							parentBone.children.push(tmpBone);
						} else {
							// First bone in the heirarchy?
							hierarchy.push(tmpBone);
						}
							
						currentBone = tmpBone;
						self.boneList[token] = currentBone;
						
					// Expecting channel identifiers
					} else if (currentToken === "CHANNELS") {
						
						// Ignoring first parameter, which is just a count for the number of channels.
						// Kinda redundant, since I can just count them myself.
						if (parameterCount > 0) {
							if (!!allowedChannels[token]) {
								currentBone.channels.push(token);
								self.channels.push([currentBone.name,token]);
							} else {
								throw new Error("Fatal Error: Unknown/disallowed channel type: " + token);
							}
						}
						
						// Increment parameter count...
						parameterCount ++;
						
					} else if (currentToken === "OFFSET") {
						if (parameterCount > 2) {
							throw new Error("Fatal Error: Not expecting another parameter.");
						}
						
						// Save offset - ascertain axis by parameter count
						currentBone["offset" + ["X","Y","Z"][parameterCount]] = parseFloat(token);
						
						// Increment parameter count...
						parameterCount ++;
							
					// Whoops - we didn't anticipate seeing whatever we're seeing here!
					} else {
						throw new Error("Fatal Error: Unexpected condition: " + currentToken);
					}
				}
			});
			
			// Now parse out motion...
			motionData.forEach(function(motionLine,index) {
				
				// Ignore nulls and blanks
				if (!motionLine || !motionLine.length) return;
				
				// Only check for frame time and frame count if they're not already set
				if (self.frameTime === 0 || self.frameCount === 0) {
					var lineMatch;
					
					// If this is a frame count declaration, parse and return!
					if (lineMatch = motionLine.match(/^Frames:\s*(\d+)/i)) {
						self.frameCount = parseInt(lineMatch[1]);
						return;
					}
					
					// If this is a frame time declaration, parse and return!
					if (lineMatch = motionLine.match(/^Frame Time:\s*([\d.]+)/i)) {
						self.frameTime = parseFloat(lineMatch[1])*1000;
						return;
					}
				}
				
				// Split up line into channel values
				var values =
					motionLine
					.split(/\s+/ig)
					.filter(function(item) {
						return item && item.length;
					})
					.map(function(item) {
						return parseFloat(item);
					});
				
				if (values.length === self.channels.length) {
					self.frames.push(values);
				} else {
					// Channel count for this sample didn't match what we extracted from the skeleton hierarchy.
					// (Index minus one because the sample list padded by two definitional lines, but is zero indexed.)
					throw new Error("Fatal Error: Invalid number of channels for sample/frame " + (index-1) + ".");
				}
			});
			
			this.skeleton = hierarchy;
		}
	};
	
	function bivouac(data) {
		return new Bivouac(data);
	}
	
	(typeof module != "undefined" && module.exports) ? (module.exports = bivouac) : (typeof define != "undefined" ? (define("bivouac", [], function() { return bivouac; })) : (glob.bivouac = bivouac));
})(this);