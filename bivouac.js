// Bivouac
// Javascript BVH Parser.
// Chritopher Giffard 2012

(function(glob) {
	
	// These are channel types we support...
	var allowedChannels = {"Xposition":1, "Yposition":1, "Zposition":1, "Xrotation":1, "Yrotation":1, "Zrotation":1};
	
	function Bone(name) {
		this.name = name ? name : "Untitled";
		
		this.endSite = false;
		this.children = [];
		this.parent = null;
		this.channels = [];
		
		this.offsetX = 0;
		this.offsetY = 0;
		this.offsetZ = 0;
		
		// Store for cached position data...
		this.cachedPositionX = null;
		this.cachedPositionY = null;
		this.cachedPositionZ = null;
		
		this.cachedEndpointPositionX = null;
		this.cachedEndpointPositionY = null;
		this.cachedEndpointPositionZ = null;
	}
	
	Bone.prototype = {
		"constructor": Bone,  // Appear as a bivouac object
		
		"getPosition": function(endPoint) {
			// Recursively calculate position
			if (!!this.parent) {
				
			}
		},
		
		"setChannelValue": function() {
			
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
		
		if (data && data.length) this.parse(data);
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
			
		},
		
		"setOffset": function(x,y,z) {
			this.offsetX = x;
			this.offsetY = y;
			this.offsetZ = z;
		},
		
		"parse": function(data) {
			var self = this;
			var startTime = (new Date()).getTime();
			
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
				endSite				= false,			// Are we currently in a bone endsite?
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
						currentToken = "End";
						currentBone.endSite = true;
						endSite = true;
					
					} else if (token === "{") {
						// Opening block...
						blocksOpen ++;
						
					} else if (token === "}") {
						// Closing block...
						// Jump up the heirarchy by one bone (hah!)
						if (blocksOpen > 0) {
							blocksOpen --;
								
							if (endSite) {
								// We /were/ in an endSite block. Now we're not.
								endSite = false;
									
							} else {
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
						if (endSite) {
							currentBone["endOffset" + ["X","Y","Z"][parameterCount]] = parseFloat(token);
						} else {
							currentBone["offset" + ["X","Y","Z"][parameterCount]] = parseFloat(token);
						}
						
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
			console.log("it took ",((new Date()).getTime()-startTime),"ms to parse.");
		}
	};
	
	function bivouac(data) {
		return new Bivouac(data);
	}
	window.Bivouac = Bivouac;
	(typeof module != "undefined" && module.exports) ? (module.exports = bivouac) : (typeof define != "undefined" ? (define("bivouac", [], function() { return bivouac; })) : (glob.bivouac = bivouac));
})(this);