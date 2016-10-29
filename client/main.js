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
	 y:0,
	 a:0
	};
	for (var i = 0; i < numPoints; i++){
	    points.push(new PIXI.Point(i * fishTex.width/numPoints, 0));
	}
	fish.strip = new PIXI.mesh.Rope(fishTex, points);

	world.addChild(fish.strip);



	hook = new PIXI.Sprite(PIXI.loader.resources.hook.texture);
	hook.anchor.x=0.5;
	hook.anchor.y=0.25;
	world.addChild(hook);

	fishingLine={
		points:[],
		segmentCount:20,
		segmentLength:5
	};
	for (var i = 0; i < fishingLine.segmentCount; i++){
	    fishingLine.points.push(new PIXI.Point(
	    	0,
	    	i*fishingLine.segmentLength));
		fishingLine.points[i].vx=0;
		fishingLine.points[i].vy=0;
	}
	fishingLine.strip=new PIXI.mesh.Rope(PIXI.loader.resources.line.texture, fishingLine.points);
	world.addChild(fishingLine.strip);


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
	
	
	input={
		dx:gamepads.getAxis(gamepads.LSTICK_H),
		dy:gamepads.getAxis(gamepads.LSTICK_V)
	};

	speed.x+=input.dx*1.4;
	speed.y+=input.dy*1.4;

	speed.x*=0.9;
	speed.y*=0.9;

    // fish
    fish.a=slerp(fish.a,Math.atan2(speed.y,speed.x)+Math.PI,0.5);

    fish.x+=speed.x;
    fish.y+=speed.y;

    points[numPoints-1].x=lerp(points[numPoints-1].x, fish.x-fishTex.width/2*Math.cos(fish.a), 0.9);
    points[numPoints-1].y=lerp(points[numPoints-1].y, fish.y-fishTex.width/2*Math.sin(fish.a), 0.9);


    for (var i = numPoints-2; i >= 0; --i) {
    	var wiggleSpeed=Math.abs(speed.x)+Math.abs(speed.y)+0.5;
    	var wiggle=Math.sin(i/numPoints*2+curTime/75)/50*wiggleSpeed;
        points[i].x = lerp(points[i].x, points[i+1].x+fishTex.width/numPoints*Math.cos(fish.a+wiggle), 1-(Math.abs(i-numPoints/2)/numPoints));
        points[i].y = lerp(points[i].y, points[i+1].y+fishTex.width/numPoints*Math.sin(fish.a+wiggle), 1-(Math.abs(i-numPoints/2)/numPoints));
    }



    // fishing line
    
    var fishingLinePointsCopy=[];
    for(var i = 0; i < fishingLine.segmentCount; ++i){
	    fishingLinePointsCopy.push({
	    	x:fishingLine.points[i].x,
	    	y:fishingLine.points[i].y,
	    	vx:fishingLine.points[i].vx,
	    	vy:fishingLine.points[i].vy
	    });
	}

    fishingLine.points[0].x=mouse.x;
    fishingLine.points[0].y=mouse.y;
    fishingLine.points[0].vx=0;
    fishingLine.points[0].vy=0;

    // rope
    for (var i = 1; i < fishingLine.segmentCount; ++i) {
    	var dx=fishingLinePointsCopy[i-1].x-fishingLine.points[i].x;
    	var dy=fishingLinePointsCopy[i-1].y-fishingLine.points[i].y;
    	var d=Math.sqrt(dx*dx+dy*dy);
    	dx/=d;
    	dy/=d;
    	d=(fishingLine.segmentLength-d)/2;
    	fishingLine.points[i].vx-=dx*d;
		fishingLine.points[i].vy-=dy*d;
    	fishingLine.points[i-1].vx+=dx*d;
		fishingLine.points[i-1].vy+=dy*d;
    }

    // fish collision
    var collisionDist=50;
    var collisionDist2=collisionDist*collisionDist;
    var collisionStrength=100;
    var closest=-1;
    var closestDist=999999999;
    for (var i = 0; i < fishingLine.segmentCount; ++i) {
    	var dx=fishingLinePointsCopy[i].x-fish.x;
    	var dy=fishingLinePointsCopy[i].y-fish.y;
    	var a=Math.atan2(dy,dx);
    	var d2=dx*dx+dy*dy;
    	if(d2 < collisionDist2){
    		var d=Math.sqrt(d2);

    		if(d < closestDist){
    			closestDist=d;
    			closest=i;
    		}

    		dx/=d;
    		dy/=d;
    		d=1-Math.sqrt(d2)/collisionDist;
    		fishingLine.points[i].vx+=Math.cos(a)*d*collisionStrength;
    		fishingLine.points[i].vy+=Math.sin(a)*d*collisionStrength;
    	}
    }

    // fish pickup line
    if(gamepads.isJustDown(gamepads.A)){
    	fish.grabbed=closest;
    }if(gamepads.isJustUp(gamepads.A)){
    	fish.grabbed=-1;
    }

    // gravity
    for (var i = 0; i < fishingLine.segmentCount; ++i) {
    	fishingLine.points[i].vy+=0.5;
    }
    fishingLine.points[fishingLine.segmentCount-1].vy+=1;

	// "integrate"
    for (var i = 1; i < fishingLine.segmentCount; ++i) {
    	fishingLine.points[i].vx*=0.9;
		fishingLine.points[i].vy*=0.9;

    	fishingLine.points[i].x+=fishingLine.points[i].vx;
		fishingLine.points[i].y+=fishingLine.points[i].vy;
    }

    // fish drag line
    if(gamepads.isDown(gamepads.A)){
    	if(fish.grabbed>=0){
    		fishingLine.points[fish.grabbed].x=fish.x - Math.cos(fish.a)*fishTex.width/3;
    		fishingLine.points[fish.grabbed].y=fish.y - Math.sin(fish.a)*fishTex.width/3;
    		fishingLine.points[fish.grabbed].vx=0;
    		fishingLine.points[fish.grabbed].vy=0;
    	}
    }

    hook.x=fishingLine.points[fishingLine.segmentCount-1].x;
    hook.y=fishingLine.points[fishingLine.segmentCount-1].y;
    hook.rotation=slerp(hook.rotation, Math.atan2(fishingLine.points[fishingLine.segmentCount-6].y-fishingLine.points[fishingLine.segmentCount-2].y, fishingLine.points[fishingLine.segmentCount-6].x-fishingLine.points[fishingLine.segmentCount-2].x)+Math.PI/2, 0.5);

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
	graphics.lineTo(fish.x+input.dx*40, fish.y+input.dy*40);


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