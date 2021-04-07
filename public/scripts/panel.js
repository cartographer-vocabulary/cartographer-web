(function() {
//gets the panels and the buttons to open the panels
let panelContainer = document.getElementById("panel-container");
let signInPanel = document.getElementById("sign-in-panel");
let signInBtn = document.getElementById("login-btn");
let profilePanel = document.getElementById("profile-panel");
let profileBtn = document.getElementById("open-profile-btn");
let listSettingsPanel = document.getElementById("list-settings-panel");
let listSettingsBtn = document.getElementById("list-settings");
let folderSettingsPanel = document.getElementById("folder-settings-panel");
let folderSettingsBtn = document.getElementById("folder-settings");
//the three functions are basically duplicates and shows the corresponding panel when button is clicked
signInBtn.addEventListener("click", ()=>{
    // panelContainer.style.display = "flex";
    // signInPanel.style.display = "block";
    panelContainer.classList.remove("hidden");
    signInPanel.classList.remove("hidden");

})

profileBtn.addEventListener("click", ()=>{
    panelContainer.classList.remove("hidden");
    profilePanel.classList.remove("hidden");
})

listSettingsBtn.addEventListener("click", ()=>{
    panelContainer.classList.remove("hidden");
    listSettingsPanel.classList.remove("hidden");
})

folderSettingsBtn.addEventListener("click", ()=>{
    panelContainer.classList.remove("hidden");
    folderSettingsPanel.classList.remove("hidden");
})

//hides the panels when you click outside
panelContainer.addEventListener("click", (e)=>{
    if(e.target == panelContainer) {
        panelContainer.classList.add("hidden");
        for (let panel of panelContainer.children) {
            panel.classList.add("hidden");
        }
    }
})


})();
