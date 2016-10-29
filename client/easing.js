// adapted from S-Tengine2 source, which was in turn adapted from Robert Penner easing equations

function easeInCubic(t){
	return t*t*t;
}

function easeOutCubic(t){
	return ((t=t-1)*t*t + 1);
}

function easeInOutCubic(t){
	if ((t /= 0.5) < 1) {
		return 0.5*t*t*t;
	}
	return 0.5*((t-=2)*t*t + 2);
}