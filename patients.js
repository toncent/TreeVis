var userCookie;
var patients;
var graphs;
var patientListItems, graphListItems;
var currentTab = "patients-tab";

function init(){
  //retrieve the contents of the user cookie that was set in login.js
  if(getCookie("treeVisUser")){
    userCookie = JSON.parse(getCookie("treeVisUser"));
  } else {
    //window.location.href = "login.html";
    //return;
  }
  //load patients and graphs from server
  loadData();
}

function loadData(){
  d3.json("http://ec2-52-59-228-237.eu-central-1.compute.amazonaws.com:8016/graphs/all-trees").get(null, fillGraphList);
}

function fillGraphList(arr){
  graphs = arr.filter(graph => {return graph.graphName.toLowerCase() != "hcc"});
  document.getElementById("loader-container").style.display = "none";
  graphListItems = d3.select("ul#graph-list").selectAll("li").data(graphs);
  graphListItems = graphListItems.enter().append("li").classed("w3-padding-16 w3-hover-blue", true).style("cursor", "pointer");
  graphListItems.append("span").classed("w3-xlarge", true).text(getItemName);
  graphListItems.on("click", graphListItemClicked);
}

function getItemName(item){
  return item.graphName || item.firstname + " " + item.lastname;
}

function graphListItemClicked(graph){
  setCookie("treeVisGraph", graph.graphDBId, 1);
  window.location.href = "treeVis.html"
}