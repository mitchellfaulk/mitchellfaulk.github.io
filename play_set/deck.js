function cartProd(paramArray) {
  function addTo(curr, args) {
    var i, copy, 
        rest = args.slice(1),
        last = !rest.length,
        result = [];
    
    for (i = 0; i < args[0].length; i++) {  
      copy = curr.slice();
      copy.push(args[0][i]);
      
      if (last) {
        result.push(copy);
      
      } else {
        result = result.concat(addTo(copy, rest));
      }
    }
    
    return result;
  }
  
  return addTo([], Array.prototype.slice.call(arguments));
}

const VALUES = [0, 1, 2]

const PROD_VALUES = cartProd(VALUES, VALUES, VALUES, VALUES)


class Card {
	constructor(feature0, feature1, feature2, feature3) {
		this.feature0 = feature0
		this.feature1 = feature1
		this.feature2 = feature2
		this.feature3 = feature3
	}

	get array() {
		let newArray = []
		newArray.push(this.feature0)
		newArray.push(this.feature1)
		newArray.push(this.feature2)
		newArray.push(this.feature3)
		return newArray
	}

	get string() {
		let newString = ''
		newString += this.feature0
		newString += this.feature1
		newString += this.feature2
		newString += this.feature3
		return newString
	}

	getHTML() {
		const cardImg = document.createElement('img')
		cardImg.src = 'images/' + this.string + '.jpeg'
		return cardImg
	}
}

function freshDeck() {
	return PROD_VALUES.map(x => new Card(x[0], x[1], x[2], x[3]))
}

export default class Deck {
	constructor(cards = freshDeck()) {
		this.cards = cards
	}

	get numberOfCards() {
		return this.cards.length
	}

	shuffle() {
		for (let i = this.numberOfCards - 1; i >= 0; i--) {
			const newIndex = Math.floor(Math.random() * (i + 1))
			const oldValue = this.cards[newIndex]
			this.cards[newIndex] = this.cards[i]
			this.cards[i] = oldValue
		}
	}

	pop() {
		return this.cards.pop()
	}
}
