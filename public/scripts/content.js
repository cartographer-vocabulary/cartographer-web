// ██╗     ██╗███████╗████████╗███████╗
// ██║     ██║██╔════╝╚══██╔══╝██╔════╝
// ██║     ██║███████╗   ██║   ███████╗
// ██║     ██║╚════██║   ██║   ╚════██║
// ███████╗██║███████║   ██║   ███████║
// ╚══════╝╚═╝╚══════╝   ╚═╝   ╚══════╝

//you have to "unsubscribe" to these continously listening updates
var unsubscribeListView;
var unsubscribeAvailableFolders;
var listDoc;
var flashcardIndex = 0;
var listRole;
var unsubscribeParentFolder;
var parentFolderRole;
var previousListRoles;
function updateListView(id){
    //if unsubscribe exists, unsubscribe
    unsubscribeListView && unsubscribeListView();
    unsubscribeAvailableFolders?.()
    unsubscribeParentFolder?.()

    //resets the stuff that exists, empty the cards etc
    document.querySelector("#content-list .content-header").innerHTML = "<span class='loader'></span>"
    document.querySelector("#list-settings-panel h1").innerHTML = "<span class='loader'></span>";
    document.getElementById("card-container").innerHTML = "<div class='card loader'>";
    document.querySelector("#flashcard-word").innerHTML = "<span class='loader'></span>"
    document.querySelector("#flashcard-definition").innerHTML = "<span class='loader'></span>"
    document.querySelector("#list-roles-list").innerHTML = "<div class='roles-list-item loader'></div>"
    document.querySelector("#list-settings").style.display="none"
    document.getElementById("list-edit-btn").style.display = "none"
    document.getElementById("list-folder-select-dropdown").parentNode.style.display = "none"
    document.getElementById("add-card-container").style.display = "none"
    //gets the lists once, and after you get that, you subscribe to the parent folder, and use that to change the role and the viewable content
    firestore.collection("lists").doc(id).get().then((listDoc)=>{
        listRole = listDoc.data().roles[uid];
        unsubscribeParentFolder = firestore.collection("folders").doc(listDoc.data().folder)
            .onSnapshot((doc)=>{
                parentFolderRole = doc.data().roles[uid]
                //this part essentially gets the highest role that exists, and makes that the role
                try{
                    let highestRole = "viewer";
                    if (listRole === "editor" || parentFolderRole === "editor") {
                        highestRole = "editor"
                    }
                    if (listRole === "creator" || parentFolderRole === "creator") {
                        highestRole = "creator"
                    }
                    //updates the content
                    updateListViewableContent(highestRole, listDoc)
                }catch(err){
                    //catch exists in case one of the variables doesn't i guess, and it just uses the parent folder role
                    updateListViewableContent(doc.data().roles[uid], listDoc)
                }
            },(err)=>{})
    })

    //also gets the list document once, and it subscribes to all folders you can edit
    firestore.collection("lists").doc(id).get().then((listDoc)=> {
        unsubscribeAvailableFolders = firestore.collection("folders")
            .where(`roles.${uid}`, 'in', ["creator", "editor"])
            .onSnapshot((querySnapshot) => {
                //makes options in a select dropdown
                let items = querySnapshot.docs.sort((a, b) => {
                    return ((a.data().roles[uid] < b.data().roles[uid]) ? -1 : 1)
                }).map((doc) => {
                    return (`<option value="${doc.id}">${doc.data().name.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</option>`)
                })
                //adds no folder to the beginning
                items.unshift("<option value=''>None</option>")
                //puts the options in the select element
                document.getElementById("list-folder-select-dropdown").innerHTML = items.join("  ");
                //choses the current folder
                document.getElementById("list-folder-select-dropdown").value = listDoc.data().folder ?? ""
            })
    })

    //actually subscribes to the changes in the list
    unsubscribeListView = firestore.collection("lists").doc(id)
        .onSnapshot((doc) => {
            if(doc.exists){
                //list doc that can be accessed anywhere and other functions can read what it is
                listDoc = doc;

                //containerElement that scrolls (content-list)
                let containerElement = document.querySelector("#content-list")
                //whether it should scroll to bottom
                //only if it is closer than 80px to the bottom, add it's not at the top (for situations that it doesn't scroll), but then you have to scroll once at the time it first starts scrolling, so it also checks if you are focused on the inputs
                let scrollToBottom = containerElement.scrollHeight - containerElement.clientHeight <= containerElement.scrollTop + 80 && (containerElement.scrollTop != 0 || document.activeElement.closest("#add-card-container"));

                //card that is focused
                let focusedElement = document?.activeElement;
                //gets the id which is the index of that card
                let focusedElementId = focusedElement?.closest(".card")?.id
                //gets whether it's the description or the card name
                let focusedElementType = focusedElement.tagName

                //terrible code to get the highest role the person has and updates content that depends on the role
                try{
                    let highestRole = "viewer";
                    if (doc.data().roles[uid] === "editor" || parentFolderRole === "editor") {
                        highestRole = "editor"
                    }
                    if (doc.data().roles[uid] === "creator" || parentFolderRole === "creator") {
                        highestRole = "creator"
                    }
                    updateListViewableContent(highestRole, doc)
                }catch(err){
                    updateListViewableContent(doc.data().roles[uid], doc)
                }

                //sets role for other functions to use
                listRole = doc.data().roles[uid];

                //only if the roles changed
                if(doc.data().roles != previousListRoles){

                    //gets the roles, sorts them by creator, editor, and viewer (which is conveniently alphabetical) and calls a cloud function to get their names (it's a promise so it's not actually called)
                    let names = Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)}).map(([uid,role])=>{
                        return firebase.functions().httpsCallable('getDisplayName')({uid: uid})
                    })

                    //when all those functions return
                    Promise.allSettled(names).then((result)=>{
                        //puts the stuff in the roles list element. maps the result, and uses object destructuring to only get the value part
                        document.querySelector("#list-roles-list").innerHTML = result.map(({value:data}, index) => {
                            //if the person is not the role of yourself
                            if(Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][0] != uid) {
                                //returns something with options to delete and edit
                                return (`
                                    <div class="roles-list-item horizontal">
                                    <span>${data?.data?.name?.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') ?? "Unknown"}</span>
                                    <div class="spacer"></div>
                                    <select class="roles-list-select" onchange="let updatedRoles = listDoc.data().roles;updatedRoles[Object.entries(listDoc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[${index}][0]] = this.options[this.selectedIndex].value;firestore.collection('lists').doc(splitPath[1]).set({roles:updatedRoles},{merge:true}) ">
                                    <option value="viewer" ${Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][1] == "viewer" ? "selected" : ""}>viewer</option>
                                    <option value="editor" ${Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][1] == "editor" ? "selected" : ""}>editor</option>
                                    <option value="creator" ${Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][1] == "creator" ? "selected" : ""}>creator</option>
                                    </select>
                                    <button class="roles-list-delete-btn" onclick="let deletedRoles = listDoc.data().roles;delete deletedRoles[Object.entries(listDoc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[${index}][0]];firestore.collection('lists').doc(splitPath[1]).update({roles:deletedRoles})">×</button>
                                    </div>
                                    `)
                            }else{
                                //don't allow editing of your own rule
                                //i know this probably isn't secure but i also have security rules in firebase
                                //and you can only do this if you are an editor anyways, and you should be able to trust people you make editor
                                //and: people are too stupid to figure out how this works anyways
                                return (`
                                    <div class="roles-list-item horizontal">
                                    <span>${data?.data?.name?.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') ?? "Unknown"}</span>
                                    <div class="spacer"></div>
                                    </div>
                                    `)
                            }
                        }).join("  ")
                    })
                }

                //previous roles assign after you do the comparision before
                previousListRoles = doc.data().roles[uid];
                //if the user stuff has loaded, set the star to on/off
                if(userDoc){
                    document.querySelector("#content-list .favorites-toggle svg").style.fill = userDoc?.data()?.favoriteLists?.includes(splitPath[1]) ? "var(--accent-1)" : "none"
                    document.querySelector("#content-list .favorites-toggle svg").style.stroke = userDoc?.data()?.favoriteLists?.includes(splitPath[1]) ? "var(--accent-1)" : "var(--foreground-1)"
                }

                //sets the title of the webpage (thing in tab bar)
                document.title = doc.data().name + " - Cartographer";
                //header of the list
                document.querySelector("#content-list .content-header").innerText = doc.data().name;
                //header in the settings panel
                document.querySelector("#list-settings-panel h1").innerText = doc.data().name;
                //if the list is public, set the check box to on
                document.querySelector("#list-toggle-public-btn").innerText = doc.data().public ? "✔︎" : ""
                //if yes, background is accent color
                document.querySelector("#list-toggle-public-btn").style.backgroundColor = doc.data().public ? "var(--accent-1)" : "var(--background-1)"
                //foreground color should be background color if background is accent
                document.querySelector("#list-toggle-public-btn").style.color = doc.data().public ? "var(--background-1)" : "var(--foreground-1)"
                //removes the border if background is accent, because it looks weird
                document.querySelector("#list-toggle-public-btn").style.border = doc.data().public ? "none" : "1px solid var(--border-1)"

                //basically does stuff with the flashcards
                if(doc.data().cards[flashcardIndex]) {
                    document.getElementById("flashcard-word").innerText = doc.data().cards[flashcardIndex].word
                    document.getElementById("flashcard-definition").innerText = doc.data().cards[flashcardIndex].definition
                    document.getElementById("flashcard-index").innerText = flashcardIndex + 1;
                }else{
                    document.getElementById("flashcard-word").innerText = "No card selected"
                    document.getElementById("flashcard-definition").innerText = "No card selected"
                    document.getElementById("flashcard-index").innerText = "--";
                }

                //quiz mode doesn't work if there is less than 2 cards
                if(doc.data().cards.length >= 2) {
                    refreshQuizAnswers();
                }else{
                    document.getElementById("quiz-word").innerText = "--"
                    for(let quizAnswer = 0; quizAnswer < document.getElementsByClassName("quiz-answer").length; quizAnswer ++) {
                        document.getElementsByClassName("quiz-answer")[quizAnswer].style.display = "block"
                        document.getElementsByClassName("quiz-answer")[quizAnswer].innerText= "--"
                        document.getElementsByClassName("quiz-answer")[quizAnswer].style.border = "1px solid var(--border-1)"
                        document.getElementsByClassName("quiz-answer")[quizAnswer].onclick = ()=>{}
                    }
                }

                //uses the scroll to bottom from before, after the elements have been added
                if(scrollToBottom){
                    containerElement.scrollTop = containerElement.scrollHeight - containerElement.clientHeight;
                }

                //focuses the flashcards, because when you update, they get redrawn
                if(focusedElementId && focusedElementType){
                    document.getElementById(focusedElementId).querySelector(focusedElementType).focus();
                }

            }
        },(error) => {
            //does this when there is a error, probably because it was deleted and sets everything to placeholders
            document.querySelector("#content-list .content-header").innerText = "placeholder"
            document.querySelector("#list-settings-panel h1").innerText = "placeholder";
            console.warn(error);
            //changes it back to welcome and refreshes the page
            window.history.pushState("","","/welcome");
            updateWindows();
        })
}

