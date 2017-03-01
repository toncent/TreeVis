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
  }
  //load patients and graphs from server
  loadData();
}

function loadData(){
  //request all patients
  d3.json("http://10.200.1.75:8016/patients/all").get(null, fillPatientList);
  d3.json("http://10.200.1.75:8016/graphs/all-trees").get(null, fillGraphList);
}

function fillPatientList(arr){
  patients = arr;
  document.getElementById("loader-container").style.display = "none";
  patientListItems = d3.select("ul#patient-list").selectAll("li").data(patients);
  patientListItems = patientListItems.enter().append("li").classed("w3-padding-16 w3-hover-blue", true).style("cursor", "pointer");
  patientListItems.append("span").classed("w3-xlarge", true).text(getItemName);
  patientListItems.append("br");
  patientListItems.append("span").text(getPatientDateOfBirth);
  patientListItems.on("click", patientListItemClicked);
}

function fillGraphList(arr){
  graphs = arr;
  graphListItems = d3.select("ul#graph-list").selectAll("li").data(graphs);
  graphListItems = graphListItems.enter().append("li").classed("w3-padding-16 w3-hover-blue", true).style("cursor", "pointer");
  graphListItems.append("span").classed("w3-xlarge", true).text(getItemName);
  graphListItems.on("click", graphListItemClicked);
}

function getItemName(item){
  return item.graphName || item.firstname + " " + item.lastname;
}

function getPatientDateOfBirth(patient){
  return new Date(patient.dateOfBirth / 10000000).toDateString();
}

function patientListItemClicked(patient){
  setCookie("treeVisPatient", patient.id, 1);
  openTab("diagnosis-tab");
}

function graphListItemClicked(graph){
  setCookie("treeVisGraph", graph.graphDBId, 1);
  window.location.href = "treeVis.html"
}

function openTab(tabId){
  if (tabId != currentTab) {
    document.getElementById(currentTab).style.display = "none";
    document.getElementById(tabId).style.display = "flex";
    d3.select("a#"+tabId+"-link").classed("w3-blue", true);
    d3.select("a#"+currentTab+"-link").classed("w3-blue", false);
    currentTab = tabId;
  }
}