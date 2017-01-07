var userCookie;
var patients;
var listItems;

function init(){
  //retrieve the contents of the user cookie that was set in login.js
  if(getCookie("treeVisUser")){
    userCookie = JSON.parse(getCookie("treeVisUser"));
  }
  //load patients from server
  loadPatients();
}

//returns the content of the cookie with the provided name (taken from w3schools)
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function loadPatients(){
  //request all patients
  d3.json("http://10.200.1.75:8016/patients/all").get(null, createPatientList);
}

/*function createPatientList(arr){
  document.getElementById("loader-container").style.display = "none";
  patients = arr;
  console.log(patients);
  var patientList = document.getElementById("patient-list");
  var innerHTML = "";
  for (var i = 0; i < patients.length; i++) {
    innerHTML += "<li class=\"w3-padding-16 w3-hover-blue\">" +
                        "<span class=\"w3-xlarge\">" + patients[i].firstname + " " + patients[i].lastname + "</span><br>" +
                        "<span>" + "Geboren: " + convertToDate(patients[i].dateOfBirth) + "</span>" +
                      "</li>";
  };
  patientList.innerHTML += innerHTML;
}*/

function createPatientList(arr){
  patients = arr;
  document.getElementById("loader-container").style.display = "none";
  listItems = d3.select("ul").selectAll("li").data(patients);
  listItems = listItems.enter().append("li").classed("w3-padding-16 w3-hover-blue", true);
  listItems.append("span").classed("w3-xlarge", true).text(getPatientName);
  listItems.append("br");
  listItems.append("span").text(getPatientDateOfBirth);
}

function getPatientName(patient){
  return patient.firstname + " " + patient.lastname;
}

function getPatientDateOfBirth(patient){
  return "01.01.2000"
}