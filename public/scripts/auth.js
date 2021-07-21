//variable for firestore
var firestore = firebase.firestore();


//elements that need to be replaced with the users name, such as in the profile button or profile panel

let subscriptions = {}

window.appLogin = false

//detects when the auth state changes
firebase.auth().onAuthStateChanged(
    function(_user){
        if (_user) {
            window.user = _user
            updateSignedInInfo()
        } else {
            updateSignedOutInfo()
        }
    }, function(error) {
        console.log(error);
    }
);

var auth = {
    signedIn: function(){
        let signInBtn = document.querySelector("#login-btn");
        let profileBtn = document.querySelector("#open-profile-btn");

        profileBtn.style.display = "block";
        signInBtn.style.display = "none";

        let nameElements = document.querySelectorAll(".user-full-name");
        for(let nameElement of nameElements){
            nameElement.innerHTML = user.displayName
        }

        sidebar.updateLists()
        sidebar.updateFolders()

        if(appLogin){
            firebase.auth().currentUser.getIdToken().then((idToken)=>{
                window.location.replace(`cartographer://idtoken/${idToken}`)
            })       
        }
    },
    signedOut: function(){
        document.querySelector("#login-btn").style.display = "block"
    },
    signOut: function(){
        function signOut(){
            firebase.auth().signOut()
                .then(()=>{
                    location.reload()
                })
                .catch(error => {
                    console.log("error when signing out:" + error);
                })
        }
    }
}



