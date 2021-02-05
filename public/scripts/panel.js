(function() {

let panelContainer = document.getElementById("panel-container");
let signInPanel = document.getElementById("sign-in-panel");
let signInBtn = document.getElementById("login-btn");
let profilePanel = document.getElementById("profile-panel");
let profileBtn = document.getElementById("open-profile-btn");
signInBtn.addEventListener("click", ()=>{
    panelContainer.hidden = false;
    signInPanel.hidden = false;
})

profileBtn.addEventListener("click", ()=>{
    panelContainer.hidden = false;
    profilePanel.hidden = false;
})


panelContainer.addEventListener("click", (e)=>{
    if(e.target == panelContainer) {
        panelContainer.hidden = true;
        for (let panel of panelContainer.children) {
            panel.hidden = true;
        }
    }
})


})();
