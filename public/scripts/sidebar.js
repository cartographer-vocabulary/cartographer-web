class Sidebar {
    toggle(){

        let showingSidebar = localStorage.getItem("showingSidebar") ?? "true"
        
        if(showingSidebar =="true"){
            localStorage.setItem("showingSidebar","false");
            showingSidebar = "false"
        }else{
            localStorage.setItem("showingSidebar","true");
            showingSidebar = "true"
        }

        if(showingSidebar == "true"){
            document.getElementById('sidebar-container').style.display = "block";
        }else{
            document.getElementById('sidebar-container').style.display = "none";
        }
    }
    open(){
        localStorage.setItem("showingSidebar","true");
        document.getElementById('sidebar-container').style.display = "block";
    }
    collapse(){
        localStorage.setItem("showingSidebar","false");
        document.getElementById('sidebar-container').style.display = "none";
    }
    updateLists(){
        subscriptions.sidebarLists = firestore.collection('lists')
            .where(`roles.${user.uid}`,'in',['creator','editor','viewer'])
            .onSnapshot(querySnapshot =>{
                let filtered = querySnapshot.docs
                filtered = filtered.filter(item => {
                    return((!item.data().folder) || item.data().folder == "")
                })
                //convert array into html basically
                let items = filtered.sort((a,b)=>{return((a.data().name.toLowerCase() < b.data().name.toLowerCase()) ? -1 : 1)}).sort((a,b)=>{return((a.data().roles[user.uid] < b.data().roles[user.uid])? -1 : 1)}).map(doc => {
                    //this part changes the url when you click and calls update window function in content.js
                    return(doc.exists ? `
                        <li onclick="windows.update('/list/${doc.id}')">
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

            });
    }
    updateFolders(){
        subscriptions.siderbarFolders = firestore.collection('folders')
            .where(`roles.${user.uid}`,'in',['creator','editor','viewer'])
            .onSnapshot(querySnapshot=>{
                let items = querySnapshot.docs.sort((a,b)=>{return((a.data().name.toLowerCase() < b.data().name.toLowerCase()) ? -1 : 1)}).sort((a,b)=>{return((a.data().roles[user.uid] < b.data().roles[user.uid])? -1 : 1)}).map(doc => {
                    return(doc.exists ? `
                        <li onclick="windows.update('/folder/${doc.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-folder" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="var(--foreground-1)" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
                        </svg>
                        <span> ${doc.data().name.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')} </span>
                        </li>
                        ` : '  ')
                })
                document.getElementById("my-folders-container").innerHTML = items.join(' ');
            });
    }

}

var sidebar = new Sidebar()

function addNewList(folderId){
    console.log("hello")
    try{
        //cause error if you don't have uid
        if(!user){lmao}
        //prompt user to enter name of list
        let name = window.prompt("Enter name for list", "New List")
        if (name){
            //adds a document
            firestore.collection("lists").add({
                name: name,
                public:false,
                roles: {
                    [user.uid]: 'creator',
                },
                folder:folderId,
                cards:[]
            })
        }
    }catch(error){
        console.log(error)
        panel.show("sign-in-panel")
    }
}

function addNewFolder(){
    try{
        //cause error if you don't have uid
        if(!user){lmao}
        //prompt user to enter name of list
        let name = window.prompt("Enter name for folder", "New Folder")
        if (name){
            //adds a document
            firestore.collection('folders').add({
                name: name,
                public:false,
                roles: {
                    [user.uid]: 'creator',
                },
            })
        }
    }catch(error){
        panel.show("sign-in-panel")
    }
}


