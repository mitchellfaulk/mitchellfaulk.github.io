import Deck from './deck.js'

const inputs = document.getElementsByTagName("input")
const deck = new Deck()
const discard = []
var table = []

// shuffle the deck
deck.shuffle()


for (var i=0; i<12; i++) {
	var topCard = deck.pop()
	table.push(topCard)
	inputs[i].parentNode.lastChild.appendChild(topCard.getHTML())
}

console.log(deck.cards)
console.log(table)

function checkForSET() {
	var checkedCardsIndices = getCheckedBoxesIndices();
	var i = checkedCardsIndices[0];
	var j = checkedCardsIndices[1];
	var k = checkedCardsIndices[2];
	if (checkedCardsIndices.length === 3) {
		// print to the console
		console.log(checkedCardsIndices.length);
		let x = isSet(table[i], table[j], table[k]);
		console.log(x)
		// if isSet is true, remove the old cards and append the new ones
		if (x) {
			let newCard1 = deck.pop();
			let newCard2 = deck.pop();
			let newCard3 = deck.pop();
			let Slot1 = inputs[i].parentNode.lastChild;
			let Slot2 = inputs[j].parentNode.lastChild;
			let Slot3 = inputs[k].parentNode.lastChild;
			console.log(inputs[i])
			console.log(Slot1)
			let oldCard1Image = Slot1.removeChild(Slot1.firstChild);
			let oldCard2Image = Slot2.removeChild(Slot2.firstChild);
			let oldCard3Image = Slot3.removeChild(Slot3.firstChild);
			Slot1.appendChild(newCard1.getHTML());
			Slot2.appendChild(newCard2.getHTML());
			Slot3.appendChild(newCard3.getHTML());
			table[i] = newCard1
			table[j] = newCard2
			table[k] = newCard3
			discard.push(oldCard1Image)
			discard.push(oldCard2Image)
			discard.push(oldCard3Image)
			console.log(discard)
		}
		// remove checked boxes
		inputs[i].checked = false;
		inputs[j].checked = false;
		inputs[k].checked = false;
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


