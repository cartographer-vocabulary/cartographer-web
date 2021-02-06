var unsubscribeListView;
function updateListView(id){
    unsubscribeListView && unsubscribeListView();
    unsubscribeListView = firestore.collection("lists").doc(id)
        .onSnapshot((doc) => {
            document.querySelector("#content-list .content-header").innerHTML = doc.data().name;
        },(error) => {
            document.querySelector("#content-list .content-header").innerHTML = "placeholder"
            console.error(error);
            window.history.pushState("","","/welcome");
            updateWindows();
        })
}

function updateWindows(){
    let splitPath = window.location.pathname.split('/');
    splitPath = splitPath.filter(element => {return element != null && element != ''})
    console.log(splitPath);
    if(splitPath[0] == "list" && splitPath[1]){
        document.getElementById("content-list").style.display = "block";
        document.getElementById("content-welcome").style.display = "none";
        updateListView(splitPath[1]);
    }else if(splitPath[0] == "welcome"){
        document.getElementById("content-list").style.display = "none";
        document.getElementById("content-welcome").style.display = "block";
    }else{
        window.history.pushState("","","/welcome");
        updateWindows();
    }
}

window.addEventListener('popstate', updateWindows);
window.addEventListener('load', updateWindows);
