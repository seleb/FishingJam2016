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



	bubbles=[];
	world.bubbles=new PIXI.Container();
	world.addChild(world.bubbles);
	world.fishingLines=new PIXI.Container();
	world.addChild(world.fishingLines);
	world.fishies=new PIXI.Container();
	world.addChild(world.fishies);


	// fish setup
	
	fishies={
		a:[],
		segmentCount:16,
		length:128
	};
	fishies.segmentLength=fishies.length/fishies.segmentCount;
	fishies.innerCollision = fishies.length/5;
	fishies.outerCollision = fishies.length/3;
	fishies.innerCollision2 = fishies.innerCollision*fishies.innerCollision;
	fishies.outerCollision2 = fishies.outerCollision*fishies.outerCollision;
	
	addFish();
	addFish();

	fishies.a[0].x=size[0]/3;
	fishies.a[1].x=size[0]/3*2;
	fishies.a[0].y=size[1]/2;
	fishies.a[1].y=size[1]/2;


	fishingLines={
		a:[],
		segmentCount:20,
		segmentLength:15,
		collision:15
	};
	fishingLines.collision2=fishingLines.collision*fishingLines.collision;

	addLine();
	addLine();



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
	
	// fish update
	for(var f = 0; f < fishies.a.length; ++f){
		var fish=fishies.a[f];

		fish.input={
			dx:gamepads.getAxis(f*2),
			dy:gamepads.getAxis(f*2+1)
		};

		fish.speed.x+=fish.input.dx*1.4;
		fish.speed.y+=fish.input.dy*1.4;

		fish.speed.x*=0.9;
		fish.speed.y*=0.9;

	    // fish
	    fish.a=slerp(fish.a,Math.atan2(fish.speed.y,fish.speed.x)+Math.PI,0.5);

	    fish.x+=fish.speed.x;
	    fish.y+=fish.speed.y;

	    fish.points[fishies.segmentCount-1].x=lerp(fish.points[fishies.segmentCount-1].x, fish.x-fishies.length/3*Math.cos(fish.a), 0.9);
	    fish.points[fishies.segmentCount-1].y=lerp(fish.points[fishies.segmentCount-1].y, fish.y-fishies.length/3*Math.sin(fish.a), 0.9);


	    for (var i = fishies.segmentCount-2; i >= 0; --i) {
	    	var wiggleSpeed=Math.abs(fish.speed.x)+Math.abs(fish.speed.y)+0.5;
	    	var wiggle=Math.sin(i/fishies.segmentCount*2+curTime/75)/50*wiggleSpeed;
	        fish.points[i].x = lerp(fish.points[i].x, fish.points[i+1].x+fishies.length/fishies.segmentCount*Math.cos(fish.a+wiggle), 1-(Math.abs(i-fishies.segmentCount/2)/fishies.segmentCount));
	        fish.points[i].y = lerp(fish.points[i].y, fish.points[i+1].y+fishies.length/fishies.segmentCount*Math.sin(fish.a+wiggle), 1-(Math.abs(i-fishies.segmentCount/2)/fishies.segmentCount));
	    }

	    if(fish.bubbleTimer <= 0){
		    fish.bubbleTimer=Math.random()*150+25;
	    	var bubble=addBubble(
	    		fish.x+Math.random()*fishies.length/3-fishies.length/6,
	    		fish.y+Math.random()*fishies.length/3-fishies.length/6,
	    		Math.random(5)+5,
	    		Math.random()*50+50);
	    	bubble.vx=fish.speed.x/4;
	    	bubble.vy=fish.speed.y/4;
		}else{
			fish.bubbleTimer-=Math.max(1, Math.abs(fish.speed.x)+Math.abs(fish.speed.y));
		}
    }

    // bubbles update
    for(var i = bubbles.length-1; i >=0; --i){
    	var b=bubbles[i];
    	b.age+=1;
    	b.vy-=0.05;
    	b.vx+=Math.sin(curTime/b.life)/50;
    	b.vx*=0.95;
    	b.vy*=0.95;
    	b.y+=b.vy;
    	b.x+=b.vx;

    	if(b.age < b.life){
	    	b.scale.x=easeOutCubic(b.age/b.life);
	    	b.scale.y=easeOutCubic(b.age/b.life);
	    }else{
	    	b.scale.x=easeInCubic(2-b.age/b.life);
	    	b.scale.y=easeInCubic(2-b.age/b.life);
	    }
    	if(b.y < -20 || b.age > b.life*2){
    		bubbles.splice(i,1);
    		world.bubbles.removeChild(b);
    		b.destroy();
    	}
    }

    // fish collision with fish
    
    for(var a = 0; a < fishies.a.length; ++a){
		var fish1=fishies.a[a];
		for(var b = a+1; b < fishies.a.length; ++b){
			var fish2=fishies.a[b];

			var dx=fish2.x-fish1.x;
			var dy=fish2.y-fish1.y;
			var d2=dx*dx+dy*dy;

			if(d2 < fishies.innerCollision2*4){
				var angle=Math.atan2(dy,dx);
				var x=fish1.speed.x;
				var y=fish1.speed.y;

				fish1.speed.x+=fish2.speed.x*0.75;
				fish1.speed.y+=fish2.speed.y*0.75;
				fish2.speed.x+=x*0.75;
				fish2.speed.y+=y*0.75;

				fish1.speed.x-=Math.cos(angle)*15;
				fish1.speed.y-=Math.sin(angle)*15;
				fish2.speed.x+=Math.cos(angle)*15;
				fish2.speed.y+=Math.sin(angle)*15;

				addPop((fish1.x+fish2.x)/2, (fish1.y+fish2.y)/2, fishies.innerCollision);
			}
	    }
    }

    // fishing line
    for(var l = 0; l < fishingLines.a.length; ++l){
    	var fishingLine = fishingLines.a[l];
	    var fishingLinePointsCopy=[];
	    for(var i = 0; i < fishingLines.segmentCount; ++i){
		    fishingLinePointsCopy.push({
		    	x:fishingLine.points[i].x,
		    	y:fishingLine.points[i].y,
		    	vx:fishingLine.points[i].vx,
		    	vy:fishingLine.points[i].vy
		    });
		}

	    fishingLine.points[0].x=fishingLine.x;
	    fishingLine.points[0].y=fishingLine.y;
	    fishingLine.points[0].vx=0;
	    fishingLine.points[0].vy=0;

	    // rope
	    for (var i = 1; i < fishingLines.segmentCount; ++i) {
	    	var dx=fishingLinePointsCopy[i-1].x-fishingLine.points[i].x;
	    	var dy=fishingLinePointsCopy[i-1].y-fishingLine.points[i].y;
	    	var d=Math.sqrt(dx*dx+dy*dy);
	    	dx/=d;
	    	dy/=d;
	    	d=(fishingLines.segmentLength-d)/2;
	    	fishingLine.points[i].vx-=dx*d;
			fishingLine.points[i].vy-=dy*d;
	    	fishingLine.points[i-1].vx+=dx*d;
			fishingLine.points[i-1].vy+=dy*d;
	    }

	    // gravity + sway
	    for (var i = 0; i < fishingLines.segmentCount; ++i) {
	    	fishingLine.points[i].vy+=0.5;
	    	fishingLine.points[i].vx+=Math.sin(curTime/3333+curTime/1000+fishingLine.points[i].y/100+l)/20;
	    }
	    fishingLine.points[fishingLines.segmentCount-1].vy+=1;


	    for(var f = 0; f < fishies.a.length; ++f){
	    	var fish=fishies.a[f];
		    // fish collision with line
		    var collisionStrength=50;
		    var closest=-1;
		    var closestDist=999999999;
		    for (var i = 0; i < fishingLines.segmentCount; ++i) {
		    	var dx=fishingLinePointsCopy[i].x-fish.x;
		    	var dy=fishingLinePointsCopy[i].y-fish.y;
		    	var a=Math.atan2(dy,dx);
		    	var d2=dx*dx+dy*dy;
		    	if(d2 < fishies.outerCollision2){
		    		var d=Math.sqrt(d2);

		    		if(d < closestDist){

		    			// check if segment is taken
		    			var taken=false;
	    				for(var j = 0; j < fishies.a.length; ++j){
	    					if(fishies.a[j].grabbed!=null && l==fishies.a[j].grabbed.line && i==fishies.a[j].grabbed.segment){
	    						taken=true;
	    						break;
							}
	    				}

	    				if(!taken){
	    					// save closest segment
			    			closestDist=d;
			    			closest=i;
		    			}
		    		}

		    		dx/=d;
		    		dy/=d;
		    		d=1-Math.sqrt(d2)/fishies.outerCollision;
		    		if(fishingLines.segmentCount-i < 5){
		    			d*=Math.max(0, (fishingLines.segmentCount-i-2)/5);
		    		}
		    		fishingLine.points[i].vx+=Math.cos(a)*d*collisionStrength;
		    		fishingLine.points[i].vy+=Math.sin(a)*d*collisionStrength;
		    	}
		    }

		    // fish pickup line
		    if(gamepads.isJustDown(gamepads.A+f) && closest >= 0){
		    	fish.grabbed={
		    		line:l,
		    		segment:closest
		    	};
		    }if(gamepads.isJustUp(gamepads.A+f)){
		    	fish.grabbed=null;
		    }

		    // fish drag line
		    if(gamepads.isDown(gamepads.A+f)){
		    	if(fish.grabbed!=null && fish.grabbed.line==l){
		    		fishingLine.points[fish.grabbed.segment].x=fish.x - Math.cos(fish.a)*fishies.length/3;
		    		fishingLine.points[fish.grabbed.segment].y=fish.y - Math.sin(fish.a)*fishies.length/3;
		    		fishingLine.points[fish.grabbed.segment].vx=0;
		    		fishingLine.points[fish.grabbed.segment].vy=0;
		    	}
		    }
		}


		

		// "integrate" fishing line
	    for (var i = 1; i < fishingLines.segmentCount; ++i) {
	    	fishingLine.points[i].vx*=0.9;
			fishingLine.points[i].vy*=0.9;

	    	fishingLine.points[i].x+=fishingLine.points[i].vx;
			fishingLine.points[i].y+=fishingLine.points[i].vy;
	    }

	    // update hook
	    fishingLine.hook.x=fishingLine.points[fishingLines.segmentCount-1].x;
	    fishingLine.hook.y=fishingLine.points[fishingLines.segmentCount-1].y;
	    fishingLine.hook.rotation=slerp(fishingLine.hook.rotation, Math.atan2(fishingLine.points[fishingLines.segmentCount-6].y-fishingLine.points[fishingLines.segmentCount-2].y, fishingLine.points[fishingLines.segmentCount-6].x-fishingLine.points[fishingLines.segmentCount-2].x)+Math.PI/2, 0.5);


	    // fish collision with hook
		for(var f = 0; f < fishies.a.length; ++f){
			var fish=fishies.a[f];

			var p=fishingLine.contact.toGlobal(PIXI.zero);
			var dx=p.x-fish.x;
			var dy=p.y-fish.y;
			var d2=Math.sqrt(dx*dx+dy*dy);

			if(d2 < fishies.innerCollision+fishingLines.collision){
				addPop((fish.x+p.x)/2, (fish.y+p.y)/2, fishies.innerCollision);
			}
		}
	}

    if(debugDraw){
    	// fish debug
	    for(var f = 0; f < fishies.a.length; ++f){
	    	var fish=fishies.a[f];
		    var g=fish.debugGraphics;
		    g.x=fish.x;
		    g.y=fish.y;
		    g.clear();
			g.beginFill(0x000000);
			g.drawCircle(0,0,5);
			g.endFill();
			g.lineStyle(6,0x00FF00);
			g.moveTo(0,0);
			g.lineTo(0+fish.speed.x*5, 0+fish.speed.y*5);
			g.lineStyle(3,0xFF0000);
			g.moveTo(0,0);
			g.lineTo(0+fish.input.dx*40, 0+fish.input.dy*40);
			g.beginFill(0,0);
			g.lineStyle(2, 0xCC4499);
			g.drawCircle(0,0,fishies.outerCollision);
			g.drawCircle(0,0,fishies.innerCollision);
			g.endFill();
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





function addFish(){
	var fish={
		x:0,
	 	y:0,
	 	a:0,
	 	bubbleTimer:0
	};
	fish.tex=PIXI.loader.resources["fish_"+(fishies.a.length+1).toString(10)].texture;
	fish.points=[];
	fish.speed={x:0,y:0};
	
	for(var i = 0; i < fishies.segmentCount; i++){
	    fish.points.push(new PIXI.Point(i * fishies.segmentLength, 0));
	}
	fish.strip = new PIXI.mesh.Rope(fish.tex, fish.points);

	if(debugDraw){
		fish.debugGraphics = new PIXI.Graphics();
		fish.strip.addChild(fish.debugGraphics);
	}

	world.fishies.addChild(fish.strip);

	fishies.a.push(fish);
}

function addBubble(_x,_y,_r,_life){
	var bubble = new PIXI.Sprite(PIXI.loader.resources.bubble.texture);
	bubble.anchor.x=0.5;
	bubble.anchor.y=0.5;
	bubble.x=_x;
	bubble.y=_y;
	bubble.scale.x=0;
	bubble.scale.y=0;
	bubble.age=0;
	bubble.life=_life;
	world.bubbles.addChild(bubble);
	bubbles.push(bubble);

	return bubble;
}

function addPop(_x,_y,_r){
	for(var i = Math.random()*0.3; i < Math.PI*2; i+=Math.random()*2+0.5){
    	var bubble=addBubble(
    		_x+(Math.random()*_r/2-_r/2)*Math.cos(i),
    		_y+(Math.random()*_r/2-_r/2)*Math.sin(i),
    		Math.random(5)+5,
    		Math.random()*10+10);
    	bubble.vx=(Math.random()*5+5)*Math.cos(i);
    	bubble.vy=(Math.random()*5+5)*Math.sin(i);
	}
}

function addLine(){
	var x=size[0]*Math.random();

	var fishingLine={
		points:[],
		x:x,
		y:0
	};

	fishingLine.hook = new PIXI.Sprite(PIXI.loader.resources.hook.texture);
	fishingLine.hook.anchor.x=0.5;
	fishingLine.hook.anchor.y=0.25;

	fishingLine.contact = new PIXI.Graphics();
	if(debugDraw){
		fishingLine.contact.lineStyle(2, 0xCC4499);
		fishingLine.contact.drawCircle(0,0,fishingLines.collision);
		fishingLine.contact.endFill();
	}
	fishingLine.contact.x=-21;
	fishingLine.contact.y=20;
	fishingLine.hook.addChild(fishingLine.contact);


	
	for (var i = 0; i < fishingLines.segmentCount; i++){
	    fishingLine.points.push(new PIXI.Point(
	    	x,
	    	i*fishingLines.segmentLength));
		fishingLine.points[i].vx=0;
		fishingLine.points[i].vy=0;
	}
	fishingLine.strip=new PIXI.mesh.Rope(PIXI.loader.resources.line.texture, fishingLine.points);
	world.fishingLines.addChild(fishingLine.strip);
	fishingLine.strip.addChild(fishingLine.hook);

	fishingLines.a.push(fishingLine);

	return fishingLine;
}