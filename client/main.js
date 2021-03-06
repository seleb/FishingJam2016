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


	// screen background
	bgs=[];
	for(var i = 1; i <= 3; ++i){
		var bg = new PIXI.Sprite(PIXI.loader.resources["background_"+i.toString(10)].texture);
		bg.scale.x=bg.scale.y=2;
		bg.anchor.x=0.5;
		bg.anchor.y=0.5;
		bg.x=size.x/2;
		bg.y=size.y/2;
		world.addChild(bg);

		bgs.push(bg);
	}


	$(document).on("keydown",function(event){
		if(event.keyCode == keys.F){
			toggleFullscreen();
		}if(event.keyCode == keys.M){
			toggleMute();
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
		length:128,
		speedMult:1.4
	};
	fishies.segmentLength=fishies.length/fishies.segmentCount;
	fishies.innerCollision = fishies.length/6;
	fishies.outerCollision = fishies.length/4;
	fishies.innerCollision2 = fishies.innerCollision*fishies.innerCollision;
	fishies.outerCollision2 = fishies.outerCollision*fishies.outerCollision;
	

	fishingLines={
		a:[],
		segmentCount:24,
		segmentLength:16,
		collision:15,
		addTimer:0
	};
	fishingLines.collision2=fishingLines.collision*fishingLines.collision;


	menu_title = new PIXI.Sprite(PIXI.loader.resources.menu_title.texture);
	menu_title.anchor.x=0.5;
	menu_title.anchor.y=0.5;
	menu_title.x=size.x/2;
	menu_title.y=size.y/2;


	menu_joins=[];
	menu_joins[0] = new PIXI.Sprite(PIXI.loader.resources.join.texture);
	menu_joins[0].anchor.x=0.5;
	menu_joins[0].anchor.y=0.5;
	menu_joins[0].x=size.x/4;
	menu_joins[0].y=size.y/4+size.y/8;
	menu_joins[0].ty=menu_joins[0].y;

	menu_joins[1] = new PIXI.Sprite(PIXI.loader.resources.join.texture);
	menu_joins[1].anchor.x=0.5;
	menu_joins[1].anchor.y=0.5;
	menu_joins[1].x=size.x/4*3;
	menu_joins[1].y=size.y/4+size.y/8;
	menu_joins[1].ty=menu_joins[1].y;

	menu_joins[2] = new PIXI.Sprite(PIXI.loader.resources.join.texture);
	menu_joins[2].anchor.x=0.5;
	menu_joins[2].anchor.y=0.5;
	menu_joins[2].x=size.x/4;
	menu_joins[2].y=size.y/4*3+size.y/8;
	menu_joins[2].ty=menu_joins[2].y;

	menu_joins[3] = new PIXI.Sprite(PIXI.loader.resources.join.texture);
	menu_joins[3].anchor.x=0.5;
	menu_joins[3].anchor.y=0.5;
	menu_joins[3].x=size.x/4*3;
	menu_joins[3].y=size.y/4*3+size.y/8;
	menu_joins[3].ty=menu_joins[3].y;

	menu_restart = new PIXI.Sprite(PIXI.loader.resources.restart.texture);
	menu_restart.anchor.x=0.5;
	menu_restart.anchor.y=0.5;
	menu_restart.x=size.x/2;
	menu_restart.y=size.y/2+size.y/8;

	menu_player_wins = new PIXI.Sprite(PIXI.loader.resources.player_wins.texture);
	menu_player_wins.anchor.x=0.5;
	menu_player_wins.anchor.y=0.5;
	menu_player_wins.x=size.x/2;
	menu_player_wins.y=size.y/2;

	menu_tie = new PIXI.Sprite(PIXI.loader.resources.tie.texture);
	menu_tie.anchor.x=0.5;
	menu_tie.anchor.y=0.5;
	menu_tie.x=size.x/2;
	menu_tie.y=size.y/2;

	menu_player_wins_a=[];
	for(var i = 1; i <= 4; ++i){
		var p = new PIXI.Sprite(PIXI.loader.resources["player_wins_"+i.toString(10)].texture);
		p.anchor.x=0.5;
		p.anchor.y=0.5;
		p.x=size.x/2;
		p.y=size.y/2;
		menu_player_wins_a.push(p);
	}

	world.menu = new PIXI.Container();
	world.addChild(world.menu);

	// screen border
	border = new PIXI.Sprite(PIXI.loader.resources.border.texture);
	border.scale.x=2;
	border.scale.y=2;
	world.addChild(border);

	showMenu();

	// start the main loop
	window.onresize = onResize;
	_resize();
	main();
}


function showMenu(){
	for(var i = 0; i < fishies.a.length; ++i){
		var fish = fishies.a[i];
		world.fishies.removeChild(fish.strip);
		fish.strip.destroy();
	}
	fishies.a=[];

	for(var i = 0; i < fishingLines.a.length; ++i){
		var fishingLine = fishingLines.a[i];
		world.fishingLines.removeChild(fishingLine.strip);
		fishingLine.strip.destroy();
	}
	fishingLines.a=[];
	fishingLines.addTimer=0;

	gameStarted=false;

	world.menu.removeChild(menu_player_wins);
	world.menu.removeChild(menu_tie);
	world.menu.removeChild(menu_restart);
	for(var i = 0; i < 4; ++i){
		world.menu.removeChild(menu_player_wins_a[i]);
		menu_joins[i].texture = PIXI.loader.resources.join.texture;
		menu_joins[i].y=menu_joins[i].ty;
	}

	world.menu.addChild(menu_joins[0]);
	world.menu.addChild(menu_joins[1]);
	world.menu.addChild(menu_joins[2]);
	world.menu.addChild(menu_joins[3]);
	world.menu.addChild(menu_title);

	winStartTime=-1;
	hooked=0;
	winner=null;

	players_joined=[false,false,false,false];
	players_ready=[false,false,false,false];
	gameStarted=false;
}

function startGame(){
	gameStarted=true;
	for(var i = 0; i < 4; ++i){
		world.menu.removeChild(menu_joins[i]);
	}
	world.menu.removeChild(menu_title);
}

function update(){

	//////////////////////////
	// game logic goes here //
	//////////////////////////
	
	if(!gameStarted){
		updateMenu();
	}else{
		updateGame();
	}

	updateAlways();
	
	// update input managers
	keys.update();
	gamepads.update();
}


function updateMenu(){
	var ready=fishies.a.length>1;
	for(var i = 0; i < 4; ++i){
		var input = getInput(i);

		if(input.startedGrabbing){
			if(!players_joined[i]){
				players_joined[i]=true;
				addFish(i);
				menu_joins[i].texture=PIXI.loader.resources.ready.texture;
				menu_joins[i].y-=20;
				sounds["btn"].play();
			}else if(!players_ready[i]){
				players_ready[i]=true;
				menu_joins[i].texture=PIXI.loader.resources.waiting.texture;
				menu_joins[i].y-=20;
				sounds["btn"].play();
			}else{
				// idk you're just pressing buttons now
			}
		}

		if(players_joined[i] && !players_ready[i]){
			ready=false;
		}

		menu_joins[i].y = lerp(menu_joins[i].y, menu_joins[i].ty, 0.1);
	}

	if(ready){
		startGame();
	}
}

function updateGame(){
	--fishingLines.addTimer;
	if(winStartTime < 0 && fishingLines.addTimer<=0 && fishingLines.a.length < 128){
		addLine();
		fishingLines.addTimer=(Math.random()*500)/fishingLines.a.length+200;
	}

	// check for winner
	if(hooked >= fishies.a.length-1){
		if(winStartTime < 0){
			winStartTime = curTime;
			for(var i = 0; i < fishingLines.a.length; ++i){
				var fishingLine = fishingLines.a[i];
				fishingLine.y-=1000;
				fishingLine.ty = fishingLine.y;
			}
		}
	}

	if(winStartTime > 0 && curTime - winStartTime > 2000){
		if(winner==null){
			sounds["win"].play();
			if(hooked == fishies.a.length){
				winner="tie";
				world.menu.addChild(menu_tie);
			}else{
				for(var i = 0; i < fishies.a.length; ++i){
					if(fishies.a[i].caught==null){
						winner=fishies.a[i].id;
						world.menu.addChild(menu_player_wins);
						world.menu.addChild(menu_player_wins_a[winner]);
						break;
					}
				}
			}

			world.menu.addChild(menu_restart);
		}else{
			var reset=false;
			for(var i = 0; i < fishies.a.length; ++i){
				if(getInput(i).startedGrabbing){
					reset=true;
					break;
				}
			}

			if(reset){
				showMenu();
				sounds["btn"].play();
			}
		}
	}
}


function updateAlways(){

	menu_title.rotation = Math.sin(curTime/1000)/20;
	menu_title.y=size.y/2 + Math.sin(curTime/2000)*5;
	menu_title.x=size.x/2 + Math.sin(curTime/3000)*5;


	var avg={
		x:0,
		y:0
	};

	// fish update
	for(var f = 0; f < fishies.a.length; ++f){
		var fish=fishies.a[f];

		if(fish.caught==null){
			avg.x+=fish.x;
			avg.y+=fish.y;

			fish.input=getInput(fish.id);

			fish.speed.x+=fish.input.dx*fishies.speedMult;
			fish.speed.y+=fish.input.dy*fishies.speedMult;

			// damping
			fish.speed.x*=0.9;
			fish.speed.y*=0.9;


			// keep fish within bounds
			// (if past boundaries, push with force proportional to distance)
			if(fish.x < 50){
				fish.speed.x+=(50-fish.x)/10;
			}else if(fish.x > size.x-50){
				fish.speed.x-=(50-(size.x-fish.x))/10;
			}

			if(fish.y < 50){
				fish.speed.y+=(50-fish.y)/10;
			}else if(fish.y > size.y-50){
				fish.speed.y-=(50-(size.y-fish.y))/10;
			}



	    }else{
			avg.x+=size.x/2;
			avg.y+=size.y/2;

	    	var p=fish.caught.contact.toGlobal(PIXI.zero);
	    	fish.speed.x=p.x-fish.x;
	    	fish.speed.y=p.y-fish.y;
	    }
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
    if(fishies.a.length > 0){
	    avg.x/=fishies.a.length;
		avg.y/=fishies.a.length;
	}

	avg.x=clamp(size.x/4,avg.x,size.x/4*3);
	avg.y=clamp(size.y/4,avg.y,size.y/4*3);

    // background update
    for(var i = 3; i > 0; --i){
	    avg.x=lerp(avg.x,size.x/2,0.5);
	    avg.y=lerp(avg.y,size.y/2,0.5);

	    var bg=bgs[i-1];
	    bg.x=lerp(bg.x,avg.x,0.04);
	    bg.y=lerp(bg.y,avg.y,0.04);
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
		if(fish1.caught!=null){
			continue;
		}
		for(var b = a+1; b < fishies.a.length; ++b){
			var fish2=fishies.a[b];
			if(fish2.caught!=null){
				continue;
			}
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
				kick(10);
				sounds["bump"].play();
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

		if(fishingLine.caught==null){
			if(Math.abs(fishingLine.y-fishingLine.ty) > 5){
				fishingLine.y+=Math.sign(fishingLine.ty-fishingLine.y)*5;
			}
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
		    	if(i!=0 && d2 < fishies.outerCollision2){
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
		    if(fishingLine.caught==null && fish.caught==null){
			    if(fish.input.startedGrabbing && closest >= 0){
			    	fish.grabbed={
			    		line:l,
			    		segment:closest
			    	};
			    	sounds["grab"].play();
			    	addPop(fishingLine.points[closest].x,fishingLine.points[closest].y,fishies.outerCollision);
			    }if(fish.input.stoppedGrabbing){
			    	if(fish.grabbed!=null){
			    		sounds["release"].play();
			    		fish.grabbed=null;
			    	}
			    }

			    // fish drag line
			    if(fish.input.grabbing){
			    	if(fish.grabbed!=null && fish.grabbed.line==l){
			    		fishingLine.points[fish.grabbed.segment].x=fish.x - Math.cos(fish.a)*fishies.outerCollision;
			    		fishingLine.points[fish.grabbed.segment].y=fish.y - Math.sin(fish.a)*fishies.outerCollision;
			    		fishingLine.points[fish.grabbed.segment].vx=0;
			    		fishingLine.points[fish.grabbed.segment].vy=0;
			    	}
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
				hook(fishingLine,fish);
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
}

function render(){
	renderer.render(scene,null,true,false);
}





function addFish(_id){
	var fish={
		id:_id,
		x:0,
	 	y:0,
	 	a:0,
	 	bubbleTimer:0,
	 	caught:null
	};
	switch(_id){
		case 0:
			fish.x=size.x/4;
			fish.y=size.y/4;
			break;
		case 1:
			fish.x=size.x/4*3;
			fish.y=size.y/4;
			break;
		case 2:
			fish.x=size.x/4;
			fish.y=size.y/4*3;
			break;
		case 3:
			fish.x=size.x/4*3;
			fish.y=size.y/4*3;
			break;
	}

	fish.tex=PIXI.loader.resources["fish_"+(_id+1).toString(10)].texture;
	fish.points=[];
	fish.speed={x:0,y:0};
	
	for(var i = 0; i < fishies.segmentCount; i++){
	    fish.points.push(new PIXI.Point(fish.x+i * fishies.segmentLength, fish.y));
	}
	fish.strip = new PIXI.mesh.Rope(fish.tex, fish.points);

	if(debugDraw){
		fish.debugGraphics = new PIXI.Graphics();
		fish.strip.addChild(fish.debugGraphics);
	}

	world.fishies.addChild(fish.strip);

	fishies.a.push(fish);
}

function getInput(_id){
	var input={
		dx: gamepads.getAxis(gamepads.LSTICK_H,_id),
		dy: gamepads.getAxis(gamepads.LSTICK_V,_id),
		grabbing: gamepads.isDown(gamepads.A,_id) || gamepads.isDown(gamepads.B,_id) || gamepads.isDown(gamepads.X,_id) || gamepads.isDown(gamepads.Y,_id),
		startedGrabbing: gamepads.isJustDown(gamepads.A,_id) || gamepads.isJustDown(gamepads.B,_id) || gamepads.isJustDown(gamepads.X,_id) || gamepads.isJustDown(gamepads.Y,_id),
		stoppedGrabbing: gamepads.isJustUp(gamepads.A,_id) || gamepads.isJustUp(gamepads.B,_id) || gamepads.isJustUp(gamepads.X,_id) || gamepads.isJustUp(gamepads.Y,_id)
	};

	if(gamepads.isDown(gamepads.DPAD_DOWN,_id)){
		input.dy += 1;
	}if(gamepads.isDown(gamepads.DPAD_UP,_id)){
		input.dy -= 1;
	}if(gamepads.isDown(gamepads.DPAD_RIGHT,_id)){
		input.dx += 1;
	}if(gamepads.isDown(gamepads.DPAD_LEFT,_id)){
		input.dx -= 1;
	}

	switch(_id){
		case 0:
			if(keys.isDown(keys.W)){
				input.dy-=1;	
			}if(keys.isDown(keys.A)){
				input.dx-=1;	
			}if(keys.isDown(keys.S)){
				input.dy+=1;	
			}if(keys.isDown(keys.D)){
				input.dx+=1;	
			}
			input.grabbing|=keys.isDown(keys.E);
			input.startedGrabbing|=keys.isJustDown(keys.E);
			input.stoppedGrabbing|=keys.isJustUp(keys.E);
			break;
		case 1:
			if(keys.isDown(keys.I)){
				input.dy-=1;	
			}if(keys.isDown(keys.J)){
				input.dx-=1;	
			}if(keys.isDown(keys.K)){
				input.dy+=1;	
			}if(keys.isDown(keys.L)){
				input.dx+=1;	
			}
			input.grabbing|=keys.isDown(keys.O);
			input.startedGrabbing|=keys.isJustDown(keys.O);
			input.stoppedGrabbing|=keys.isJustUp(keys.O);
			break;
		default:
			break;
	}


	// make sure using keyboard and gamepad doesn't double speed
	input.dx=clamp(-1,input.dx,1);
	input.dy=clamp(-1,input.dy,1);

	// grabbing state sanity check (might be conflicted from keyboard and gamepad)
	if(input.stoppedGrabbing){
		input.grabbing=input.startedGrabbing=false;
	}

	return input;
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
	sounds["drop"].play();
	var fishingLine={
		points:[],
		x:size.x/8*7*Math.random()+size.x/16,
		y:-500-Math.random()*300,
		ty:-Math.random()*500,
		caught:null
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
	    	fishingLine.x,
	    	fishingLine.y+i*fishingLines.segmentLength));
		fishingLine.points[i].vx=0;
		fishingLine.points[i].vy=0;
	}
	fishingLine.strip=new PIXI.mesh.Rope(PIXI.loader.resources.line.texture, fishingLine.points);
	world.fishingLines.addChild(fishingLine.strip);
	fishingLine.strip.addChild(fishingLine.hook);

	fishingLines.a.push(fishingLine);

	return fishingLine;
}

function hook(_line,_fish){
	if(_line.caught == null && _fish.caught == null){
		_fish.caught=_line;
		_line.caught=_fish;
		_line.y-=10000;
		kick(50);
		addLine(); // add another line to compensate for this one going away
		hooked += 1;
		sounds["catch"].play();
	}
}

function kick(_amt){
	var a = Math.random()*Math.PI*2;
	for(var i = 0; i < bgs.length; ++i){
		bgs[i].x+=Math.cos(a)*_amt;
		bgs[i].y+=Math.sin(a)*_amt;
	}
}