//changes the content depending on your role
function updateListViewableContent(role,doc){
    //if creator, allow delete, else hide it
    if(role == "creator"){
        document.getElementById("list-delete-btn").style.display = "grid"
    }else{
        document.getElementById("list-delete-btn").style.display = "none"
    }

    //the items, which are the cards grid
    let items
    if(role != "viewer") {
        //allow editing and delete if not viewer
        //dont worry i am just hiding this, but there are also security rules.
            items = doc.data().cards.map((card, index) => {
                return (`<div class="card" id="${index}" ><div class="horizontal"><h3 contenteditable="true" onblur="updateCardWord(this.innerText, parseInt(this.parentNode.parentNode.id))" onbeforeunload="return this.onblur" onpaste="setTimeout(()=>{this.innerHTML=this.innerText},10)">${card.word.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</h3><div class="spacer"></div><button class="card-delete-btn" onclick="deleteCard(this)" >×</button></div><hr><p contenteditable="true" onblur="updateCardDefinition(this.innerText, parseInt(this.parentNode.id))"  onbeforeunload="this.onblur" onpaste="setTimeout(()=>{this.innerHTML=this.innerText},10)">${card.definition.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</p></div>`)
            })
        //makes the edit buton exist
        document.getElementById("list-edit-btn").style.display = "grid"
        //makes the select thing elest
        document.getElementById("list-folder-select-dropdown").parentNode.style.display = "flex"
        //show the bottom input
        document.getElementById("add-card-container").style.display = "flex"
        document.querySelector("#list-settings").style.display="flex"
    }else{
        //don't show edit of cards
        items = doc.data().cards.map((card, index) => {
            return (`<div class="card" id="${index}"><div class="horizontal"><h3>${card.word.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</h3></div><hr><p>${card.definition.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</p></div>`)
        })
        document.querySelector("#list-settings").style.display="none"
        //does the opposide of above andd hides stuff
        document.getElementById("list-edit-btn").style.display = "none"
        document.getElementById("list-folder-select-dropdown").parentNode.style.display = "none"
        document.getElementById("add-card-container").style.display = "none"
    }

    //it's an array, so we join them, and stuff it in the container element
    document.getElementById("card-container").innerHTML = items.join("  ")
}


