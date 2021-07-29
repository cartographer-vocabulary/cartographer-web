class Windows {

    constructor(){
        this.update()
        window.addEventListener('popstate', this.update());
    }

    update(url){
        
        if(url){
            window.history.pushState("", "", url) 
        }

        window.splitPath = window.location.pathname.split('/');

        splitPath = splitPath.filter(element => {return element != null && element != ''})

        //when clicking on a link (such as list on sidebar), it will hide the sidebar
        if(window.innerWidth <= 650){
            sidebar.collapse()
        }

        if(window.location.pathname == this.previousUrl){return}

        document.getElementById("content-list").style.display = "none";
        document.getElementById("content-welcome").style.display = "none";
        document.getElementById("content-folder").style.display = "none";
        document.getElementById("content-favorites").style.display = "none";

        switch (splitPath[0]) {
            case 'list':
                document.getElementById("content-list").style.display = "block";
                list = new List(splitPath[1])
                break;

            case 'folder':
                document.getElementById("content-folder").style.display = "block";
                // updateFolderView(splitPath[1]);
                break;

            case 'favorites':
                document.getElementById("content-favorites").style.display = "block";
                if(userDoc){
                    // updateFavorites(userDoc.data()?.favoriteLists ?? [], userDoc.data().favoriteFolders ?? [])
                }
                break;

            case 'applogin':
                appLogin = true
                break;

            case 'welcome':
                document.getElementById("content-welcome").style.display = "block";
                document.title = "Cartographer";
                break;

            default:
                document.title = "Cartographer"
                this.update("/welcome");
        }

        this.previousUrl = window.location.pathname
    }
}

let windows = new Windows()



