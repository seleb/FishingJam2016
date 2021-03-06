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
var size={
	x:1024,
	y:768
};

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
		size.x,size.y,
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


	sounds["btn"]=new Howl({
		urls:["assets/audio/btn.wav"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds["bump"]=new Howl({
		urls:["assets/audio/bump.wav"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds["catch"]=new Howl({
		urls:["assets/audio/catch.wav"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds["drop"]=new Howl({
		urls:["assets/audio/drop.wav"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds["win"]=new Howl({
		urls:["assets/audio/win.wav"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds["grab"]=new Howl({
		urls:["assets/audio/grab.wav"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds["release"]=new Howl({
		urls:["assets/audio/release.wav"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds["music"]=new Howl({
		urls:["assets/audio/music.ogg"],
		autoplay:true,
		loop:true,
		volume:0
	});
	sounds["music"].fadeIn(0.5,1000);

	PIXI.loader
		.add("hook","assets/img/hook.png")
		.add("line","assets/img/line.png")
		.add("bubble","assets/img/bubble.png")
		.add("background_1","assets/img/background_1.png")
		.add("background_2","assets/img/background_2.png")
		.add("background_3","assets/img/background_3.png")
		.add("menu_title","assets/img/menu_title.png")
		.add("join","assets/img/join.png")
		.add("ready","assets/img/ready.png")
		.add("waiting","assets/img/waiting.png")
		.add("restart","assets/img/restart.png")
		.add("player_wins","assets/img/player_wins.png")
		.add("tie","assets/img/tie.png")
		.add("border","assets/img/border.png");

	for(var i = 1; i <= 4; ++i){
		PIXI.loader
		.add("fish_"+i.toString(10), "assets/img/fish_"+i.toString(10)+".png")
		.add("player_wins_"+i.toString(10), "assets/img/player_wins_"+i.toString(10)+".png");
	}

	PIXI.loader
		.on("progress", loadProgressHandler)
		.load(init);
});


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
	var ratio=size.x/size.y;

	
	if(w/h < ratio){
		h = Math.round(w/ratio);
	}else{
		w = Math.round(h*ratio);
	}
	

	var aw,ah;

	if(scaleMode==0){
		aw=size.x;
		ah=size.y;


		do{
			aw+=size.x;
			ah+=size.y;
		}while(aw <= w || ah <= h);

		aw-=size.x;
		ah-=size.y;
	}else if(scaleMode==1){
		aw=w;
		ah=h;
	}else{
		aw=size.x;
		ah=size.y;
	}

	renderer.view.style.width=aw+"px";
	renderer.view.style.height=ah+"px";

	console.log("Resized",size,aw,ah);
}

PIXI.zero=new PIXI.Point(0,0);