//editing the name of the list, and deleting the list, in the list settings popup
window.addEventListener('load',()=>{
    //event listener for the button that edits the list, and puts that data on firestore
    document.querySelector("#list-edit-btn").addEventListener('click',()=>{
        let newName = window.prompt("Rename List:",listDoc.data().name);
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
            let panelContainer = document.querySelector("#panel-container")
            panelContainer.classList.add("hidden")
            for (let panel of panelContainer.children) {
                panel.classList.add("hidden")
            }
        }
    })
})





// ██╗     ██╗███████╗████████╗███████╗     ██████╗ █████╗ ██████╗ ██████╗ ███████╗
// ██║     ██║██╔════╝╚══██╔══╝██╔════╝    ██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝
// ██║     ██║███████╗   ██║   ███████╗    ██║     ███████║██████╔╝██║  ██║███████╗
// ██║     ██║╚════██║   ██║   ╚════██║    ██║     ██╔══██║██╔══██╗██║  ██║╚════██║
// ███████╗██║███████║   ██║   ███████║    ╚██████╗██║  ██║██║  ██║██████╔╝███████║
// ╚══════╝╚═╝╚══════╝   ╚═╝   ╚══════╝     ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝


//adding cards with input
window.addEventListener('load',()=>{
    //variables for the fields
    let cardWord = "";
    let cardDefinition = "";
    //elements
    let cardWordElement = document.getElementById("card-word-input");
    let cardDefinitionElement = document.getElementById("card-definition-input");

    //listen for when something is typing on the text field
    cardWordElement.addEventListener('keyup',(e)=>{
        cardWord = cardWordElement.value
        //if enter key is pressed, and there is both definition and word, add the card
        if ((e.key === 'Enter' || e.keyCode === 13) && cardWord && cardDefinition) {
            addCard(cardWord,cardDefinition)
            //reset the variables and empty the text field
            cardWord = ""
            cardDefinition = ""
            cardWordElement.value = ""
            cardDefinitionElement.value = ""
            //focus the first word element
            cardWordElement.focus();
        }else if((e.key == 'Enter' || e.keyCode ===13)){
            //if definition is not filled in, focus that
            cardDefinitionElement.focus()
        }
    })
    cardDefinitionElement.addEventListener('keyup',(e)=>{
        cardDefinition = cardDefinitionElement.value
        //same thing copy and pasted, too lazy to make a function
        if ((e.key === 'Enter' || e.keyCode === 13) && cardWord && cardDefinition) {
            addCard(cardWord,cardDefinition)
            cardWord = ""
            cardDefinition = ""
            cardWordElement.value = ""
            cardDefinitionElement.value = ""
            cardWordElement.focus();
        }else if((e.key === 'Enter' || e.keycCode === 13)){
            //focus the word input this time
            cardWordElement.focus()
        }
    })

})

