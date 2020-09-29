class Fetcher {
    constructor(rateInMilliseconds) {
        this.reqQueue = [];
        this.rateLimitMs = rateInMilliseconds;

        setInterval(() => {
            if(this.reqQueue.length > 0){
                let reqArr = this.reqQueue.shift();
                fetch(reqArr[0])
                .then((res) => {
                    if (!res.ok) {
                        console.log(res);
                        return new Error(res);
                    }
                    return res.json();
                })
                .then(reqArr[1])
                .catch((err) => { console.log(err); });
            }
        }, this.rateLimitMs)
    }

    queueRequest(endp, callback) {
        this.reqQueue.push([endp, callback]);
    };
}

let target = document.querySelector("#jsTarget");

let fetcher = new Fetcher(150);

class ManaButtons{
    btnArr;
    btnStates;
    btnStringModifiers;
    constructor(){
        this.btnArr = [document.getElementById("anyBtn"), document.getElementById("wBtn"), 
                       document.getElementById("uBtn"), document.getElementById("bBtn"),
                       document.getElementById("rBtn"), document.getElementById("gBtn"),
                       document.getElementById("cBtn")
                    ];
        this.btnStates = [false,false,false,false,false,false,false];
        this.btnStringModifiers = [ ["<=", ":"], ["w", ""], ["u", ""], ["b", ""], ["r", ""], ["g", ""], ["c", ""] ];
    }

    retrieveButtonStates(){
        this.btnArr.forEach( (elem, i) => {
            this.btnStates[i] = elem.getAttribute("class").search("active") > -1;
        });
    }

    getSearchString() {
        this.retrieveButtonStates();
        let partial = "c";
        this.btnStates.forEach( (elem, i) => {
            partial += elem == true ? this.btnStringModifiers[i][0] : this.btnStringModifiers[i][1];
        });
        if( partial == "c:" || partial == "c<="){ return "";}
        return partial;
    }
}

class PriceCapInput{
    validatorRegex;
    priceCapInp;
    constructor(){
        this.validatorRegex = /^\$?[0-9]+(\.[0-9][0-9])?$/;
        this.priceCapInp = document.getElementById("priceCapInput");
    }

    getSearchString(){
        let out = this.priceCapInp.value;
        if( this.validatorRegex.test(out) ){
            return `usd<=${out}`;
        } else{ 
            return "";
        }
    }
}

class Dropdown{
    listContainer;
    listOptions;
    searchPartial;
    selectedBox;
    constructor(listTarget, options, searchBase, drop){
        this.searchPartial = searchBase;
        this.listContainer = listTarget;
        this.listOptions = options;
        this.selectedBox = drop;
        this.selectedText = null;

        this.listOptions.forEach( (type) => {
            let tBtn = document.createElement('button');
            tBtn.setAttribute("class", "dropdown-item");
            tBtn.setAttribute("type", "button");
            tBtn.innerText = type;
            this.listContainer.appendChild(tBtn);

            tBtn.addEventListener('click', (e) => {
                console.log(e);
                this.selectedBox.innerText = e.target.innerText;
                this.selectedText = e.target.innerText;
            });
        });
    }

    getSearchString(){
        return ( this.selectedText === null ) ? "" : (this.searchPartial + this.selectedText);
    }
}

class TextSearchWidget{
    textSearchDrop;
    oracleTextSelection;
    cardNameSelection;
    searchTextInput;
    autoCompleteTextDrop;
    currentSelection;
    constructor(){
        this.textSearchDrop = document.getElementById("textSearchDrop");
        this.cardNameSelection = document.getElementById("cardNameSelection");
        this.oracleTextSelection = document.getElementById("oracleTextSelection");
        this.searchTextInput = document.getElementById("searchTextInput");
        this.autoCompleteTextDrop = document.getElementById("autoCompleteText");
        this.currentSelection = this.textSearchDrop.innerText;
        this.autoCompleteTextDrop.classList.add("show");
        
        this.cardNameSelection.addEventListener('click', (e) => {
            console.log(e.target);
            this.currentSelection = e.target.innerText;
            this.textSearchDrop.innerText = e.target.innerText;
            this.autoCompleteTextDrop.classList.add("show");
        });

        this.oracleTextSelection.addEventListener('click', (e) => {
            console.log(e.target);
            this.currentSelection = e.target.innerText;
            this.textSearchDrop.innerText = e.target.innerText;
            this.autoCompleteTextDrop.setAttribute("class", "dropdown-menu");
        });

        this.searchTextInput.addEventListener('keydown', (e) => {
            //autocomplete suggestions
            if( this.currentSelection == "Card Name" ){
                let qry = "https://api.scryfall.com/cards/autocomplete?q=" + e.target.value;
                fetcher.queueRequest(qry, (data) => {
                    let suggestions = data.data;

                    //this.autoCompleteTextDrop.display = "none";
                    this.autoCompleteTextDrop.innerHTML = "";
                    suggestions.forEach( (s)=> {
                        let tBtn = document.createElement("button");
                        tBtn.setAttribute("class", "dropdown-item");
                        tBtn.setAttribute("type", "button");
                        tBtn.innerText = s;

                        tBtn.addEventListener('click', (e) => {
                            this.searchTextInput.value = e.target.innerText;
                        });

                        this.autoCompleteTextDrop.appendChild(tBtn);
                    });
                    //this.autoCompleteTextDrop.display = "block";
                });
            }
        });
    }

