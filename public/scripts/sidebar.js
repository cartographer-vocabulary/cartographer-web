//supposed to be called in a querySnapshot, sorts and displays the lists on sidebar
function updateLists(querySnapshot){
    let filtered = querySnapshot.docs
    filtered = filtered.filter(item => {
        return((!item.data().folder) || item.data().folder == "")
    })
    //convert array into html basically
    let items = filtered.sort((a,b)=>{return((a.data().name.toLowerCase() < b.data().name.toLowerCase()) ? -1 : 1)}).sort((a,b)=>{return((a.data().roles[uid] < b.data().roles[uid])? -1 : 1)}).map(doc => {
        //this part changes the url when you click and calls update window function in content.js
        return(doc.exists ? `
            <li onclick='window.history.pushState("","","/list/${doc.id}");updateWindows()'>
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-list" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="var(--foreground-1)" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <line x1="9" y1="6" x2="20" y2="6" />
                    <line x1="9" y1="12" x2="20" y2="12" />
                    <line x1="9" y1="18" x2="20" y2="18" />
                    <line x1="5" y1="6" x2="5" y2="6.01" />
                    <line x1="5" y1="12" x2="5" y2="12.01" />
                    <line x1="5" y1="18" x2="5" y2="18.01" />
                </svg>
               <span> ${doc.data().name.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')} </span>
            </li>
        ` : "  ")
    })
    document.getElementById("my-lists-container").innerHTML=items.join(' ');
}

function updateFolders(querySnapshot){
    let items = querySnapshot.docs.sort((a,b)=>{return((a.data().name.toLowerCase() < b.data().name.toLowerCase()) ? -1 : 1)}).sort((a,b)=>{return((a.data().roles[uid] < b.data().roles[uid])? -1 : 1)}).map(doc => {
        return(doc.exists ? `
            <li onclick="window.history.pushState('','','/folder/${doc.id}');updateWindows()">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-folder" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="var(--foreground-1)" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
                </svg>
                <span> ${doc.data().name.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')} </span>
            </li>
        ` : '  ')
    })
    document.getElementById("my-folders-container").innerHTML = items.join(' ');
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
                firestore.collection("lists").add({
                    name: name,
                    public:false,
                    roles: {
                        [uid]: 'creator',
                    },
                    cards:[]
                })
            }
        }catch(error){
            console.log(error)
            //shows sign in panel
            document.getElementById('panel-container').classList.remove("hidden");
            document.getElementById("sign-in-panel").classList.remove("hidden");
        }
    })

    document.getElementById('add-folder-btn').addEventListener('click',()=>{
        try{
            //cause error if you don't have uid
            if(!uid){lmao}
            //prompt user to enter name of list
            let name = window.prompt("Enter name for folder", "New Folder")
            if (name){
                //adds a document
                firestore.collection('folders').add({
                    name: name,
                    public:false,
                    roles: {
                        [uid]: 'creator',
                    },
                    cards:[]
                })
            }
        }catch(error){
            //shows sign in panel
            document.getElementById('panel-container').style.display = "flex";
            document.getElementById("sign-in-panel").style.display = "block";
        }
    })

    //hides and shows the sidebar
    document.getElementById('sidebar-toggle').addEventListener('click',()=>{

        if((localStorage.getItem("showSidebar") ?? "true") =="true"){
            localStorage.setItem("showSidebar","false");
        }else{
            localStorage.setItem("showSidebar","true");
        }
        toggleSidebar(localStorage.getItem("showSidebar") == "true")
    })
    toggleSidebar((localStorage.getItem("showSidebar") ?? "true") =="true")

})

function toggleSidebar(bool){
    if(bool){
        document.getElementById('sidebar-container').style.display = "block";
    }else{
        document.getElementById('sidebar-container').style.display = "none";
    }
}

//remove lists from sidebar when signed out
function clearLists(){
    document.getElementById('my-lists-container').innerHTML = "";
}

function clearFolders(){
    document.getElementById("my-folders-container").innerHTML = "";
}