//function that's called when you press the star button
function toggleFavoriteList(){
    //if it's in favorites already, remove it from favorites. if it's not, put it in
        if(userDoc?.data()?.favoriteLists?.includes(splitPath[1])){
            let editedFavorites = userDoc.data().favoriteLists.filter(a=>{
                return a!=splitPath[1]
            })
            firestore.collection("users").doc(uid).update({
                favoriteLists:editedFavorites
            })
        }else{
            firestore.collection("users").doc(uid).update({
                favoriteLists:userDoc?.data()?.favoriteLists?.concat([splitPath[1]]) ?? [splitPath[1]]
            })
        }
}

//deletes card, i don't think there is a good way to change arrays, so i made a new variable and set the entire array
function deleteCard(element){
    let splicedCards = listDoc.data().cards
    splicedCards.splice(parseInt(element.parentNode.parentNode.id), 1)
    firestore.collection('lists').doc(splitPath[1]).update(
        {
            cards:splicedCards
        }
    )
}

//adds cards
function addCard(word,definition){
    word.trim()
    //weird code that changes depending on if there is a card
    if(listDoc.data().cards) {
        firestore.collection('lists').doc(splitPath[1]).update(
            {
                cards: listDoc.data().cards.concat([{
                    word: word.trim(),
                    definition: definition.trim(),
                }
                ])
            }
        )
    }else{
        firestore.collection('lists').doc(splitPath[1]).set(
            {
                cards:[{
                    word: word.trim(),
                    definition: definition.trim(),
                }]
            },{merge:true}
        )
    }
}

//update card's word
function updateCardWord(word,index){
    word.trim();
    let editedArray = listDoc.data().cards
    if(editedArray[index].word != word.trim()) {
        editedArray[index].word = word.trim();
        firestore.collection('lists').doc(splitPath[1]).update(
            {
                cards: editedArray
            }
        )
    }
}

//update card's definition
function updateCardDefinition(definition,index){
    definition.trim()
    let editedArray = listDoc.data().cards
    if(editedArray[index].definition != definition.trim()) {
        editedArray[index].definition = definition.trim();
        firestore.collection('lists').doc(splitPath[1]).update(
            {
                cards: editedArray
            }
        )
    }
}

//updates the folder that the list is in
    function updateListFolder(folder){
        firestore.collection("lists").doc(splitPath[1]).update(
            {
                folder: folder ||  firebase.firestore.FieldValue.delete()
            }
        )
    }

function quizletImport(){
    let text = prompt("To import from quizlet, open the list and press the more button (3 dots) and select export. paste the text here. this will not erase your other cards \n\nhttps://help.quizlet.com/hc/en-us/articles/360034345672-Exporting-your-sets")
    text.trim();
    if(text){
        let cards = text.split("\n").map((card)=>{
            return {
                word: card.split("\t")[0] ?? "no value",
                definition: card.split("\t")[1] ?? "no value"
            }
        })
        cards = listDoc.data().cards.concat(cards)
        console.log(cards)
        firestore.collection("lists").doc(splitPath[1]).update({
            cards: cards
        })
    }
}

// ██████╗ ██████╗  █████╗  ██████╗      ██████╗ █████╗ ██████╗ ██████╗ ███████╗
// ██╔══██╗██╔══██╗██╔══██╗██╔════╝     ██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝
// ██║  ██║██████╔╝███████║██║  ███╗    ██║     ███████║██████╔╝██║  ██║███████╗
// ██║  ██║██╔══██╗██╔══██║██║   ██║    ██║     ██╔══██║██╔══██╗██║  ██║╚════██║
// ██████╔╝██║  ██║██║  ██║╚██████╔╝    ╚██████╗██║  ██║██║  ██║██████╔╝███████║
// ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝      ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝

let cardDragIndex=0;
let cardStartIndex=0;
let cardDragElement;
function cardDragStart(e){
    let highestRole = "viewer";
    if (listRole === "editor" || parentFolderRole === "editor") {
        highestRole = "editor"
    }
    if (listRole === "creator" || parentFolderRole === "creator") {
        highestRole = "creator"
    }
    if(e.target.className === "card" && highestRole !== "viewer") {
        let element = e.target
        cardDragIndex = parseInt(element.id);
        cardStartIndex = cardDragIndex
        cardDragElement = element
        //adds the event listeners for dragging
        // document.addEventListener('mousemove', cardDrag);
        document.addEventListener("dragend", cardDragEnd);
        document.addEventListener('dragover',cardDragIndexSet);
        // document.getElementById("content-list").addEventListener("scroll",cardDrag)
        //do some style changes
        requestAnimationFrame(()=>{
            element.style.opacity = "0"
            element.style.pointerEvents = "none"
        })
        return false;
    }
    console.log("hello")
}

//gets the card that is dragged over, and you can set the current dragged card to be before that
function cardDragIndexSet(e){

    e.preventDefault()
    if(e.target.className === "card" || e.target.parentNode.className === "card" || e.target.parentNode.parentNode.className === "card"){
        let tempIndex = cardDragIndex
        cardDragIndex = parseInt(e.target.id) || parseInt(e.target.closest(".card").id);

        if(cardDragElement.id > cardDragIndex){
            cardDragElement.parentNode.insertBefore(cardDragElement,document.getElementById(cardDragIndex))
            for(let element of document.getElementsByClassName("card")){
                if(element.id < tempIndex && element.id >= cardDragIndex){
                    element.id = parseInt(element.id)+1
                }
            }
            cardDragElement.id = cardDragIndex
        }
        if(cardDragElement.id < cardDragIndex){
            cardDragElement.parentNode.insertBefore(cardDragElement,document.getElementById(cardDragIndex).nextSibling)

            for(let element of document.getElementsByClassName("card")){
                if(element.id > tempIndex && element.id <= cardDragIndex){
                    element.id = parseInt(element.id)-1
                }
            }
            cardDragElement.id = cardDragIndex
        }
    }
}

