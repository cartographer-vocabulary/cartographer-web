//variable for firestore
var firestore = firebase.firestore();


//elements that need to be replaced with the users name, such as in the profile button or profile panel

let subscriptions = {}

window.appLogin = false

function initApp() {
    //detects when the auth state changes
    firebase.auth().onAuthStateChanged(function(_user) {

        //if there is an user, it means they are signed in, else they are signed out.
        if (_user) {

            updateUserInfo(_user)

            subscriptions.sidebarLists = firestore.collection('lists')
                .where(`roles.${_user.uid}`,'in',['creator','editor','viewer'])
                .onSnapshot(updateLists);
            subscriptions.siderbarFolders = firestore.collection('folders')
                .where(`roles.${_user.uid}`,'in',['creator','editor','viewer'])
                .onSnapshot(updateFolders);
            
            if(appLogin){
                firebase.auth().currentUser.getIdToken().then((idToken)=>{
                window.location.replace(`cartographer://idtoken/${idToken}`)
                })       
            }

        } else {
            clearUserInfo()
        }
    }, function(error) {
        console.log(error);
    });
};

function updateUserInfo(_user){
    window.user = _user

    let elementUpdates = () => {
        
        let signInBtn = document.getElementById("login-btn");
        let profileBtn = document.getElementById("open-profile-btn");

        profileBtn.style.display = "block";
        signInBtn.style.display = "none";

        let nameElements = document.getElementsByClassName("user-full-name");
        for(let nameElement of nameElements){
            nameElement.innerHTML = _user.displayName
        }

    }
    
    elementUpdates()
    window.addEventListener("load", elementUpdates)
    
}

function clearUserInfo(){
    window.user = null

    let signInBtn = document.getElementById("login-btn");
    let profileBtn = document.getElementById("open-profile-btn");

    profileBtn.style.display = "none";
    signInBtn.style.display = "block";

    let nameElements = document.getElementsByClassName("user-full-name");
    for(let nameElement of nameElements){
        nameElement.innerHTML = "Profile"
    }
    document.getElementById('my-lists-container').innerHTML = "";
    document.getElementById("my-folders-container").innerHTML = "";

    let panelContainer = document.getElementById("panel-container");
    panelContainer.style.display = "none";
    for (let panel of panelContainer.children) {
        panel.style.display = "none";
    }

    subscriptions.sidebarLists?.()
    subscriptions.sidebarFolders?.()
}

function signOut(){
    firebase.auth().signOut()
        .catch(error => {
            console.log("error when signing out:" + error);
        })
}

initApp()
