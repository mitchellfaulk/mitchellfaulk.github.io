from itertools import product
import subprocess, os

deck = list(product(range(3), repeat=4))

deck_strings = []

for card in deck:
	card_string = ''
	for item in card:
		card_string += str(item)
	deck_strings.append(card_string)

print(deck_strings)


for string in deck_strings:
	a = str(int(string[0]) + 1)
	b = str(int(string[1]) + 1)
	c = str(int(string[2]) + 1)
	d = str(int(string[3]) + 1)

	y = '}{'

	x = '\\setcard{' + a + y + b + y + c + y + d + y + str(1) + '}' + '\n'

	with open(f'{string}.tex', 'w') as file:
		file.write('\\documentclass[convert]{standalone}\n')
		file.write('\\usepackage{setdeck}\n')
		file.write('\\begin{document}\n')
		file.write(x)
		file.write('\\end{document}\n')


