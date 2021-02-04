let panelContainer = document.getElementById("panel-container");
let signInPanel = document.getElementById("sign-in-panel");
let signInBtn = document.getElementById("login-btn");
signInBtn.addEventListener("click", ()=>{
    panelContainer.style.display="flex";
    signInPanel.style.display="block";
})

panelContainer.addEventListener("click", (e)=>{
    if(e.target == panelContainer) {
        panelContainer.style.display = "none";
        for (let panel of panelContainer.children) {
            panel.style.display = "none";
        }
    }
})
