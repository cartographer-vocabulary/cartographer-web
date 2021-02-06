(function() {
//gets the panels and the buttons to open the panels
let panelContainer = document.getElementById("panel-container");
let signInPanel = document.getElementById("sign-in-panel");
let signInBtn = document.getElementById("login-btn");
let profilePanel = document.getElementById("profile-panel");
let profileBtn = document.getElementById("open-profile-btn");
let listSettingsPanel = document.getElementById("list-settings-panel");
let listSettingsBtn = document.getElementById("list-settings");

//the three functions are basically duplicates and shows the corresponding panel when button is clicked
signInBtn.addEventListener("click", ()=>{
    panelContainer.style.display = "flex";
    signInPanel.style.display = "block";
})

profileBtn.addEventListener("click", ()=>{
    panelContainer.style.display = "flex";
    profilePanel.style.display = "block";
})

listSettingsBtn.addEventListener("click", ()=>{
    panelContainer.style.display = "flex";
    listSettingsPanel.style.display = "block";
})


//hides the panels when you click outside
panelContainer.addEventListener("click", (e)=>{
    if(e.target == panelContainer) {
        panelContainer.style.display = "none";
        for (let panel of panelContainer.children) {
            panel.style.display = "none";
        }
    }
})


})();
