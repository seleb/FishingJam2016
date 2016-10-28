function main(){
	curTime=Date.now()-startTime;
	deltaTime=curTime-lastTime;

	update();
	render();

	lastTime=curTime;

	// request another frame to keep the loop going
	requestAnimationFrame(main);
}




function init(){
	// initialize input managers
	gamepads.init();
	keys.init();
	keys.capture=[keys.LEFT,keys.RIGHT,keys.UP,keys.DOWN,keys.SPACE,keys.ENTER,keys.BACKSPACE,keys.ESCAPE,keys.F,keys.M];


	scene = new PIXI.Container();
	game.addChild(scene);

	world = new PIXI.Container(); // container for all the in-game stuff (i.e. not the menu)


	// setup screen filter
	screen_filter = new CustomFilter(PIXI.loader.resources.screen_shader.data);
	screen_filter.padding=0;

	//renderSprite.filters = [screen_filter];


	// screen background
	bg = new PIXI.Graphics();
	world.addChild(bg);


	$(document).on("keydown",function(event){
		if(event.keyCode == keys.F){
			toggleFullscreen();
		}
	});
	
	scene.addChild(world);





	// fish setup
	fishTex=PIXI.loader.resources.fish.texture;
	points = [];
	numPoints=16;
	a=0;
	speed={x:0,y:0};
	fish={
	 x:0,
	 y:0
	};
	for (var i = 0; i < numPoints; i++){
	    points.push(new PIXI.Point(i * fishTex.width/numPoints, 0));
	}
	strip = new PIXI.mesh.Rope(fishTex, points);

	world.addChild(strip);

	graphics=new PIXI.Graphics();
	world.addChild(graphics);

	// start the main loop
	window.onresize = onResize;
	_resize();
	main();
}


function update(){

	//////////////////////////
	// game logic goes here //
	//////////////////////////
	
	
	var dx=gamepads.getAxis(gamepads.LSTICK_H);
	var dy=gamepads.getAxis(gamepads.LSTICK_V);

	speed.x+=dx;
	speed.y+=dy;

	speed.x*=0.93;
	speed.y*=0.93;

    // fish
    a=slerp(a,Math.atan2(speed.y,speed.x)+Math.PI,0.5);

    fish.x+=speed.x;
    fish.y+=speed.y;

    points[numPoints-1].x=lerp(points[numPoints-1].x, fish.x-fishTex.width/2*Math.cos(a), 0.9);
    points[numPoints-1].y=lerp(points[numPoints-1].y, fish.y-fishTex.width/2*Math.sin(a), 0.9);


    for (var i = numPoints-2; i >= 0; --i) {
    	var wiggle=Math.sin(i/numPoints*2+curTime/100)/50*(Math.abs(speed.x)+Math.abs(speed.y)+0.5);
        points[i].x = lerp(points[i].x, points[i+1].x+fishTex.width/numPoints*Math.cos(a+wiggle), 1-(Math.abs(i-numPoints/2)/numPoints));
        points[i].y = lerp(points[i].y, points[i+1].y+fishTex.width/numPoints*Math.sin(a+wiggle), 1-(Math.abs(i-numPoints/2)/numPoints));
    }

    // controller debug
    graphics.clear();
	graphics.beginFill(0x000000);
	graphics.drawCircle(fish.x,fish.y,5);
	graphics.endFill();
	graphics.lineStyle(6,0x00FF00);
	graphics.moveTo(fish.x,fish.y);
	graphics.lineTo(fish.x+speed.x*5, fish.y+speed.y*5);
	graphics.lineStyle(3,0xFF0000);
	graphics.moveTo(fish.x,fish.y);
	graphics.lineTo(fish.x+dx*40, fish.y+dy*40);

	graphics.lineStyle(3,0x0000FF);
    for (var i = 0; i < numPoints; ++i) {
    	var x=fish.x+i/numPoints*40;
    	var y=fish.y+30+Math.sin(i/numPoints*2+curTime/100)*10;
    	if(i==0){
    		graphics.moveTo(x,y);
    	}else{
			graphics.lineTo(x, y);
		}
	}
	graphics.lineStyle(3,0x00000);
    for (var i = 0; i < numPoints; ++i) {
    	var x=fish.x+i/numPoints*40;
    	var y=fish.y+30+Math.sin(i/numPoints*2+curTime/100)*5*(Math.abs(speed.x)+Math.abs(speed.y)+0.5);
    	if(i==0){
    		graphics.moveTo(x,y);
    	}else{
			graphics.lineTo(x, y);
		}
	}


	screen_filter.uniforms.time = curTime/1000;

	// update input managers
	keys.update();
	gamepads.update();
}

function render(){
	try{
		renderer.render(scene,renderTexture);
		renderer.render(renderSprite,null,true,false);
	}catch(e){
		renderer.render(scene,null,true,false);
	}
}