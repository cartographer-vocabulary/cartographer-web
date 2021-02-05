console.log("hello")
function updateLists(querySnapshot){
    let sorted = querySnapshot.docs.sort((a,b)=>{
        return b.data().lastOpened.toMillis() - a.data().lastOpened.toMillis()
    })
    let items = sorted.map(doc => {
        console.log()
        return(doc.data().name ? `<li> ${doc.data().name} </li>` : "  ")
    })
    document.getElementById("my-lists-container").innerHTML=items.join(' ');
}

window.addEventListener('load',() => {
    document.getElementById('add-list-btn').addEventListener('click', ()=>{
        try{
            listsRef.add({
                name: 'new list',
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
})

function clearLists(){
    document.getElementById('my-lists-container').innerHTML = "";
}
