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
var size=[500,300];

var sounds=[];

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
		.add("fish","assets/img/fish.png")
		.add("hook","assets/img/hook.png")
		.add("line","assets/img/line.png");

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
	renderer.view.style.width=w+"px";
	renderer.view.style.height=h+"px";

	renderer.resize(w,h);
	renderTexture.baseTexture.resize(w,h);
	console.log("Resized",size,w,h);

	size[0]=w;
	size[1]=h;

	bg.clear();
	bg.beginFill(0xFFFFFF);
	bg.drawRect(0,0,size[0],size[1]);
	bg.endFill();
}

PIXI.zero=new PIXI.Point(0,0);