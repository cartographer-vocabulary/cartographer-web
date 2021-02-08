//you have to "unsubscribe" to these continously listening updates
var unsubscribeListView;
var listDoc;
function updateListView(id){
    //if unsubscribe exists, unsubscribe
    unsubscribeListView && unsubscribeListView();

    //gets data and changes the content
    unsubscribeListView = firestore.collection("lists").doc(id)
        .onSnapshot((doc) => {
            listDoc = doc;
            //header of the list thing
            document.querySelector("#content-list .content-header").innerHTML = doc.data().name;
            //header in the settings panel
            document.querySelector("#list-settings-panel h1").innerHTML = doc.data().name;
            //only shows the delete button if you are the creator, there isn't meant for security because people can change the css,
            //but only so that people don't really need to see something they can't press.
            if(doc.data().roles[uid] == "creator"){
                document.getElementById("list-delete-btn").style.display = "block"
            }else{
                document.getElementById("list-delete-btn").style.display = "none"
            }

            //get the card data stuff
            //its in the same document now, there is an attribute called card,
            //card is an array of objects, and the objects have attributes: word, definition
            let items = doc.data().cards.map((card,index) =>{
                return(`<div class="card" id="card-${index}"><div class="horizontal"><h3>${card.word}</h3><div class="spacer"></div><button class="card-delete-btn" onclick="deleteCard(this)">×</button></div><hr><p>${card.definition}</p></div>`)
            })

            document.getElementById("card-container").innerHTML = items.join("  ")

        },(error) => {
            //does this when there is a error, probably because it was deleted and sets everything to placeholders
            document.querySelector("#content-list .content-header").innerHTML = "placeholder"
            document.querySelector("#list-settings-panel h1").innerHTML = "placeholder";
            console.error(error);
            //changes it back to welcome and refreshes the page
            window.history.pushState("","","/welcome");
            updateWindows();
        })
}

//adding cards with input
window.addEventListener('load',()=>{
    let cardWord = "";
    let cardDefinition = "";
    let cardWordElement = document.getElementById("card-word-input");
    let cardDefinitionElement = document.getElementById("card-definition-input");
    cardWordElement.addEventListener('keyup',(e)=>{
        cardWord = cardWordElement.value
        if ((e.key === 'Enter' || e.keyCode === 13) && cardWord && cardDefinition) {
            addCard(cardWord,cardDefinition)
            cardWord = ""
            cardDefinition = ""
            cardWordElement.value = ""
            cardDefinitionElement.value = ""
            cardWordElement.focus();
        }
    })
    cardDefinitionElement.addEventListener('keyup',(e)=>{
        cardDefinition = cardDefinitionElement.value
        if ((e.key === 'Enter' || e.keyCode === 13) && cardWord && cardDefinition) {
            addCard(cardWord,cardDefinition)
            cardWord = ""
            cardDefinition = ""
            cardWordElement.value = ""
            cardDefinitionElement.value = ""
            cardWordElement.focus();
        }
    })

})

function deleteCard(element){
    let splicedCards = listDoc.data().cards
    splicedCards.splice(parseInt(element.parentNode.parentNode.id), 1)
    firestore.collection('lists').doc(splitPath[1]).update(
        {
            cards:splicedCards
        }
    )
}


function addCard(word,definition){
    firestore.collection('lists').doc(splitPath[1]).update(
        {
            cards: listDoc.data().cards.concat([{
                word:word,
                definition:definition,
                }
            ])
        }
    )
}
//gets the path of the url and updates the window layout
function updateWindows(){
    //splits the url into array; example: hello.com/abc/xyz becomes ["abc","xyz"]
    window.splitPath = window.location.pathname.split('/');
    //removes null stuff
    splitPath = splitPath.filter(element => {return element != null && element != ''})
    //checks if the url is a task, welcome, or if neither it sets it to welcome
    if(splitPath[0] == "list" && splitPath[1]){
        document.getElementById("content-list").style.display = "block";
        document.getElementById("content-welcome").style.display = "none";
        updateListView(splitPath[1]);
    }else if(splitPath[0] == "welcome"){
        document.getElementById("content-list").style.display = "none";
        document.getElementById("content-welcome").style.display = "block";
    }else{
        window.history.pushState("","","/welcome");
        updateWindows();
    }
}

//when to call updateWindows() function
window.addEventListener('popstate', updateWindows);
window.addEventListener('load', updateWindows);



window.addEventListener('load',()=>{
    //event listner for the button thata edits the list, and puts that data on firestore
    document.querySelector("#list-edit-btn").addEventListener('click',()=>{
        let newName = window.prompt("Rename List:");
        if(newName || newName ==""){
            firestore.collection("lists").doc(splitPath[1]).update(
                {
                    name: newName,
                }
            )
        }
    })
    //for deleting the list
    document.querySelector('#list-delete-btn').addEventListener('click',()=>{
        if(window.confirm("Delete this list?")){
            firestore.collection("lists").doc(splitPath[1]).delete()
            //hides the panel when you click delete so you don't need to click outside because it's useless now that you have delete the list
            let panelContainer = document.getElementById("panel-container");
            panelContainer.style.display = "none";
            for (let panel of panelContainer.children) {
                panel.style.display = "none";
            }
        }
    })
})
