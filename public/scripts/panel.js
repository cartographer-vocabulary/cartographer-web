var panel = {
    show: function(panelName){
        let panelContainer = document.getElementById("panel-container");
        panelContainer.classList.remove("hidden");
        document.querySelector("#"+panelName).classList.remove("hidden");
    },
    hide: function(){
        let panelContainer = document.getElementById("panel-container");
        panelContainer.classList.add("hidden");
        for (let panel of panelContainer.children) {
            panel.classList.add("hidden");
        }
    }
}

//hides the panels when you click outside
document.getElementById("panel-container").addEventListener("click", (e)=>{
    let panelContainer = document.getElementById("panel-container");
    if(e.target == panelContainer) {
        panel.hide()
    }
})



