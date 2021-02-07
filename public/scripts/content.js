//you have to "unsubscribe" to these continously listening updates
var unsubscribeListView;
var unsubscribeCards;
function updateListView(id){
    //if unsubscribe exists, unsubscribe
    unsubscribeListView && unsubscribeListView();

    //gets data and changes the content
    unsubscribeListView = firestore.collection("lists").doc(id)
        .onSnapshot((doc) => {
            //header of the list thing
            document.querySelector("#content-list .content-header").innerHTML = doc.data().name;
            //header in the settings panel
            document.querySelector("#list-settings-panel h1").innerHTML = doc.data().name;
            //only shows the delete button if you are the creator, there isn't meant for security because people can change the css,
            //but only so that people don't really need to see something they can't press.
            if(doc.data().roles[uid] == "creator"){
                document.getElementById("list-delete-btn").style.display = "block"
            }else{
                document.getElementById("list-delete-btn").style.display = "none"
            }
        },(error) => {
            //does this when there is a error, probably because it was deleted and sets everything to placeholders
            document.querySelector("#content-list .content-header").innerHTML = "placeholder"
            document.querySelector("#list-settings-panel h1").innerHTML = "placeholder";
            console.error(error);
            //changes it back to welcome and refreshes the page
            window.history.pushState("","","/welcome");
            updateWindows();
        })
    unsubscribeCards = firestore.collection("lists").doc(id).collection("cards")
        .orderBy("word")
        .onSnapshot(updateCards);
}

function updateCards(querySnapshot){
    let items = querySnapshot.docs.map(doc =>{
        return(`<div class="card"><h3>${doc.data().word}</h3><hr><p>${doc.data().definition}</p></div>`)
    })
    document.getElementById("card-container").innerHTML = items.join("  ")
}

//gets the path of the url and updates the window layout
function updateWindows(){
    //splits the url into array; example: hello.com/abc/xyz becomes ["abc","xyz"]
    window.splitPath = window.location.pathname.split('/');
    //removes null stuff
    splitPath = splitPath.filter(element => {return element != null && element != ''})
    //checks if the url is a task, welcome, or if neither it sets it to welcome
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

//when to call updateWindows() function
window.addEventListener('popstate', updateWindows);
window.addEventListener('load', updateWindows);



window.addEventListener('load',()=>{
    //event listner for the button thata edits the list, and puts that data on firestore
    document.querySelector("#list-edit-btn").addEventListener('click',()=>{
        let newName = window.prompt("Rename List:");
        if(newName || newName ==""){
            firestore.collection("lists").doc(splitPath[1]).update(
                {
                    name: newName,
                }
            )
        }
    })
    //for deleting the list
    document.querySelector('#list-delete-btn').addEventListener('click',()=>{
        if(window.confirm("Delete this list?")){
            firestore.collection("lists").doc(splitPath[1]).delete()
            //hides the panel when you click delete so you don't need to click outside because it's useless now that you have delete the list
            let panelContainer = document.getElementById("panel-container");
            panelContainer.style.display = "none";
            for (let panel of panelContainer.children) {
                panel.style.display = "none";
            }
        }
    })
})
