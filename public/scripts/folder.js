

// ███████╗ ██████╗ ██╗     ██████╗ ███████╗██████╗ ███████╗
// ██╔════╝██╔═══██╗██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
// █████╗  ██║   ██║██║     ██║  ██║█████╗  ██████╔╝███████╗
// ██╔══╝  ██║   ██║██║     ██║  ██║██╔══╝  ██╔══██╗╚════██║
// ██║     ╚██████╔╝███████╗██████╔╝███████╗██║  ██║███████║
// ╚═╝      ╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝

let folder

class Folder{

    constructor(folderId){
        this.id = folderId
        this.updateFolderView()

        //event listener for the button that edits the list, and puts that data on firestore
        document.querySelector("#folder-edit-btn").addEventListener('click',()=>{
            let newName = window.prompt("Rename Folder:",folderDoc.data().name);
            if(newName || newName ==""){
                firestore.collection("folders").doc(splitPath[1]).update(
                    {
                        name: newName,
                    }
                )
            }
        })
        //for deleting the list
        document.querySelector('#folder-delete-btn').addEventListener('click',()=>{
            if(window.confirm("Delete this folder? it will also delete all lists in this folder.")){
                if(folderLists) {
                    let batchDelete = firestore.batch();
                    for (let doc of folderLists) {
                        batchDelete.delete(firestore.collection("lists").doc(doc.id))
                    }
                    batchDelete.commit()
                }
                firestore.collection("folders").doc(splitPath[1]).delete()
                //hides the panel when you click delete so you don't need to click outside because it's useless now that you have delete the list
                let panelContainer = document.getElementById("panel-container");
                panelContainer.classList.add("hidden");
                for (let panel of panelContainer.children) {
                    panel.classList.add("hidden");
                }

            }
        })
        document.getElementById('add-folder-list-btn').addEventListener('click', ()=>{
            addNewList()
        })

    }

    updateFolderView(){
        subscriptions.folderDoc?.();
        subscriptions.folderList?.();

        //also resets the content that is in them
        document.querySelector("#content-folder .content-header").innerHTML = "<span class='loader'></span>";
        document.querySelector("#folder-settings-panel h1").innerHTML = "<span class='loader'></span>";
        document.getElementById("folder-list-container").innerHTML = "<div class='folder-list loader'></div>";
        document.querySelector("#folder-roles-list").innerHTML = "<span class='loader'></span>"
        document.getElementById("folder-delete-btn").style.display = "none"
        document.getElementById("folder-edit-btn").style.display = "none"
        document.getElementById("folder-settings").style.display = "none"

        subscriptions.folderDoc = firestore.collection('folders').doc(this.id)
            .onSnapshot((doc) => {
                if(doc.exists){
                    this.data = doc.data();
                    //changes the web page title
                    document.title = doc.data().name + " - Cartographer"
                    //header of the list thing
                    document.querySelector("#content-folder .content-header").innerText = doc.data().name;
                    //header in the settings panel
                    document.querySelector("#folder-settings-panel h1").innerText = doc.data().name;
                    //only shows the delete button if you are the creator, there isn't meant for security because people can change the css,
                        //but only so that people don't really need to see something they can't press.

                        //in the folder settings popup, show the settings if creator
                    if(doc.data().roles[user.uid] === "creator"){
                        document.getElementById("folder-delete-btn").style.display = "grid"
                    }else{
                        document.getElementById("folder-delete-btn").style.display = "none"
                    }
                    if(doc.data().roles[user.uid] !== "viewer"){
                        document.getElementById("folder-edit-btn").style.display = "grid"
                        document.getElementById("folder-settings").style.display = "flex"
                    }else{
                        document.getElementById("folder-edit-btn").style.display = "none"
                        document.getElementById("folder-settings").style.display = "none"
                    }

                    this.updateFolderLists(this.id)

                    //same thing as the users thing, changes the styles of public checkbox depending on if it's checked
                    document.querySelector("#folder-toggle-public-btn").innerHTML = doc.data().public ? "✔︎" : ""
                    document.querySelector("#folder-toggle-public-btn").style.backgroundColor = doc.data().public ? "var(--accent-1)" : "var(--background-1)"
                    document.querySelector("#folder-toggle-public-btn").style.color = doc.data().public ? "var(--background-1)" : "var(--foreground-1)"
                    document.querySelector("#folder-toggle-public-btn").style.border = doc.data().public ? "none" : "1px solid var(--border-1)"


                    //updates roles, see user function, it's the same
                    if(doc.data().roles != this.previousFolderRoles){

                        let names = Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)}).map(([uid,role])=>{
                            return firebase.functions().httpsCallable('getDisplayName')({uid: uid})
                        })
                        Promise.allSettled(names).then((result)=>{
                            document.querySelector("#folder-roles-list").innerHTML = result.map(({value:data}, index) => {
                                if(Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][0] != user.uid) {
                                    return (`
                                        <div class="roles-list-item horizontal">
                                        <span>${data?.data?.name?.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') ?? "Unknown"}</span>
                                        <div class="spacer"></div>
                                        <select class="roles-list-select" onchange="let updatedRoles = folderDoc.data().roles;updatedRoles[Object.entries(folderDoc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[${index}][0]] = this.options[this.selectedIndex].value;firestore.collection('folders').doc(splitPath[1]).set({roles:updatedRoles},{merge:true}) ">
                                        <option value="viewer" ${Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][1] == "viewer" ? "selected" : ""}>viewer</option>
                                        <option value="editor" ${Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][1] == "editor" ? "selected" : ""}>editor</option>
                                        <option value="creator" ${Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][1] == "creator" ? "selected" : ""}>creator</option>
                                        </select>
                                        <button class="roles-list-delete-btn" onclick="let deletedRoles = folderDoc.data().roles;delete deletedRoles[Object.entries(folderDoc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[${index}][0]];firestore.collection('folders').doc(splitPath[1]).update({roles:deletedRoles})">×</button>
                                        </div>
                                        `)
                                }else{
                                    return (`
                                        <div class="roles-list-item horizontal">
                                        <span>${data?.data?.name?.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') ?? "Unknown"}</span>
                                        <div class="spacer"></div>
                                        </div>
                                        `)
                                }
                            }).join("  ")
                        })
                    }
                    this.previousFolderRoles = doc.data().roles;

