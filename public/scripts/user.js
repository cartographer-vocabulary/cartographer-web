// ██╗   ██╗███████╗███████╗██████╗
// ██║   ██║██╔════╝██╔════╝██╔══██╗
// ██║   ██║███████╗█████╗  ██████╔╝
// ██║   ██║╚════██║██╔══╝  ██╔══██╗
// ╚██████╔╝███████║███████╗██║  ██║
//  ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝



class User {
    constructor(user){
        this.uid = user.uid
        this.displayName = user.displayName
        this.email = user.email

        subscriptions.userDoc?.()
        subscriptions.userDoc = firestore.collection('users').doc(this.uid).onSnapshot((doc)=>{

            this.data = doc.data()

            for(let themeBtn of document.getElementsByClassName("theme-toggle")){
                themeBtn.style.backgroundColor = ""
                themeBtn.style.border = ""
                themeBtn.style.color = ""
                themeBtn.style.fontWeight = ""
                themeBtn.children[0].style.stroke = ""
            }

            for(let colorSchemeBtn of document.getElementsByClassName("color-scheme")){
                colorSchemeBtn.style.border = ""
            }

            //deals with the color schemes and themes
            if(doc.data().theme){
                uiTheme = doc.data().theme
                localStorage.setItem("uiTheme",uiTheme)
                document.getElementById(`${uiTheme}-mode`).style.backgroundColor = "var(--accent-1)"
                document.getElementById(`${uiTheme}-mode`).style.color = "var(--background-1)"
                document.getElementById(`${uiTheme}-mode`).style.fontWeight = "500"
                document.getElementById(`${uiTheme}-mode`).children[0].style.stroke = "var(--background-1)"
                document.getElementById(`${uiTheme}-mode`).style.border = "1px solid var(--accent-1)"

                //special thing for automatic color scheme
                //changes attribte on html tag, and then css styles that
                if(uiTheme != "automatic"){
                    document.documentElement.setAttribute("ui-theme", uiTheme)
                }else{
                    if(window.matchMedia("(prefers-color-scheme: dark)").matches){
                        document.documentElement.setAttribute("ui-theme", "dark")
                    }else{
                        document.documentElement.setAttribute("ui-theme", "light")
                    }
                }
            }

            if(doc.data().colorScheme){
                colorScheme = doc.data().colorScheme
                localStorage.setItem("colorScheme",colorScheme)
                document.getElementById(`${colorScheme}-color-scheme`).style.border = "2px solid var(--accent-1)"

                document.documentElement.setAttribute("color-scheme", colorScheme)

            }

            //changes the stars on lists and folders here,
                //because the favorites are stored on the user
            if(splitPath[0] == "favorites"){
                updateFavorites(doc?.data()?.favoriteLists ?? [], doc?.data()?.favoriteFolders ?? [])
            }else if(splitPath[0] == "list"){
                document.querySelector("#content-list .favorites-toggle svg").style.fill = doc?.data()?.favoriteLists?.includes(splitPath[1]) ? "var(--accent-1)" : "none"
                document.querySelector("#content-list .favorites-toggle svg").style.stroke = doc?.data()?.favoriteLists?.includes(splitPath[1]) ? "var(--accent-1)" : "var(--foreground-1)"
            }else if(splitPath[0] == "folder"){
                document.querySelector("#content-folder .favorites-toggle svg").style.fill = doc?.data()?.favoriteFolders?.includes(splitPath[1]) ? "var(--accent-1)" : "none"
                document.querySelector("#content-folder .favorites-toggle svg").style.stroke = doc?.data()?.favoriteFolders?.includes(splitPath[1]) ? "var(--accent-1)" : "var(--foreground-1)"
            }

        })
        
    }

    updateColorScheme(colorScheme){
        firestore.collection('users').doc(this.uid).update({
            colorScheme:colorScheme
        })
    }
    
    updateTheme(theme){
        if(this.data.theme != theme){
            firestore.collection('users').doc(this.uid).update({
                theme: theme
            })
        }
    }

    updateDisplayName(){
        let newName = window.prompt("Enter new name:", this.displayName)
        newName.trim()
        if(newName){
            firebase.auth().currentUser.updateProfile({
                displayName: newName
            }).then(()=>{
                let userData = firebase.auth().currentUser
                this.displayName = userData.displayName
                this.updateUserInfo()
            })
        }
    }

    updateUserInfo(){
        let signInBtn = document.querySelector("#login-btn");
        let profileBtn = document.querySelector("#open-profile-btn");

        profileBtn.style.display = "block";
        signInBtn.style.display = "none";

        let nameElements = document.querySelectorAll(".user-full-name");
        for(let nameElement of nameElements){
            nameElement.innerHTML = this.displayName
        }

        sidebar.updateLists()
        sidebar.updateFolders()

        if(appLogin){
            auth.appLogin()
        }
    }
    
}



let uiTheme = localStorage.getItem("uiTheme") ?? "automatic";
let colorScheme = localStorage.getItem("colorScheme") ?? "default";

window.matchMedia("(prefers-color-scheme: dark)").addListener((e)=>{
    if(uiTheme == "automatic"){
        if(e.matches){
            document.documentElement.setAttribute("ui-theme", `dark`)
        }else{
            document.documentElement.setAttribute("ui-theme", `light`)
            console.log("light")
        }
    }
});


document.documentElement.setAttribute("color-scheme", colorScheme)

if(uiTheme != "automatic"){
    document.documentElement.setAttribute("ui-theme", uiTheme)
}else{
    if(window.matchMedia("(prefers-color-scheme: dark)").matches){
        document.documentElement.setAttribute("ui-theme", "dark")
    }else{
        document.documentElement.setAttribute("ui-theme", "light")
    }
}




