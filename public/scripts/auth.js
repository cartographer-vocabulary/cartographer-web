// let signInBtn = document.getElementById("login-btn");
let profileBtn = document.getElementById("open-profile-btn");

function initApp() {

    firebase.auth().onAuthStateChanged(function(user) {

        if (user) {
            profileBtn.style.display="block";
            signInBtn.style.display="none";
            // User is signed in.
            var displayName = user.displayName;
            var email = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var uid = user.uid;
            var phoneNumber = user.phoneNumber;
            var providerData = user.providerData;
        } else {
            // User is signed out.
            profileBtn.style.display="none";
            signInBtn.style.display="block";
        }
    }, function(error) {
        console.log(error);
    });
};

initApp()
