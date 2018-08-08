//delay measured in seconds
const magicalDelay = 74; //delay between actual tick time and sound/animation


function tap(delay, startTime) {
	return function() {
		let deviation = (((new Date().getTime() - startTime - magicalDelay) % (delay * 1000)) / 1000).toPrecision(3);
		deviation = Math.round(((delay / 2 - deviation > 1e-4)  ? 
			deviation : (deviation - delay).toPrecision(3)) / delay * 200).toPrecision(2);
		
		if (Math.abs(deviation) > 60) {
			$("#stats").html("Fail");
		} else if (Math.abs(deviation) > 25) {
			$("#stats").html("Average");
		} else if (Math.abs(deviation) > 10) {
			$("#stats").html("Good");
		} else {
			$("#stats").html("Excellent");
		}

		if (deviation > 10) {
			$("#stats").css("color", "red");
		} else if (deviation < -10) {
			$("#stats").css("color", "blue");
		} else {
			$("#stats").css("color", "green");
		}
	}
}

function tick(sound, delay) {
	sound.play();
	$("#metroblock").css({
		"animation-duration" : "" + (delay - 0.05)  + "s"
	});
	$("#metroblock").toggleClass("metroblock-animated");
	setTimeout(function() {
		$("#metroblock").toggleClass("metroblock-animated");
		}, delay * 1000 - 50);
}

function metronomeOnOff() {
	$("#start").off("click");
	$("#start").html("Stop");
	$("#stats").html("");
	let clickSound = new Audio("resources/click.wav");
	let delay = 60 / (parseInt($("#tempo").val()));
	
	tick(clickSound, delay);
	let metrotimer = setInterval(function() {
		tick(clickSound, delay);
	}, delay * 1000);
	let startTime = new Date().getTime();
	$(document).keydown(tap(delay, startTime));


	$("#start").click(function() {
		$("#start").off("click");
		$(document).off("keydown");
		$("#start").html("Start");
		$("#stats").html("");
		clearInterval(metrotimer);
		$("#start").click(metronomeOnOff);
	});

}

$(document).ready(function() {
	let started = false;
	let firstTapDone = false;
	$("#start").click(metronomeOnOff);
});	