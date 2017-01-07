var error, response, request;

function login(){
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var url = "http://10.200.1.75:8016/users/login?username="+username+"&password="+password
    request = d3.html(url).get(handleError, handleResponse);
    showLoaderAnimation();
}

function handleError(err){
    error = err;
    hideLoaderAnimation();
    showLoginError();
}

function handleResponse(res){
    response = res;
    console.log(res);
    hideLoaderAnimation();
    if (response != null) {
        console.log("success");
        setCookie("treeVisUser", res.textContent, 1);
        window.location.href = "patients.html";
    } else {
        showLoginError();
    }
}

function showLoginError(){
    console.log("error");
}

function showLoaderAnimation(){

}

function hideLoaderAnimation(){

}