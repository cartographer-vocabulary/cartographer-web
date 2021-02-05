var firestore = firebase.firestore();
(function() {
let signInBtn = document.getElementById("login-btn");
let profileBtn = document.getElementById("open-profile-btn");
let fullnameElements = document.getElementsByClassName("user-full-name");
let signOutBtn = document.getElementById("signout-btn");
function initApp() {

    firebase.auth().onAuthStateChanged(function(user) {

        if (user) {
            profileBtn.hidden = false;
            signInBtn.hidden = true;
            // User is signed in.
            window.displayName = user.displayName;
            window.userEmail = user.email;
            window.emailVerified = user.emailVerified;
            window.photoURL = user.photoURL;
            window.uid = user.uid;
            var phoneNumber = user.phoneNumber;
            var providerData = user.providerData;
            for(let fullnameElement of fullnameElements){
                fullnameElement.innerHTML = displayName
            }
            firestore.collection('users').doc(uid).set({
                email:userEmail
            },{merge:true}).catch((error)=>{console.error("error:" + error)})
            window.listsRef = firestore.collection('lists');
            unsubscribe = listsRef
                .where(`roles.${uid}`,'==','creator')
                .onSnapshot(updateLists);
        } else {
            // User is signed out.
            profileBtn.hidden = true;
            signInBtn.hidden = false;
            for(let fullnameElement of fullnameElements){
                fullnameElement.innerHTML = "Profile"
            }
            try{unsubscribe()}catch{}
            clearLists();
        }
    }, function(error) {
        console.log(error);
    });
};

signOutBtn.addEventListener('click', ()=>{
    firebase.auth().signOut()
        .catch(error => {
            console.log("error when signing out:" + error);
        })
})

initApp()

})();
