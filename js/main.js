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
	let clickSound = new Audio("resources/click.wav");
	let delay = 60 / (parseInt($("#tempo").val()));
	
	tick(clickSound, delay);
	let metrotimer = setInterval(function() {
		tick(clickSound, delay);
	}, delay * 1000);

	$("#start").click(function() {
		$("#start").off("click");
		$("#start").html("Start");
		clearInterval(metrotimer);
		$("#start").click(metronomeOnOff);
	});
}

$(document).ready(function() {
	let started = false;
	let firstTapDone = false;
	$("#start").click(metronomeOnOff);
});