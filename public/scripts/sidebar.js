function updateLists(querySnapshot){
    let items = querySnapshot.docs.map(doc => {
        return(doc.data().name ? `<li> ${doc.data().name} </li>` : " ")
    })
    items.reverse();
    document.getElementById("my-lists-container").innerHTML=items.join(' ');
}

window.addEventListener('load',() => {
    document.getElementById('add-list-btn').addEventListener('click', ()=>{
        listsRef.add({
            name: 'new list',
            public:false,
            [uid]: 'creator',
            lastOpened: firebase.firestore.FieldValue.serverTimestamp()
        })
    })
})

function clearLists(){
    document.getElementById('my-lists-container').innerHTML = "";
}
