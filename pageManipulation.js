function openSideNav(){
	document.getElementById("leftContainer").setAttribute('style', 'display:block !important');
	document.getElementById("openSideNav").style.display = "none";
}

function closeSideNav(){
	document.getElementById("leftContainer").setAttribute('style', 'display:block');
	document.getElementById("openSideNav").style.display = "block";
}