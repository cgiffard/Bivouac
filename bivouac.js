// Bivouac
// Javascript BVH Parser.
// Chritopher Giffard 2012

(function(glob) {
	
	function Bivouac(data) {
		this.data = data;
		this.parse(data);
	}
	
	Bivouac.prototype = {
		"structure": fuction() {
			
		},
		
		"getForFrame": function(frame) {
			
		},
		
		"parse": function(data) {
			
		}
	}
	
	(typeof module != "undefined" && module.exports) ? (module.exports = Bivouac) : (typeof define != "undefined" ? (define("Bivouac", [], function() { return Bivouac; })) : (glob.Bivouac = Bivouac));
})(this);