                    if(user){
                        document.querySelector("#content-folder .favorites-toggle svg").style.fill = user?.data?.favoriteFolders?.includes(this.id) ? "var(--accent-1)" : "none"
                        document.querySelector("#content-folder .favorites-toggle svg").style.stroke = user?.data?.favoriteFolders?.includes(this.id) ? "var(--accent-1)" : "var(--foreground-1)"
                    }

                }
            },(error) => {
                //does this when there is a error, probably because it was deleted and sets everything to placeholders
                document.querySelector("#content-folder .content-header").innerHTML = "placeholder"
                document.querySelector("#folder-settings-panel h1").innerHTML = "placeholder";
                console.error(error);
                //changes it back to welcome and refreshes the page
                window.history.pushState("","","/welcome");
                updateWindows();
            })
    }

    updateFolderLists(id){
        subscriptions.folderList = firestore.collection("lists")
            .where(`folder`,'==',`${id}`)
            .onSnapshot((querySnapshot)=>{
                this.folderLists = querySnapshot.docs
                //maps it to elements, and sorts them alphabetically
                let items = querySnapshot.docs.sort((a,b)=>{return((a.data().name.toLowerCase() < b.data().name.toLowerCase()) ? -1 : 1)}).map(doc => {
                    return(doc.exists ? `
                        <div class="folder-list" onclick="windows.update('/list/${doc.id}')">
                        <h3>${doc.data().name.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</h3>
                        <p>${doc.data().cards.length} ${(doc.data().cards.length == 1) ? "term" : "terms"}</p>
                        </div>
                        ` : "  ")
                })
                //puts it in the element
                document.getElementById("folder-list-container").innerHTML = items.join(" ")

            },(error) => {
                console.log(error)
            })
    }

    toggleFavoriteFolder(){
        if(user.data?.favoriteFolders?.includes(this.id)){
            let editedFavorites = user.data.favoriteFolders.filter(a=>{
                return a!=splitPath[1]
            })
            firestore.collection("users").doc(user.uid).update({
                favoriteFolders:editedFavorites
            })
        }else{
            firestore.collection("users").doc(user.uid).update({
                favoriteFolders:user?.data?.favoriteFolders?.concat([this.id]) ?? [this.id]
            })
        }
    }

}