//when the drag is done, remove the listeners, and reset the styles.
    function cardDragEnd(e){
        e.preventDefault()
        cardDragElement.removeAttribute("style")
        cardDragElement.removeAttribute("draggable")
        document.removeEventListener("mouseup", cardDragEnd);
        document.removeEventListener("mouseover", cardDragIndexSet);

        if(cardStartIndex != cardDragIndex){
            let editedArray = listDoc.data().cards;
            array_move(editedArray,parseInt(cardStartIndex),cardDragIndex);
            firestore.collection("lists").doc(splitPath[1]).set({
                cards: editedArray
            },{merge:true})
        }
    }

//function for moving an index from one place to another
//posisibly copied from stackoverflow
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

//add event listener for mouse down
document.addEventListener("dragstart", cardDragStart)

document.addEventListener("mousedown", (e)=>{
    if(e.target.className == "card"){
        e.target.setAttribute("draggable","true")
    }
})




// ███████╗██╗      █████╗ ███████╗██╗  ██╗ ██████╗ █████╗ ██████╗ ██████╗ ███████╗
// ██╔════╝██║     ██╔══██╗██╔════╝██║  ██║██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝
// █████╗  ██║     ███████║███████╗███████║██║     ███████║██████╔╝██║  ██║███████╗
// ██╔══╝  ██║     ██╔══██║╚════██║██╔══██║██║     ██╔══██║██╔══██╗██║  ██║╚════██║
// ██║     ███████╗██║  ██║███████║██║  ██║╚██████╗██║  ██║██║  ██║██████╔╝███████║
// ╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝

//function called from the arrows on the side of the card, and flips the card and does stuff
//next is a boolean that decides whether you change to the previous or next card
function changeFlashcard(next){
    if (flashcardIndex < 0){flashcardIndex = 0}
    if (flashcardIndex >= listDoc.data().cards.length){flashcardIndex = listDoc.data().cards.length-1}
    if (next){

        if(listDoc.data().cards[flashcardIndex+1]){
            flashcardIndex++
            document.getElementById("flashcard-word").innerText = listDoc.data().cards[flashcardIndex].word
            document.getElementById("flashcard-definition").innerText = listDoc.data().cards[flashcardIndex].definition
            document.getElementById("flashcard-index").innerText = flashcardIndex+1;
        }
    }else{

        if(listDoc.data().cards[flashcardIndex-1]){
            flashcardIndex--
            document.getElementById("flashcard-word").innerText = listDoc.data().cards[flashcardIndex].word
            document.getElementById("flashcard-definition").innerText = listDoc.data().cards[flashcardIndex].definition
            document.getElementById("flashcard-index").innerText = flashcardIndex+1;
        }
    }
}

//saves the flashcard index to localStorage, i don't want to store it in firebase, it's not that important anyways
window.addEventListener("unload", ()=>{
    localStorage.setItem("flashcard-index", `${flashcardIndex}`);
})

//sets the flashcard index on load
window.addEventListener("load", ()=>{
    if(parseInt(localStorage.getItem("flashcard-index"))){
        flashcardIndex =parseInt(localStorage.getItem("flashcard-index"))
    }
})

//  ██████╗ ██╗   ██╗██╗███████╗    ███╗   ███╗ ██████╗ ██████╗ ███████╗
// ██╔═══██╗██║   ██║██║╚══███╔╝    ████╗ ████║██╔═══██╗██╔══██╗██╔════╝
// ██║   ██║██║   ██║██║  ███╔╝     ██╔████╔██║██║   ██║██║  ██║█████╗
// ██║▄▄ ██║██║   ██║██║ ███╔╝      ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝
// ╚██████╔╝╚██████╔╝██║███████╗    ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗
//  ╚══▀▀═╝  ╚═════╝ ╚═╝╚══════╝    ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝

//localstorage to store whether the card mode is open, or the quiz mode
let listCardQuizMode = localStorage.getItem("listCardQuizMode") ?? "card"
let quizWordDefinitionMode = localStorage.getItem("quizWordDefinitionMode") ?? "word"


window.addEventListener("load",()=>{

    updateListCardQuizMode()
    document.getElementById("list-card-toggle").addEventListener('click',()=>{
        listCardQuizMode = "card"
        localStorage.setItem("listCardQuizMode",listCardQuizMode)
        updateListCardQuizMode()
    })
    document.getElementById("list-quiz-toggle").addEventListener('click',()=>{
        listCardQuizMode = "quiz"
        localStorage.setItem("listCardQuizMode",listCardQuizMode)
        updateListCardQuizMode()
    })
    document.getElementById("quiz-word-definition-toggle").addEventListener('click', ()=>{
        localStorage.setItem("quizWordDefinitionMode",quizWordDefinitionMode == "word" ? "definition" : "word")
        quizWordDefinitionMode = quizWordDefinitionMode == "word" ? "definition" : "word"
        refreshQuizAnswers()
    })
})

