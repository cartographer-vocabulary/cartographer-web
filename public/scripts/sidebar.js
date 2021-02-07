//supposed to be called in a querySnapshot, sorts and displays the lists on sidebar
function updateLists(querySnapshot){
    let sorted = querySnapshot.docs.sort((a,b)=>{
        return b.data().lastOpened.toMillis() - a.data().lastOpened.toMillis()
    })
    //convert array into html basically
    let items = sorted.map(doc => {
                                                //this part changes the url when you click and calles update window function in content.js
        return(doc.exists ? `<li onclick='firestore.collection("lists").doc("${doc.id}").update({lastOpened: firebase.firestore.FieldValue.serverTimestamp()});window.history.pushState("","","/list/${doc.id}");updateWindows()'> ${doc.data().name} </li>` : "  ")
    })
    document.getElementById("my-lists-container").innerHTML=items.join(' ');
}

//when window loads
window.addEventListener('load',() => {
    //event listener for when the add list button or plus is clicked
    document.getElementById('add-list-btn').addEventListener('click', ()=>{
        //see if this gives a error, if it does it's probably because
        //you are logged out and then shows you the log in screen
        try{
            //cause error if you don't have uid
            if(!uid){lmao}
            //prompt user to enter name of list
            let name = window.prompt("Enter name for list", "New List")
            if (name){
                //adds a document
                listsRef.add({
                    name: name,
                    public:false,
                    roles: {
                        [uid]: 'creator',
                    },
                    lastOpened: firebase.firestore.FieldValue.serverTimestamp()
                })
            }
        }catch{
            //shows sign in panel
            document.getElementById('panel-container').style.display = "flex";
            document.getElementById("sign-in-panel").style.display = "block";
        }
    })
    //hides and shows the sidebar
    document.getElementById('sidebar-toggle').addEventListener('click',()=>{
        let sidebar = document.getElementById('sidebar-container');
        if(sidebar.style.display != "none"){
            sidebar.style.display = "none";
        }else{
            sidebar.style.display = "block";
        }
    })
})

//remove lists from sidebar when signed out
function clearLists(){
    document.getElementById('my-lists-container').innerHTML = "";
}
