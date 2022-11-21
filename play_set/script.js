import Deck from './deck.js'

const deckSlot = document.getElementById("deck")
const foundSlot = document.getElementById("found")
const addButton = document.getElementById("add-cards")
const Table = document.getElementById("table")
const Hint = document.getElementById("hint")

var inputs = document.getElementsByTagName("input")

var deck = new Deck()
var discard = []
var table = []

// shuffle the deck
deck.shuffle()


function addCards() {
	// if there are no cards in deck, just pass
	if (deck.numberOfCards === 0) {
		return; 
	}
	// remove hints
	var Hints = document.getElementsByClassName("hint");
	var numHints = Hints.length;
	for (var l=numHints-1; l >= 0; l--) {
    	Hints[l].classList.remove("hint");
	}
	// add slots
	let newSlot1 = document.createElement('div')
	let newSlot2 = document.createElement('div')
	let newSlot3 = document.createElement('div')
	newSlot1.className = "card"
	newSlot2.className = "card"
	newSlot3.className = "card"
	newSlot1.innerHTML = "<label><input type='checkbox'></label>"
	newSlot2.innerHTML = "<label><input type='checkbox'></label>"
	newSlot3.innerHTML = "<label><input type='checkbox'></label>"
	Table.appendChild(newSlot1)
	Table.appendChild(newSlot2)
	Table.appendChild(newSlot3)


	// draw cards from deck and put cards in place
	let newCard1 = deck.pop();
	let newCard2 = deck.pop();
	let newCard3 = deck.pop();
				
	newSlot1.lastChild.appendChild(newCard1.getHTML());
	newSlot2.lastChild.appendChild(newCard2.getHTML());
	newSlot3.lastChild.appendChild(newCard3.getHTML());

	// add cards to the table list
	table.push(newCard1);
	table.push(newCard2);
	table.push(newCard3);

	inputs = document.getElementsByTagName("input")

	for (var i=0; i < inputs.length; i++) {
	inputs[i].addEventListener('change', checkForSET)

	deckSlot.innerHTML = deck.numberOfCards;
	}
}

// add cards button
addButton.addEventListener('click', addCards);


function getHintIndices() {
	var inputs = document.getElementsByTagName("input")
	var indices = [];
	// check for SET
	for (var i=0; i < table.length; i++) {
		for (var j=i+1; j < table.length; j++) {
			for (var k=j+1; k < table.length; k++) {
				let card1 = table[i];
				let card2 = table[j];
				let card3 = table[k];
				if (isSet(card1, card2, card3)) {
					indices.push(i);
					indices.push(j);
					indices.push(k);
					return indices
				}
			}
		}
	}
	return indices
}

function addHint() {
	let existingHints = document.getElementsByClassName("hint"); 
	let newHintNumber = existingHints.length;
	let indices = getHintIndices();
	if (indices.length === 0) {
		addButton.classList.add("hint");
	} else if (newHintNumber === 3) {
		;
	} else {
		let newHintIndex = indices[newHintNumber]; 
		inputs[newHintIndex].parentNode.parentNode.classList.add("hint");
	} 
}

Hint.addEventListener('click', addHint);


for (var i=0; i<12; i++) {
	var topCard = deck.pop()
	table.push(topCard)
	inputs[i].parentNode.appendChild(topCard.getHTML())
}

deckSlot.innerHTML = deck.numberOfCards;
foundSlot.innerHTML = discard.length;

function checkForSET() {

	var checkedCardsIndices = getCheckedBoxesIndices();
	if (checkedCardsIndices == null) {
		return;
	} 
	var i = checkedCardsIndices[0];
	var j = checkedCardsIndices[1];
	var k = checkedCardsIndices[2];
	if (checkedCardsIndices.length === 3) {
		// remove hints
		var Hints = document.getElementsByClassName("hint");
		var numHints = Hints.length;
		for (var l=numHints-1; l >= 0; l--) {
    		Hints[l].classList.remove("hint");
		}

		// remove checked boxes
		inputs[i].checked = false;
		inputs[j].checked = false;
		inputs[k].checked = false;

		let x = isSet(table[i], table[j], table[k]);
		// if isSet is true, remove the old cards and append the new ones
		if (x) {
			// remove images
			let Slot1 = inputs[i].parentNode;
			let Slot2 = inputs[j].parentNode;
			let Slot3 = inputs[k].parentNode;
			let oldCard1Image = Slot1.removeChild(Slot1.lastChild);
			let oldCard2Image = Slot2.removeChild(Slot2.lastChild);
			let oldCard3Image = Slot3.removeChild(Slot3.lastChild);
			discard.push([oldCard1Image, oldCard2Image, oldCard3Image]);

			if (table.length > 12) {
				// remove the card slots 
				Table.removeChild(Slot1.parentNode);
				Table.removeChild(Slot2.parentNode);
				Table.removeChild(Slot3.parentNode);

				// remove the card data
				table.splice(k,1);
				table.splice(j,1);
				table.splice(i,1);
			} else if (deck.numberOfCards === 0) {
				// remove the 
				// just remove the card data 
				table.splice(k,1);
				table.splice(j,1);
				table.splice(i,1);
			} else {

				// draw cards from deck 
				let newCard1 = deck.pop();
				let newCard2 = deck.pop();
				let newCard3 = deck.pop();

				// put card info in data
				table[i] = newCard1;
				table[j] = newCard2;
				table[k] = newCard3;

				// put html in card slot
				Slot1.appendChild(newCard1.getHTML());
				Slot2.appendChild(newCard2.getHTML());
				Slot3.appendChild(newCard3.getHTML());
			}
		}
		

		// update the menu data
		deckSlot.innerHTML = deck.numberOfCards;
		foundSlot.innerHTML = discard.length;
	}

}

function getCheckedBoxesIndices() {
  var checkboxes = document.getElementsByTagName("input");
  var checkboxesCheckedIndices = [];
  // loop over them all
  for (var i=0; i<checkboxes.length; i++) {
     // And stick the checked ones onto an array...
     if (checkboxes[i].checked) {
        checkboxesCheckedIndices.push(i);
     }
  }
  // Return the array if it is non-empty, or null
  return checkboxesCheckedIndices.length > 0 ? checkboxesCheckedIndices : null;
}

for (var i=0; i < inputs.length; i++) {
	inputs[i].addEventListener('change', checkForSET)
}

function isSet(card1, card2, card3) {
	var card1Array = card1.array
	var card2Array = card2.array
	var card3Array = card3.array

	for (var i=0; i<4; i++) {
		const a = card1Array[i]
		const b = card2Array[i]
		const c = card3Array[i]
		let modulus = (a + b + c) % 3
		// console.log(modulus)
		if (modulus != 0) {
			return false;
		}
	}
	return true
}


