//variable for firestore
var firestore = firebase.firestore();


//elements that need to be replaced with the users name, such as in the profile button or profile panel

let subscriptions = {}

let appLogin = false

//detects when the auth state changes
firebase.auth().onAuthStateChanged(
    function(_user){
        if (_user) {

            auth.signedIn(_user)
        } else {
            auth.signedOut()
        }
    }, function(error) {
        console.log(error);
    }
);

class Auth {
    signedIn(_user){

        window.user = new User(_user)
        user.updateUserInfo()

    }
    signedOut(){
        document.querySelector("#login-btn").style.display = "block"

        subscriptions.sidebarLists?.()
        subscriptions.sidebarFolders?.()

    }
    signOut(){
        firebase.auth().signOut()
            .then(()=>{
                location.reload()
            })
            .catch(error => {
                console.log("error when signing out:" + error);
            })
    }
    appLogin(){
        firebase.auth().currentUser.getIdToken().then((idToken)=>{
            window.location.replace(`cartographer://idtoken/${idToken}`)
        })       
    }
}

var auth = new Auth()

