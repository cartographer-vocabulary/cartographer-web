function updateLists(querySnapshot){
    let sorted = querySnapshot.docs.sort((a,b)=>{
        return b.data().lastOpened.toMillis() - a.data().lastOpened.toMillis()
    })
    let items = sorted.map(doc => {
        return(doc.data().name ? `<li onclick='window.history.pushState("","","/list/${doc.id}");updateWindows()'> ${doc.data().name} </li>` : "  ")
    })
    document.getElementById("my-lists-container").innerHTML=items.join(' ');
}

window.addEventListener('load',() => {
    document.getElementById('add-list-btn').addEventListener('click', ()=>{
        try{
            let name = window.prompt("Enter name for list", "New List")
            listsRef.add({
                name: name,
                public:false,
                roles: {
                    [uid]: 'creator',
                },
                lastOpened: firebase.firestore.FieldValue.serverTimestamp()
            })
        }catch{
            document.getElementById('panel-container').style.display = "flex";
            document.getElementById("sign-in-panel").style.display = "block";
        }
    })
    document.getElementById('sidebar-toggle').addEventListener('click',()=>{
        let sidebar = document.getElementById('sidebar-container');
        if(sidebar.style.display != "none"){
            sidebar.style.display = "none";
        }else{
            sidebar.style.display = "block";
        }
    })
})

function clearLists(){
    document.getElementById('my-lists-container').innerHTML = "";
}
