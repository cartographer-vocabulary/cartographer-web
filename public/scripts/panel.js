class Panel {
    constructor(){
        document.getElementById("panel-container").addEventListener("click", (e)=>{
            let panelContainer = document.getElementById("panel-container");
            if(e.target == panelContainer) {
                panel.hide()
            }
        })
    }
    show(panelName){
        let panelContainer = document.getElementById("panel-container");
        panelContainer.classList.remove("hidden");
        document.querySelector("#"+panelName).classList.remove("hidden");
    }
    hide(){
        let panelContainer = document.getElementById("panel-container");
        panelContainer.classList.add("hidden");
        for (let panel of panelContainer.children) {
            panel.classList.add("hidden");
        }
    }
}

let panel = new Panel()


