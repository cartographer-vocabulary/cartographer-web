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
    //gets data and changes the content
    firestore.collection("lists").doc(id).get().then((listDoc)=>{
        listRole = listDoc.data().roles[uid];
        unsubscribeParentFolder = firestore.collection("folders").doc(listDoc.data().folder)
            .onSnapshot((doc)=>{
                parentFolderRole = doc.data().roles[uid]
                try{
                    let highestRole = "viewer";
                    if (listRole === "editor" || parentFolderRole === "editor") {
                        highestRole = "editor"
                    }
                    if (listRole === "creator" || parentFolderRole === "creator") {
                        highestRole = "creator"
                    }
                    updateListViewableContent(highestRole, listDoc)
                }catch(err){
                    updateListViewableContent(doc.data().roles[uid], listDoc)
                }
            },(err)=>{})
    })
    firestore.collection("lists").doc(id).get().then((listDoc)=> {
        unsubscribeAvailableFolders = firestore.collection("folders")
            .where(`roles.${uid}`, 'in', ["creator", "editor"])
            .onSnapshot((querySnapshot) => {
                let items = querySnapshot.docs.sort((a, b) => {
                    return ((a.data().roles[uid] < b.data().roles[uid]) ? -1 : 1)
                }).map((doc) => {
                    return (`<option value="${doc.id}">${doc.data().name}</option>`)
                })
                items.unshift("<option value=''>None</option>")
                document.getElementById("list-folder-select-dropdown").innerHTML = items.join("  ");
                document.getElementById("list-folder-select-dropdown").value = listDoc.data().folder ?? ""
            })
    })
    unsubscribeListView = firestore.collection("lists").doc(id)
        .onSnapshot((doc) => {
            listDoc = doc;

            let containerElement = document.querySelector("#content-list")
            let scrollToBottom = containerElement.scrollHeight - containerElement.clientHeight <= containerElement.scrollTop + 80;
            
            let focusedElement = document?.activeElement;
            let focusedElementId = focusedElement?.closest(".card")?.id
            let focusedElementType = focusedElement.tagName
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
            listRole = doc.data().roles[uid];

            if(doc.data().roles != previousListRoles){

                let names = Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)}).map(([uid,role])=>{
                    return firebase.functions().httpsCallable('getDisplayName')({uid: uid})
                })
                Promise.all(names).then((result)=>{
                    document.querySelector("#list-roles-list").innerHTML = result.map((data, index) => {
                        if(Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][0] != uid) {
                            return (`
                            <div class="roles-list-item horizontal">
                                <span>${data.data.name}</span>
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
                            return (`
                            <div class="roles-list-item horizontal">
                                <span>${data.data.name}</span>
                                <div class="spacer"></div>
                            </div>
                            `)
                        }
                    }).join("  ")
                })
            }

            previousListRoles = doc.data().roles[uid];
            //header of the list thing
            document.title = doc.data().name + " - Cartographer";
            document.querySelector("#content-list .content-header").innerHTML = doc.data().name;
            //header in the settings panel
            document.querySelector("#list-settings-panel h1").innerHTML = doc.data().name;
            document.querySelector("#list-toggle-public-btn").innerHTML = doc.data().public ? "✔︎" : ""
            document.querySelector("#list-toggle-public-btn").style.backgroundColor = doc.data().public ? "var(--accent-1)" : "var(--background-1)"
            document.querySelector("#list-toggle-public-btn").style.color = doc.data().public ? "var(--background-1)" : "var(--foreground-1)"
            document.querySelector("#list-toggle-public-btn").style.border = doc.data().public ? "none" : "1px solid var(--border-1)"
            if(doc.data().cards[flashcardIndex]) {
                document.getElementById("flashcard-word").innerHTML = doc.data().cards[flashcardIndex].word
                document.getElementById("flashcard-definition").innerHTML = doc.data().cards[flashcardIndex].definition
                document.getElementById("flashcard-index").innerHTML = flashcardIndex + 1;
            }else{
                document.getElementById("flashcard-word").innerHTML = "No card selected"
                document.getElementById("flashcard-definition").innerHTML = "No card selected"
                document.getElementById("flashcard-index").innerHTML = "--";
            }
            if(doc.data().cards.length >= 2) {
                refreshQuizAnswers();
            }else{
                document.getElementById("quiz-word").innerHTML = "--"
                for(let quizAnswer = 0; quizAnswer < document.getElementsByClassName("quiz-answer").length; quizAnswer ++) {
                    document.getElementsByClassName("quiz-answer")[quizAnswer].style.display = "block"
                    document.getElementsByClassName("quiz-answer")[quizAnswer].innerHTML= "--"
                    document.getElementsByClassName("quiz-answer")[quizAnswer].style.border = "1px solid var(--border-1)"
                    document.getElementsByClassName("quiz-answer")[quizAnswer].onclick = ()=>{}
                }
            }
            if(scrollToBottom && containerElement.scrollTop != 0){
                containerElement.scrollTop = containerElement.scrollHeight - containerElement.clientHeight;
            }

            if(focusedElementId && focusedElementType){
                document.getElementById(focusedElementId).querySelector(focusedElementType).focus();
            }
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

function updateListViewableContent(role,doc){
    if(role == "creator"){
        document.getElementById("list-delete-btn").style.display = "grid"
    }else{
        document.getElementById("list-delete-btn").style.display = "none"
    }
    let items
    if(role != "viewer") {
        items = doc.data().cards.map((card, index) => {
            return (`<div class="card" id="${index}"><div class="horizontal"><h3 contenteditable="true" onblur="updateCardWord(this.innerText, parseInt(this.parentNode.parentNode.id))" onbeforeunload="return this.onblur" onpaste="setTimeout(()=>{this.innerHTML=this.innerText},10)">${card.word.replace('<','&lg;').replace('>','$gt;').replace('&','&amp;')}</h3><div class="spacer"></div><button class="card-delete-btn" onclick="deleteCard(this)" >×</button></div><hr><p contenteditable="true" onblur="updateCardDefinition(this.innerText, parseInt(this.parentNode.id))"  onbeforeunload="this.onblur" onpaste="setTimeout(()=>{this.innerHTML=this.innerText},10)">${card.definition.replace('<','&lg;').replace('>','$gt;').replace('&','&amp;')}</p></div>`)
        })
        document.getElementById("list-edit-btn").style.display = "grid"
        document.getElementById("list-folder-select-dropdown").parentNode.style.display = "flex"
        document.getElementById("add-card-container").style.display = "flex"
    }else{
        items = doc.data().cards.map((card, index) => {
            return (`<div class="card" id="${index}"><div class="horizontal"><h3>${card.word.replace('<','&lg;').replace('>','$gt;').replace('&','&amp;')}</h3></div><hr><p>${card.definition.replace('<','&lg;').replace('>','$gt;').replace('&','&amp;')}</p></div>`)
        })
        document.getElementById("list-edit-btn").style.display = "none"
        document.getElementById("list-folder-select-dropdown").parentNode.style.display = "none"
        document.getElementById("add-card-container").style.display = "none"
    }

    document.getElementById("card-container").innerHTML = items.join("  ")
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
        }else if((e.key == 'Enter' || e.keyCode ===13)){
            cardDefinitionElement.focus()
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
        }else if((e.key === 'Enter' || e.keycCode === 13)){
            cardWordElement.focus()
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
    word.trim()
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

function updateListFolder(folder){
    firestore.collection("lists").doc(splitPath[1]).update(
        {
            folder: folder ||  firebase.firestore.FieldValue.delete()
        }
    )
}

let cardXOffset=0; //the default offset of the elements
let cardYOffset=0;
let cardDragIndex=0;
let cardDragElement;
let mouseX;
let mouseY;
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
        cardDragElement = element
        cardXOffset = e.pageX;
        cardYOffset = e.pageY + document.getElementById("content-list").scrollTop;
        mouseX = e.pageX;
        mouseY = e.pageY;
        document.addEventListener('mousemove', cardDrag);
        document.addEventListener("mouseup", cardDragEnd);
        document.addEventListener('mouseover',cardDragIndexSet);
        document.getElementById("content-list").addEventListener("scroll",cardDrag)
        element.style.transition = "transform 0s ease-in-out, box-shadow 0.15s ease-in-out, background-color 0.15s ease-in-out";
        element.style.zIndex = "10";
        element.style.pointerEvents = "none";
        element.style.boxShadow = "0px 10px 20px var(--shadow-2)"
        if(e.stopPropagation) e.stopPropagation();
        if(e.preventDefault) e.preventDefault();
        e.cancelBubble=true;
        e.returnValue=false;
        return false;
    }
}

function cardDrag(e){
    //moves the element to the mouse
    mouseX = e.pageX ?? mouseX;
    mouseY = e.pageY ?? mouseY;
    cardDragElement.style.boxShadow = "0px 10px 20px var(--shadow-2)"
    cardDragElement.style.transform = `translate(${(e.pageX ?? mouseX) - cardXOffset}px,${ (e.pageY ?? mouseY) - cardYOffset + document.getElementById("content-list").scrollTop}px) scale(1.01)`

}

function cardDragIndexSet(e){
    document.getElementById(`${cardDragIndex}`).style.backgroundColor = "var(--background-1)"
    document.getElementById(`${cardDragIndex}`).style.boxShadow = ""
    document.getElementById(`${cardDragIndex}`).style.transform = ""
    if(e.target.className === "card" || e.target.parentNode.className === "card" || e.target.parentNode.parentNode.className === "card"){
        cardDragIndex = parseInt(e.target.id) || parseInt(e.target.closest(".card").id);
        if(e.target.className === "card"){
            e.target.style.backgroundColor = "var(--background-2)"
            e.target.style.boxShadow = "inset 0px 8px 15px var(--shadow-3)"
            e.target.style.transform = "scale(0.95)"
        }else{
            e.target.closest(".card").style.backgroundColor = "var(--background-2)"
            e.target.closest(".card").style.boxShadow = "inset 0px 8px 15px var(--shadow-3)"
            e.target.closest(".card").style.transform = "scale(0.95)"
        }
    }else{
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
    document.getElementById("content-list").removeEventListener('scroll',cardDrag);
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
    if (flashcardIndex < 0){flashcardIndex = 0}
    if (flashcardIndex >= listDoc.data().cards.length){flashcardIndex = listDoc.data().cards.length-1}
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


let unsubscribeUserDoc;
let userDoc;
let uiTheme = localStorage.getItem("uiTheme") ?? "automatic";
let colorScheme = localStorage.getItem("colorScheme") ?? "default";
function updateUserInfo(){
    unsubscribeUserDoc && unsubscribeUserDoc();
    firestore.collection('users').doc(uid)
        .onSnapshot((doc)=>{
            userDoc = doc
            for(let userDisplayName of document.getElementsByClassName("user-full-name")){
                userDisplayName.innerHTML = doc.data().displayName;
            }
            for(let themeBtn of document.getElementsByClassName("theme-toggle")){
                themeBtn.style.backgroundColor = ""
                themeBtn.style.border = ""
            }

            for(let colorSchemeBtn of document.getElementsByClassName("color-scheme")){
                colorSchemeBtn.style.border = ""
            }

            if(doc.data().theme){
                uiTheme = doc.data().theme
                localStorage.setItem("uiTheme",uiTheme)
                document.getElementById(`${uiTheme}-mode`).style.backgroundColor = "var(--accent-1)"
                document.getElementById(`${uiTheme}-mode`).style.border = "1px solid var(--accent-1)"
                document.getElementById("theme-stylesheet").href = `/themes/${colorScheme}-${uiTheme}.css`
            }

            if(doc.data().colorScheme){
                colorScheme = doc.data().colorScheme
                localStorage.setItem("colorScheme",colorScheme)
                document.getElementById(`${colorScheme}-color-scheme`).style.border = "2px solid var(--accent-1)"
                document.getElementById("theme-stylesheet").href = `/themes/${colorScheme}-${uiTheme}.css`
            }
        })
}

function updateColorScheme(name){
    colorScheme = name;
    firestore.collection('users').doc(uid).update({
        colorScheme:colorScheme
    })
}

window.addEventListener('load',()=> {
    document.getElementById("edit-user-display-name").addEventListener("click", () => {
        let newName = window.prompt("Enter new name:", userDoc.data().displayName)
        newName.trim()
        if(newName){
            firestore.collection('users').doc(uid).set({
                displayName:`${newName}`
            },{merge:true})
        }
    })
    document.getElementById('automatic-mode').addEventListener("click",()=>{
        if(uiTheme != "automatic"){
            firestore.collection('users').doc(uid).update({
                theme: "automatic"
            })
        }
    })
    document.getElementById('light-mode').addEventListener("click",()=>{
        if(uiTheme != "light"){
            firestore.collection('users').doc(uid).update({
                theme: "light"
            })
        }
    })
    document.getElementById('dark-mode').addEventListener("click",()=>{
        if(uiTheme != "dark"){
            firestore.collection('users').doc(uid).update({
                theme: "dark"
            })
        }
    })
    document.getElementById("theme-stylesheet").href = `/themes/${colorScheme}-${uiTheme}.css`
})



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
            let panelContainer = document.getElementById("panel-container");
            panelContainer.style.display = "none";
            for (let panel of panelContainer.children) {
                panel.style.display = "none";
            }
        }
    })
})

let listCardQuizMode = localStorage.getItem("listCardQuizMode") ?? "card"


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
})


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
let quizPreviousWord;
function refreshQuizAnswers(){
    let quizWord = Math.floor(Math.random()*listDoc.data().cards.length);
    let correctQuizAnswer = ((listDoc.data().cards.length >= 4) ?  Math.floor(Math.random()*4)  : Math.floor(Math.random()*listDoc.data().cards.length));
    while(quizWord == quizPreviousWord){
        quizWord = Math.floor(Math.random()*listDoc.data().cards.length);
    }
    quizPreviousWord = quizWord

    let quizAnswers = [quizWord]
    document.getElementById("quiz-word").innerHTML = listDoc.data().cards[quizWord].word;

    for(let quizAnswer = 0; quizAnswer < document.getElementsByClassName("quiz-answer").length; quizAnswer ++) {
        document.getElementsByClassName("quiz-answer")[quizAnswer].style.display = "none"
        document.getElementsByClassName("quiz-answer")[quizAnswer].style.border = "1px solid var(--border-1)"
    }
    for (let quizAnswer = 0; quizAnswer < ((listDoc.data().cards.length < 4) ? listDoc.data().cards.length : 4); quizAnswer++) {
        if (quizAnswer != correctQuizAnswer) {
            document.getElementsByClassName("quiz-answer")[quizAnswer].style.display = "block"
            let currentAnswer = Math.floor(Math.random() * listDoc.data().cards.length);
            while (quizAnswers.includes(currentAnswer)) {
                currentAnswer = Math.floor(Math.random() * listDoc.data().cards.length)
            }
            quizAnswers.push(currentAnswer);
            document.getElementsByClassName("quiz-answer")[quizAnswer].innerHTML = listDoc.data().cards[currentAnswer].definition;
            document.getElementsByClassName("quiz-answer")[quizAnswer].onclick = () => {
                document.getElementById(`quiz-definition-${quizAnswer}`).style.border = "2px solid var(--wrong)"
            }
        } else {
            document.getElementsByClassName("quiz-answer")[quizAnswer].style.display = "block"
            document.getElementsByClassName("quiz-answer")[quizAnswer].innerHTML = listDoc.data().cards[quizWord].definition;
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


window.addEventListener("keydown",(e)=>{
    if(listCardQuizMode === "quiz" && document.activeElement == document.body && splitPath[0] == "list"){
        document.getElementById(`quiz-definition-${parseInt(e.key)-1}`).click()
    }
})

var unsubscribeFolderView;
var unsubscribeFolderListView;
var folderDoc;
var folderLists;
var previousFolderRoles;
function updateFolderView(id){
    unsubscribeFolderView?.();
    unsubscribeFolderListView?.();
    unsubscribeFolderView = firestore.collection('folders').doc(id)
        .onSnapshot((doc) => {
            folderDoc = doc;
            document.title = doc.data().name + " - Cartographer"
            //header of the list thing
            document.querySelector("#content-folder .content-header").innerHTML = doc.data().name;
            //header in the settings panel
            document.querySelector("#folder-settings-panel h1").innerHTML = doc.data().name;
            //only shows the delete button if you are the creator, there isn't meant for security because people can change the css,
            //but only so that people don't really need to see something they can't press.
            if(doc.data().roles[uid] === "creator"){
                document.getElementById("folder-delete-btn").style.display = "grid"
            }else{
                document.getElementById("folder-delete-btn").style.display = "none"
            }
            if(doc.data().roles[uid] !== "viewer"){
                document.getElementById("folder-edit-btn").style.display = "grid"
            }else{
                document.getElementById("folder-edit-btn").style.display = "grid"
            }
            document.getElementById("folder-list-container").innerHTML = ""
            updateFolderLists(id)

            document.querySelector("#folder-toggle-public-btn").innerHTML = doc.data().public ? "✔︎" : ""
            document.querySelector("#folder-toggle-public-btn").style.backgroundColor = doc.data().public ? "var(--accent-1)" : "var(--background-1)"
            document.querySelector("#folder-toggle-public-btn").style.color = doc.data().public ? "var(--background-1)" : "var(--foreground-1)"
            document.querySelector("#folder-toggle-public-btn").style.border = doc.data().public ? "none" : "1px solid var(--border-1)"

            if(doc.data().roles != previousFolderRoles){

                let names = Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)}).map(([uid,role])=>{
                    return firebase.functions().httpsCallable('getDisplayName')({uid: uid})
                })
                Promise.all(names).then((result)=>{
                    document.querySelector("#folder-roles-list").innerHTML = result.map((data, index) => {
                        if(Object.entries(doc.data().roles).sort((a,b)=>{return((a[1] < b[1]) ? -1 : 1)})[index][0] != uid) {
                            return (`
                            <div class="roles-list-item horizontal">
                                <span>${data.data.name}</span>
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
                                <span>${data.data.name}</span>
                                <div class="spacer"></div>
                            </div>
                            `)
                        }
                    }).join("  ")
                })
            }
            previousFolderRoles = doc.data().roles;

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

function updateFolderLists(id){
    unsubscribeFolderListView = firestore.collection("lists")
        .where(`folder`,'==',`${id}`)
        .onSnapshot((querySnapshot)=>{
            folderLists = querySnapshot.docs
            let items = querySnapshot.docs.sort((a,b)=>{return((a.data().name.toLowerCase() < b.data().name.toLowerCase()) ? -1 : 1)}).map(doc => {
                return(doc.exists ? `
                    <div class="folder-list" onclick="window.history.pushState('','','/list/${doc.id}'); updateWindows()">
                        <h3>${doc.data().name}</h3>
                        <p>${doc.data().cards.length} ${(doc.data().cards.length == 1) ? "term" : "terms"}</p>
                    </div>
                ` : "  ")
            })
            document.getElementById("folder-list-container").innerHTML = items.join(" ")

        },(error) => {
            console.log(error)
        })
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
            panelContainer.style.display = "none";
            for (let panel of panelContainer.children) {
                panel.style.display = "none";
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
            document.getElementById('panel-container').style.display = "flex";
            document.getElementById("sign-in-panel").style.display = "block";
        }
    })
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
        document.getElementById("content-folder").style.display = "none";
        unsubscribeFolderListView?.();
        unsubscribeFolderView?.();
        updateListView(splitPath[1]);


    }else if(splitPath[0] == "folder" && splitPath[1]){
        document.getElementById("content-list").style.display = "none";
        document.getElementById("content-welcome").style.display = "none";
        document.getElementById("content-folder").style.display = "block";
        unsubscribeListView?.();
        unsubscribeAvailableFolders?.();
        unsubscribeParentFolder?.();
        updateFolderView(splitPath[1]);
    }else if(splitPath[0] == "welcome"){
        document.getElementById("content-list").style.display = "none";
        document.getElementById("content-welcome").style.display = "block";
        document.getElementById("content-folder").style.display = "none";
        document.title = "Cartographer";
        unsubscribeListView?.();
        unsubscribeAvailableFolders?.();
        unsubscribeParentFolder?.();
        unsubscribeFolderView?.();
        unsubscribeFolderListView?.();
    }else{
        window.history.pushState("","","/welcome");
        document.title = "Cartographer"
        unsubscribeListView?.();
        unsubscribeAvailableFolders?.();
        unsubscribeParentFolder?.();
        unsubscribeFolderView?.();
        unsubscribeFolderListView?.();
        updateWindows();
    }
}

//when to call updateWindows() function
window.addEventListener('popstate', updateWindows);
window.addEventListener('load', updateWindows);