    getSearchString(){
        let searchingCardName = ( this.currentSelection == "Card Name" );
        let str = searchingCardName ? "" : 'o:"';
        str += searchingCardName ? this.searchTextInput.value : this.searchTextInput.value + '"';
        return str;
    }
}

class SearchButton{
    manaButtons;
    searchBtn;
    searchComponents;
    constructor(){
        this.manaButtons = new ManaButtons();
        this.priceCapInp = new PriceCapInput();
        this.searchBtn = document.getElementById("searchBtn");
        this.searchComponents = [];

        this.searchBtn.addEventListener("click", (this.clickHandler).bind(this) );
    }

    registerComponent(c){
        this.searchComponents.push(c);
    }

    clickHandler(){
        let queryStr = "https://api.scryfall.com/cards/search?order=cmc&q=is:commander";
        this.searchComponents.forEach((comp) => {
            if( comp.getSearchString() != "" ){
                queryStr += encodeURIComponent( " " + comp.getSearchString() );
            }
        })
        console.log(queryStr);

        fetcher.queueRequest(queryStr, displayResults);
    }
}

class LuckyButton {
    luckyBtn;
    constructor(){
        this.luckyBtn = document.getElementById("luckyBtn");
        this.luckyBtn.addEventListener('click', (this.clickHandler).bind(this) );
    }

    clickHandler(){
        const queryStr = "https://api.scryfall.com/cards/random?q=is%3Acommander";
        fetcher.queueRequest(queryStr, displayResults);
    }
}

let searchBtn = new SearchButton();
let luckyBtn = new LuckyButton();

function displayResults(data){
    console.log(data);
    target.innerHTML = "";

    function displayCardObject(card){
        let nImg = document.createElement("IMG");
        nImg.src = (card.card_faces === undefined) ? card.image_uris.small : card.card_faces[0].image_uris.small;
        target.appendChild( nImg );
    };
    if( data.data == undefined ){ displayCardObject(data); }
    else{ data.data.forEach(displayCardObject); }
}

window.onload = function(){
    //get data for our dropdowns
    let creatureTypes = undefined;
    let cardTypes = ["Card Type", "Creature", "Enchantment", "Artifact", "Instant", "Sorcery", "Land"];
    let cmcTypes = ["CMC", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];

    fetcher.queueRequest("https://api.scryfall.com/catalog/creature-types", (data) => {
        console.log(data.data);
        creatureTypes = data.data;

        //add data to each of the dropdowns
        if( creatureTypes != undefined ){ 
            let creatureDrop = new Dropdown( document.getElementById("creatureTypesList"), creatureTypes, 
                                "t:", document.getElementById("creatureTypesDrop") );
            searchBtn.registerComponent(creatureDrop);
        } else{ console.log("Attempt to retrieve Card Types from Scryfall failed!!!"); }
        let cardDrop = new Dropdown(document.getElementById("cardTypeList"), cardTypes, "t:", document.getElementById("cardTypesDrop"));
        let cmcDrop = new Dropdown(document.getElementById("cmcTypeList"), cmcTypes, "cmc=", document.getElementById("cmcTypesDrop"));

        //register all of the search componenets
        searchBtn.registerComponent(new ManaButtons());
        searchBtn.registerComponent(new PriceCapInput());
        searchBtn.registerComponent(new TextSearchWidget());
        searchBtn.registerComponent(cardDrop);
        searchBtn.registerComponent(cmcDrop);
    });

};