//variable for firestore
var firestore = firebase.firestore();

//I wrapped it in a function so you can't access this variables from other files, which might cuase conflict.
(function() {
let signInBtn = document.getElementById("login-btn");
let profileBtn = document.getElementById("open-profile-btn");
//elements that need to be replaced with the users name, such as in the profile button or profile panel
let fullnameElements = document.getElementsByClassName("user-full-name");
let signOutBtn = document.getElementById("signout-btn");

//kinda copy and pasted from somewhere
function initApp() {
    //detects when the auth state changes
    firebase.auth().onAuthStateChanged(function(user) {

        //if there is an user, it means they are signed in, else they are signed out.
        if (user) {
            //hides the sign in button and shows profile button when signed in
            profileBtn.style.display = "block";
            signInBtn.style.display = "none";
            //gets the data of stuff and stores it in window, which is basically like defining a global variable
            window.displayName = user.displayName;
            window.userEmail = user.email;
            window.emailVerified = user.emailVerified;
            window.photoURL = user.photoURL;
            window.uid = user.uid;
            var phoneNumber = user.phoneNumber;
            var providerData = user.providerData;
            updateUserInfo()
            //creates/updates user document
            firestore.collection('users').doc(uid).get().then(doc => {
                if(!doc.exists) {
                    firestore.collection('users').doc(uid).set({
                        displayName: displayName,
                        email: userEmail
                    }, {merge: true}).catch((error) => {
                        console.error("error:" + error)
                    })
                }else{
                    firestore.collection('users').doc(uid).set({
                        email: userEmail
                    }, {merge: true}).catch(error => {console.log(error)})
                }
            })

            window.listsRef = firestore.collection('lists');
            unsubscribe = listsRef
                .where(`roles.${uid}`,'==','creator')
                .onSnapshot(updateLists);
        } else {
            // User is signed out. and makes them null so you can't have these variables
            window.displayName = null;
            window.userEmail = null;
            window.emailVerified = null;
            window.photoURL = null;
            window.uid = null;
            //hides profile button and shows log in button
            profileBtn.style.display = "none";
            signInBtn.style.display = "block";
            //changes the text with the user's name to "profile"
            for(let fullnameElement of fullnameElements){
                fullnameElement.innerHTML = "Profile"
            }
            //unsubscribe
            try{unsubscribe()}catch{}
            //clears the lists on the sidebar
            clearLists();
        }
    }, function(error) {
        console.log(error);
    });
};

//when the sign out button is clicked inside the profile panel
signOutBtn.addEventListener('click', ()=>{
    //signed out using firebase
    firebase.auth().signOut()
        .catch(error => {
            console.log("error when signing out:" + error);
        })
    //hides the panel when you click signout so you don't need to click outside because it's useless now that you have signed out
    let panelContainer = document.getElementById("panel-container");
    panelContainer.style.display = "none";
    for (let panel of panelContainer.children) {
        panel.style.display = "none";
    }
})

initApp()

})();
