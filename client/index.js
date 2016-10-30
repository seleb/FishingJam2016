var startTime=0;
var lastTime=0;
var curTime=0;

var game;
try{
	game = new PIXI.Container();
}catch(e){
	document.body.innerHTML="<p>Unsupported Browser. Sorry :(</p>";
}
if(!PIXI.utils.isWebGLSupported()){
	document.body.innerHTML="<p>Unsupported Browser. Sorry :(</p>";
}
var resizeTimeout=null;

var mouse={
	x:0,
	y:0
};
var size=[1024,768];

var sounds=[];

var debugDraw=false;
var scaleMode=1;

$(document).ready(function(){

	// try to auto-focus and make sure the game can be focused with a click if run from an iframe
	window.focus();
	$(document).on("mousedown",function(event){
		window.focus();
	});
	$(document).on("mousemove",function(event){
		mouse.x=event.clientX;
		mouse.y=event.clientY;
	});

	// setup game
	startTime=Date.now();

	// create renderer
	renderer = PIXI.autoDetectRenderer(
		size[0],size[1],
		{
			antiAlias:true,
			transparent:false,
			resolution:1,
			roundPixels:false,
			clearBeforeRender:true,
			autoResize:false
		}
	);
	renderer.backgroundColor = 0xFFFFFF;

	PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

	// add the canvas to the html document
	$("#display").prepend(renderer.view);


	/*sounds["audio"]=new Howl({
		urls:["assets/audio/audio.ogg"],
		autoplay:false,
		loop:false,
		volume:1
	});*/


	// create a new render texture..
	renderTexture = PIXI.RenderTexture.create(size[0],size[1],PIXI.SCALE_MODES.NEAREST,1);
	 
	// create a sprite that uses the new render texture...
	// and add it to the stage
	renderSprite = new PIXI.Sprite(renderTexture, new PIXI.Rectangle(0,0,size[0],size[1]));
	game.addChild(renderSprite);
	
	fontStyle1={fontFamily: "font", fontSize: 32, align: "center", fill:0xFFFFFF};

	CustomFilter.prototype = Object.create(PIXI.Filter.prototype);
	CustomFilter.prototype.constructor = CustomFilter;

	PIXI.loader
		.add("screen_shader","assets/screen_shader.frag")
		.add("fish_1","assets/img/fish_1.png")
		.add("fish_2","assets/img/fish_2.png")
		.add("hook","assets/img/hook.png")
		.add("line","assets/img/line.png")
		.add("bubble","assets/img/bubble.png")
		.add("background_1","assets/img/background_1.png")
		.add("background_2","assets/img/background_2.png")
		.add("background_3","assets/img/background_3.png")
		.add("border","assets/img/border.png");

	PIXI.loader
		.on("progress", loadProgressHandler)
		.load(init);
});


function CustomFilter(fragmentSource){
	PIXI.Filter.call(this,
		// vertex shader
		null,
		// fragment shader
		fragmentSource
	);
}


function loadProgressHandler(loader, resource){
	// called during loading
	console.log("loading: " + resource.url);
	console.log("progress: " + loader.progress+"%");
}

function onResize() {
	/*if(resizeTimeout != null){
		window.clearTimeout(resizeTimeout);
	}

	resizeTimeout=window.setTimeout(_resize,150);*/
	_resize();
}


function _resize(){
	var w=$("#display").innerWidth();
	var h=$("#display").innerHeight();
	var ratio=size[0]/size[1];

	
	if(w/h < ratio){
		h = Math.round(w/ratio);
	}else{
		w = Math.round(h*ratio);
	}
	

	var aw,ah;

	if(scaleMode==0){
		aw=size[0];
		ah=size[1];


		do{
			aw+=size[0];
			ah+=size[1];
		}while(aw <= w || ah <= h);

		aw-=size[0];
		ah-=size[1];
	}else if(scaleMode==1){
		aw=w;
		ah=h;
	}else{
		aw=size[0];
		ah=size[1];
	}

	renderer.view.style.width=aw+"px";
	renderer.view.style.height=ah+"px";

	console.log("Resized",size,aw,ah);
}

PIXI.zero=new PIXI.Point(0,0);