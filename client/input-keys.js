// setup inputs
var keys={
	down:[],
	justDown:[],
	justUp:[],

	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,

	W: 87,
	A: 65,
	S: 83,
	D: 68,

	Z:90,
	X:88,

	M:77,
	P:80,
	F:70,
	X:88,

	SPACE: 32,
	ENTER: 13,
	BACKSPACE: 8,
	ESCAPE: 27,

	capture:[],

	init:function(){
		$(document).on("keyup",keys.on_up.bind(keys));
		$(document).on("keydown",keys.on_down.bind(keys));
	},

	update:function(){
		this.justDown=[];
		this.justUp=[];
	},


	on_down:function(event){
		if(this.down[event.keyCode]!==true){
			this.down[event.keyCode]=true;
			this.justDown[event.keyCode]=true;
		}
		if(this.capture.indexOf(event.keyCode) != -1){
			event.preventDefault();
			return false;
		}
	},
	on_up:function(event){
		this.down[event.keyCode]=false;
		this.justDown[event.keyCode]=false;
		this.justUp[event.keyCode]=true;
		if(this.capture.indexOf(event.keyCode) != -1){
			event.preventDefault();
			return false;
		}
	},

	isDown:function(_key){
		return this.down[_key]===true;
	},
	isUp:function(_key){
		return !this.isDown(_key);
	},
	isJustDown:function(_key){
		return this.justDown[_key]===true;
	},
	isJustUp:function(_key){
		return this.up[_key]===true;
	}
};