//changes the mode, by toggling visibility, and changing the buttons that are selected
function updateListCardQuizMode(){
    if (listCardQuizMode == "card"){
        document.getElementById("list-card-toggle").style.border = "2px solid var(--accent-1)"
        document.getElementById("list-quiz-toggle").style.border = "1px solid var(--border-1)"
        document.getElementById("list-card-container").style.display = "block"
        document.getElementById("list-quiz-container").style.display = "none"
    }else{
        document.getElementById("list-quiz-toggle").style.border = "2px solid var(--accent-1)"
        document.getElementById("list-card-toggle").style.border = "1px solid var(--border-1)"
        document.getElementById("list-quiz-container").style.display = "block"
        document.getElementById("list-card-container").style.display = "none"
    }
}



//terrible code for quiz mode
let quizPreviousWord;
function refreshQuizAnswers(){
    //random index from length of array
    let quizWord = Math.floor(Math.random()*listDoc.data().cards.length);
    //stores correct answer
    //this means that you can cheat if you know how to code, but it's not like you win anything from it
    let correctQuizAnswer = ((listDoc.data().cards.length >= 4) ?  Math.floor(Math.random()*4)  : Math.floor(Math.random()*listDoc.data().cards.length));
    //keeps choosing random words if the word happens to be the same as the previous one
    while(quizWord == quizPreviousWord){
        quizWord = Math.floor(Math.random()*listDoc.data().cards.length);
    }
    //sets the previous word after we used it
    quizPreviousWord = quizWord

    //array of ansers
    let quizAnswers = [quizWord]
    if(quizWordDefinitionMode == "word"){
        document.getElementById("quiz-word").innerText = listDoc.data().cards[quizWord].word;
    }else{
        document.getElementById("quiz-word").innerText = listDoc.data().cards[quizWord].definition;
    }
    

    //removes all of them first, from the previous options
    for(let quizAnswer = 0; quizAnswer < document.getElementsByClassName("quiz-answer").length; quizAnswer ++) {
        document.getElementsByClassName("quiz-answer")[quizAnswer].style.display = "none"
        document.getElementsByClassName("quiz-answer")[quizAnswer].style.border = "1px solid var(--border-1)"
    }
    //loops through the 4 choices
    for (let quizAnswer = 0; quizAnswer < ((listDoc.data().cards.length < 4) ? listDoc.data().cards.length : 4); quizAnswer++) {
        //if it isn't te correct answer
        if (quizAnswer != correctQuizAnswer) {
            document.getElementsByClassName("quiz-answer")[quizAnswer].style.display = "block"
            let currentAnswer = Math.floor(Math.random() * listDoc.data().cards.length);
            //choses a random one that isn't any of the previous answers
            while (quizAnswers.includes(currentAnswer)) {
                currentAnswer = Math.floor(Math.random() * listDoc.data().cards.length)
            }
            //appends this answer to that array
            quizAnswers.push(currentAnswer);
            //changes the html
            document.getElementsByClassName("quiz-answer")[quizAnswer].innerText = (quizWordDefinitionMode == "word") ? listDoc.data().cards[currentAnswer].definition : listDoc.data().cards[currentAnswer].word;
            //when it's clicked, all it does is get a red border
            document.getElementsByClassName("quiz-answer")[quizAnswer].onclick = () => {
                document.getElementById(`quiz-definition-${quizAnswer}`).style.border = "2px solid var(--wrong)"
            }
        } else {
            //when you click the correct answer, give a green border, and change the answers after half a second
            document.getElementsByClassName("quiz-answer")[quizAnswer].style.display = "block"
            document.getElementsByClassName("quiz-answer")[quizAnswer].innerText = (quizWordDefinitionMode == "word") ? listDoc.data().cards[quizWord].definition : listDoc.data().cards[quizWord].word;
            document.getElementsByClassName("quiz-answer")[quizAnswer].onclick =
                () => {
                    document.getElementById(`quiz-definition-${quizAnswer}`).style.border = "2px solid var(--correct)";
                    setTimeout(function () {
                        refreshQuizAnswers()
                    }, 500);
                }
        }
    }
}


//also allows you to select options with number keys
window.addEventListener("keydown",(e)=>{
    if(listCardQuizMode === "quiz" && document.activeElement == document.body && splitPath[0] == "list"){
        document.getElementById(`quiz-definition-${parseInt(e.key)-1}`).click()
    }
})



// ███████╗ ██████╗ ██╗     ██████╗ ███████╗██████╗ ███████╗
// ██╔════╝██╔═══██╗██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
// █████╗  ██║   ██║██║     ██║  ██║█████╗  ██████╔╝███████╗
// ██╔══╝  ██║   ██║██║     ██║  ██║██╔══╝  ██╔══██╗╚════██║
// ██║     ╚██████╔╝███████╗██████╔╝███████╗██║  ██║███████║
// ╚═╝      ╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝


//unsubscribe folder variables
var unsubscribeFolderView;
var unsubscribeFolderListView;
//folder doc for functions to access
var folderDoc;
var folderLists;
var previousFolderRoles;

