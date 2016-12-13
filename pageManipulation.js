function openSideNav(){
	document.getElementById("leftContainer").setAttribute('style', 'display:block');
	document.getElementById("openSideNav").style.display = "none";
	//path has to be updated after displaying the left container 
	//because otherwise text wrapping will not be done correctly
	updatePath();
}

function closeSideNav(){
	document.getElementById("leftContainer").setAttribute('style', 'display:none');
	document.getElementById("openSideNav").style.display = "block";
}