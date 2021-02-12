//you have to "unsubscribe" to these continously listening updates
var unsubscribeListView;
var listDoc;
var flashcardIndex = 0;
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

            if(doc.data().cards[flashcardIndex]) {
                document.getElementById("flashcard-word").innerHTML = doc.data().cards[flashcardIndex].word
                document.getElementById("flashcard-definition").innerHTML = doc.data().cards[flashcardIndex].definition
                document.getElementById("flashcard-index").innerHTML = flashcardIndex + 1;
            }else{
                document.getElementById("flashcard-word").innerHTML = "No card selected"
                document.getElementById("flashcard-definition").innerHTML = "No card selected"
                document.getElementById("flashcard-index").innerHTML = "--";
            }

            //get the card data stuff
            //its in the same document now, there is an attribute called card,
            //card is an array of objects, and the objects have attributes: word, definition
            let items
            if(doc.data().roles[uid] != "viewer") {
                items = doc.data().cards.map((card, index) => {
                    return (`<div class="card" id="${index}"><div class="horizontal"><h3 contenteditable="true" onblur="updateCardWord(this.innerHTML, parseInt(this.parentNode.parentNode.id))" onbeforeunload="this.onblur">${card.word}</h3><div class="spacer"></div><button class="card-delete-btn" onclick="deleteCard(this)" >×</button></div><hr><p contenteditable="true" onblur="updateCardDefinition(this.innerHTML, parseInt(this.parentNode.id))"  onbeforeunload="this.onblur">${card.definition}</p></div>`)
                })
            }else{
                items = doc.data().cards.map((card, index) => {
                    return (`<div class="card" id="${index}"><div class="horizontal"><h3>${card.word}</h3></div><hr><p>${card.definition}</p></div>`)
                })
            }
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
    if(listDoc.data().cards) {
        firestore.collection('lists').doc(splitPath[1]).update(
            {
                cards: listDoc.data().cards.concat([{
                    word: word,
                    definition: definition,
                }
                ])
            }
        )
    }else{
        firestore.collection('lists').doc(splitPath[1]).set(
            {
                cards:[{
                    word: word,
                    definition: definition,
                }]
            },{merge:true}
        )
    }
}

function updateCardWord(word,index){
    let editedArray = listDoc.data().cards
    if(editedArray[index.word] != word) {
        editedArray[index].word = word;
        firestore.collection('lists').doc(splitPath[1]).update(
            {
                cards: editedArray
            }
        )
    }
}

function updateCardDefinition(definition,index){
    let editedArray = listDoc.data().cards
    if(editedArray[index.definition] != definition) {
        editedArray[index].definition = definition;
        firestore.collection('lists').doc(splitPath[1]).update(
            {
                cards: editedArray
            }
        )
    }
}

let cardXOffset=0; //the default offset of the elements
let cardYOffset=0;
let cardDragIndex=0;
let cardDragElement
function cardDragStart(e){
    if(e.target.className === "card" && listDoc.data().roles[uid] !== "viewer") {
        let element = e.target
        cardDragIndex = parseInt(element.id);
        cardDragElement = element
        cardXOffset = event.pageX;
        cardYOffset = event.pageY;
        document.addEventListener('mousemove', cardDrag);
        document.addEventListener("mouseup", cardDragEnd);
        document.addEventListener('mouseover',cardDragIndexSet);
        element.style.transition = "transform 0s ease-in-out, box-shadow 0.15s ease-in-out, background-color 0.15s ease-in-out";
        element.style.zIndex = "10";
        element.style.pointerEvents = "none";
        element.style.boxShadow = "0px 10px 20px var(--shadow-2)"
    }
}

function cardDrag(){
    //moves the element to the mouse
    cardDragElement.style.boxShadow = "0px 10px 20px var(--shadow-2)"
    cardDragElement.style.transform = `translate(${event.pageX - cardXOffset}px,${ event.pageY - cardYOffset}px) scale(1.01)`
}

function cardDragIndexSet(e){
    if(e.target.className === "card" || e.target.parentNode.className === "card" || e.target.parentNode.parentNode.className === "card"){
        cardDragIndex = parseInt(e.target.id) || parseInt(e.target.closest(".card").id);
        if(e.target.className === "card"){
            e.target.style.backgroundColor = "var(--background-2)"
            e.target.closest(".card").style.boxShadow = "inset 0px 8px 15px var(--shadow-3)"
        }else{
            e.target.closest(".card").style.backgroundColor = "var(--background-2)"
            e.target.closest(".card").style.boxShadow = "inset 0px 8px 15px var(--shadow-3)"
        }
    }else{
        document.getElementById(`${cardDragIndex}`).style.backgroundColor = "var(--background-1)"
        document.getElementById(`${cardDragIndex}`).style.boxShadow = ""
        cardDragIndex = parseInt(cardDragElement.id)
    }
}

function cardDragEnd(){
    cardDragElement.style.pointerEvents = "auto";
    cardDragElement.style.transform = ""
    cardDragElement.style.transition = "transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out, background-color 0.15s ease-in-out";
    cardDragElement.style.zIndex = ""
    cardDragElement.style.boxShadow = ""
    document.removeEventListener("mousemove",cardDrag);
    document.removeEventListener("mouseup", cardDragEnd);
    document.removeEventListener("mouseover", cardDragIndexSet);
    if(parseInt(cardDragElement.id) != cardDragIndex){
        let editedArray = listDoc.data().cards;
        array_move(editedArray,parseInt(cardDragElement.id),cardDragIndex);
        firestore.collection("lists").doc(splitPath[1]).set({
            cards: editedArray
        },{merge:true})
    }
}

function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
};


document.addEventListener("mousedown", cardDragStart)


function changeFlashcard(next){
    if (next){

        if(listDoc.data().cards[flashcardIndex+1]){
            flashcardIndex++
            document.getElementById("flashcard-word").innerHTML = listDoc.data().cards[flashcardIndex].word
            document.getElementById("flashcard-definition").innerHTML = listDoc.data().cards[flashcardIndex].definition
            document.getElementById("flashcard-index").innerHTML = flashcardIndex+1;
        }
    }else{

        if(listDoc.data().cards[flashcardIndex-1]){
            flashcardIndex--
            document.getElementById("flashcard-word").innerHTML = listDoc.data().cards[flashcardIndex].word
            document.getElementById("flashcard-definition").innerHTML = listDoc.data().cards[flashcardIndex].definition
            document.getElementById("flashcard-index").innerHTML = flashcardIndex+1;
        }
    }
}


window.addEventListener("unload", ()=>{
    localStorage.setItem("flashcard-index", `${flashcardIndex}`);
})

window.addEventListener("load", ()=>{
    if(parseInt(localStorage.getItem("flashcard-index"))){
        flashcardIndex =parseInt(localStorage.getItem("flashcard-index"))
    }
})



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