function updateFolderView(id){
    unsubscribeFolderView?.();
    unsubscribeFolderListView?.();

    //also resets the content that is in them
    document.querySelector("#content-folder .content-header").innerHTML = "<span class='loader'></span>";
    document.querySelector("#folder-settings-panel h1").innerHTML = "<span class='loader'></span>";
    document.getElementById("folder-list-container").innerHTML = "<div class='folder-list loader'></div>";
    document.querySelector("#folder-roles-list").innerHTML = "<span class='loader'></span>"
    document.getElementById("folder-delete-btn").style.display = "none"
    document.getElementById("folder-edit-btn").style.display = "none"
    document.getElementById("folder-settings").style.display = "none"

    unsubscribeFolderView = firestore.collection('folders').doc(id)
        .onSnapshot((doc) => {
            if(doc.exists){
                folderDoc = doc;
                //changes the web page title
                document.title = doc.data().name + " - Cartographer"
                //header of the list thing
                document.querySelector("#content-folder .content-header").innerText = doc.data().name;
                //header in the settings panel
                document.querySelector("#folder-settings-panel h1").innerText = doc.data().name;
                //only shows the delete button if you are the creator, there isn't meant for security because people can change the css,
                    //but only so that people don't really need to see something they can't press.

                    //in the folder settings popup, show the settings if creator
                if(doc.data().roles[uid] === "creator"){
                    document.getElementById("folder-delete-btn").style.display = "grid"
                }else{
                    document.getElementById("folder-delete-btn").style.display = "none"
                }
                if(doc.data().roles[uid] !== "viewer"){
                    document.getElementById("folder-edit-btn").style.display = "grid"
                    document.getElementById("folder-settings").style.display = "flex"
                }else{
                    document.getElementById("folder-edit-btn").style.display = "none"
                    document.getElementById("folder-settings").style.display = "none"
                }

                updateFolderLists(id)

                //same thing as the users thing, changes the styles of public checkbox depending on if it's checked
                document.querySelector("#folder-toggle-public-btn").innerHTML = doc.data().public ? "✔︎" : ""
                document.querySelector("#folder-toggle-public-btn").style.backgroundColor = doc.data().public ? "var(--accent-1)" : "var(--background-1)"
                document.querySelector("#folder-toggle-public-btn").style.color = doc.data().public ? "var(--background-1)" : "var(--foreground-1)"
                document.querySelector("#folder-toggle-public-btn").style.border = doc.data().public ? "none" : "1px solid var(--border-1)"


                //updates roles, see user function, it's the same
                if(doc.data().roles != previousFolderRoles){

                    let names = Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)}).map(([uid,role])=>{
                        return firebase.functions().httpsCallable('getDisplayName')({uid: uid})
                    })
                    Promise.allSettled(names).then((result)=>{
                        document.querySelector("#folder-roles-list").innerHTML = result.map(({value:data}, index) => {
                            if(Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][0] != uid) {
                                return (`
                                    <div class="roles-list-item horizontal">
                                    <span>${data?.data?.name?.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') ?? "Unknown"}</span>
                                    <div class="spacer"></div>
                                    <select class="roles-list-select" onchange="let updatedRoles = folderDoc.data().roles;updatedRoles[Object.entries(folderDoc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[${index}][0]] = this.options[this.selectedIndex].value;firestore.collection('folders').doc(splitPath[1]).set({roles:updatedRoles},{merge:true}) ">
                                    <option value="viewer" ${Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][1] == "viewer" ? "selected" : ""}>viewer</option>
                                    <option value="editor" ${Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][1] == "editor" ? "selected" : ""}>editor</option>
                                    <option value="creator" ${Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][1] == "creator" ? "selected" : ""}>creator</option>
                                    </select>
                                    <button class="roles-list-delete-btn" onclick="let deletedRoles = folderDoc.data().roles;delete deletedRoles[Object.entries(folderDoc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[${index}][0]];firestore.collection('folders').doc(splitPath[1]).update({roles:deletedRoles})">×</button>
                                    </div>
                                    `)
                            }else{
                                return (`
                                    <div class="roles-list-item horizontal">
                                    <span>${data?.data?.name?.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') ?? "Unknown"}</span>
                                    <div class="spacer"></div>
                                    </div>
                                    `)
                            }
                        }).join("  ")
                    })
                }
                previousFolderRoles = doc.data().roles;

                if(userDoc){
                    document.querySelector("#content-folder .favorites-toggle svg").style.fill = userDoc?.data()?.favoriteFolders?.includes(splitPath[1]) ? "var(--accent-1)" : "none"
                    document.querySelector("#content-folder .favorites-toggle svg").style.stroke = userDoc?.data()?.favoriteFolders?.includes(splitPath[1]) ? "var(--accent-1)" : "var(--foreground-1)"
                }

            }
        },(error) => {
            //does this when there is a error, probably because it was deleted and sets everything to placeholders
            document.querySelector("#content-folder .content-header").innerHTML = "placeholder"
            document.querySelector("#folder-settings-panel h1").innerHTML = "placeholder";
            console.error(error);
            //changes it back to welcome and refreshes the page
            window.history.pushState("","","/welcome");
            updateWindows();
        })
}


//updates the lists shown in the folder
function updateFolderLists(id){
    unsubscribeFolderListView = firestore.collection("lists")
        .where(`folder`,'==',`${id}`)
        .onSnapshot((querySnapshot)=>{
            folderLists = querySnapshot.docs
            //maps it to elements, and sorts them alphabetically
            let items = querySnapshot.docs.sort((a,b)=>{return((a.data().name.toLowerCase() < b.data().name.toLowerCase()) ? -1 : 1)}).map(doc => {
                return(doc.exists ? `
                    <div class="folder-list" onclick="window.history.pushState('','','/list/${doc.id}'); updateWindows()">
                    <h3>${doc.data().name.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</h3>
                    <p>${doc.data().cards.length} ${(doc.data().cards.length == 1) ? "term" : "terms"}</p>
                    </div>
                    ` : "  ")
            })
            //puts it in the element
            document.getElementById("folder-list-container").innerHTML = items.join(" ")

        },(error) => {
            console.log(error)
        })
}

//toggles whether folder is in favorites,
    //same as toggleFavoriteList()
