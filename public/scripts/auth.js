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
            var displayName = user.displayName;
            var email = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var uid = user.uid;
            var phoneNumber = user.phoneNumber;
            var providerData = user.providerData;
            for(let fullnameElement of fullnameElements){
                fullnameElement.innerHTML = displayName
            }
        } else {
            // User is signed out.
            profileBtn.hidden = true;
            signInBtn.hidden = false;
            for(let fullnameElement of fullnameElements){
                fullnameElement.innerHTML = "Profile"
            }
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