function toggleFavoriteFolder(){
    if(userDoc?.data()?.favoriteFolders?.includes(splitPath[1])){
        let editedFavorites = userDoc.data().favoriteFolders.filter(a=>{
            return a!=splitPath[1]
        })
        firestore.collection("users").doc(uid).update({
            favoriteFolders:editedFavorites
        })
    }else{
        firestore.collection("users").doc(uid).update({
            favoriteFolders:userDoc?.data()?.favoriteFolders?.concat([splitPath[1]]) ?? [splitPath[1]]
        })
    }
}

window.addEventListener('load',()=>{
    //event listener for the button that edits the list, and puts that data on firestore
    document.querySelector("#folder-edit-btn").addEventListener('click',()=>{
        let newName = window.prompt("Rename Folder:",folderDoc.data().name);
        if(newName || newName ==""){
            firestore.collection("folders").doc(splitPath[1]).update(
                {
                    name: newName,
                }
            )
        }
    })
    //for deleting the list
    document.querySelector('#folder-delete-btn').addEventListener('click',()=>{
        if(window.confirm("Delete this folder? it will also delete all lists in this folder.")){
            if(folderLists) {
                let batchDelete = firestore.batch();
                for (let doc of folderLists) {
                    batchDelete.delete(firestore.collection("lists").doc(doc.id))
                }
                batchDelete.commit()
            }
            firestore.collection("folders").doc(splitPath[1]).delete()
            //hides the panel when you click delete so you don't need to click outside because it's useless now that you have delete the list
            let panelContainer = document.getElementById("panel-container");
            panelContainer.classList.add("hidden");
            for (let panel of panelContainer.children) {
                panel.classList.add("hidden");
            }

        }
    })
    document.getElementById('add-folder-list-btn').addEventListener('click', ()=>{
        //see if this gives a error, if it does it's probably because
        //you are logged out and then shows you the log in screen
        try{
            //cause error if you don't have uid
            if(!uid){lmao}
            //prompt user to enter name of list
            let name = window.prompt("Enter name for list", "New List")
            if (name){
                //adds a document
                firestore.collection("lists").add({
                    name: name,
                    public:false,
                    folder:splitPath[1],
                    roles: {
                        [uid]: 'creator',
                    },
                    cards:[]
                }).catch(error => {
                    console.log(error)})
            }
        }catch{
            //shows sign in panel
            document.getElementById('panel-container').classList.remove("hidden");
            document.getElementById("sign-in-panel").classList.remove("hidden");
        }
    })
})



// ███████╗ █████╗ ██╗   ██╗ ██████╗ ██████╗ ██╗████████╗███████╗███████╗
// ██╔════╝██╔══██╗██║   ██║██╔═══██╗██╔══██╗██║╚══██╔══╝██╔════╝██╔════╝
// █████╗  ███████║██║   ██║██║   ██║██████╔╝██║   ██║   █████╗  ███████╗
// ██╔══╝  ██╔══██║╚██╗ ██╔╝██║   ██║██╔══██╗██║   ██║   ██╔══╝  ╚════██║
// ██║     ██║  ██║ ╚████╔╝ ╚██████╔╝██║  ██║██║   ██║   ███████╗███████║
// ╚═╝     ╚═╝  ╚═╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝╚══════╝

function updateFavorites(lists,folders){
    console.log(lists)
    console.log(folders)
    console.trace("update")
    document.getElementById("favorites-list-container").innerHTML = "<div class='folder-list loader'></div>"
    document.getElementById("favorites-folder-container").innerHTML = "<div class='folder-list loader'></div>"
    if(lists){
        //make an array of all the lists needed to be gotten
        let listGets = lists.map((list)=>{
            return firestore.collection("lists").doc(list).get()
        })

        //map them and sorts them
        Promise.allSettled(listGets).then((listDocs)=>{
            let listItems = listDocs.sort(({value:a},{value:b})=>{return((a?.data().name.toLowerCase() < b?.data().name.toLowerCase()) ? -1 : 1)})?.map(({value:doc}) => {
                return(doc?.exists ? `
                    <div class="folder-list" onclick="window.history.pushState('','','/list/${doc.id}'); updateWindows()">
                    <h3>${doc.data().name.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</h3>
                    <p>${doc.data().cards.length} ${(doc.data().cards.length == 1) ? "term" : "terms"}</p>
                    </div>
                    ` : "  ")
            })
            //adds it to container
            document.getElementById("favorites-list-container").innerHTML = listItems.join(" ")
        })
    }else{
        document.getElementById("favorites-list-container").innerHTML = "<div class='folder-list loader'></div>"
    }


    if(folders){
        //same as lists
        let folderGets = folders.map((folder)=>{
            return firestore.collection("folders").doc(folder).get()
        })

        Promise.allSettled(folderGets).then((folderDocs)=>{
            let folderItems = folderDocs.sort(({value:a},{value:b})=>{return((a?.data().name.toLowerCase() < b?.data().name.toLowerCase()) ? -1 : 1)})?.map(({value:doc}) => {
                return(doc?.exists ? `
                    <div class="folder-list" onclick="window.history.pushState('','','/folder/${doc.id}'); updateWindows()">
                    <h3>${doc.data().name.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</h3>
                    </div>
                    ` : "  ")
            })
            document.getElementById("favorites-folder-container").innerHTML = folderItems.join(" ")
        })
    }else{
        document.getElementById("favorites-folder-container").innerHTML = "<div class='folder-list loader'></div>"
    }
}

