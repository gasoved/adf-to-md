'use strict';

const Converter = module.exports;

function _convert(node, warnings) {
	switch (node.type) {
		case 'doc':
			return node.content.map(node => _convert(node, warnings)).join('\n\n');

		case 'text':
			return `${_convertMarks(node, warnings)}`;

		case 'paragraph':
			return node.content.map(node => _convert(node, warnings)).join('');

		case 'hardBreak':
			return '\n';

		case 'blockquote':
			return `> ${node.content.map(node => _convert(node, warnings)).join('\n> ')}`;

		case 'bulletList':
		case 'orderedList':
			return `${node.content.map((subNode) => {
				const converted = _convert.call(node, subNode, warnings);

				if (node.type === 'orderedList') {
					if (!node.attrs) {
						node.attrs = {
							order: 1,
						};
					}

					node.attrs.order += 1;
				}

				return converted;
			}).join('\n')}`;

		case 'listItem': {
			const order = this.attrs ? this.attrs.order || 1 : 1;
			const symbol = this.type === 'bulletList' ? '*' : `${order}.`;
			return `  ${symbol} ${node.content.map(node => _convert(node, warnings).trimEnd()).join(` `)}`;
		}

		case 'codeBlock': {
			const language = node.attrs ? ` ${node.attrs.language}` : '';
			return `\`\`\`${language}\n${node.content.map(node => _convert(node, warnings)).join('\n')}\n\`\`\``;
		}

		default:
			console.log('adding warning for', node.type);
			warnings.add(node.type);
			return '';
	}
}

function _convertMarks(node, warnings) {
	if (!node.hasOwnProperty('marks') || !Array.isArray(node.marks)) {
		return node.text;
	}

	return node.marks.reduce((converted, mark) => {
		switch (mark.type) {
			case 'code':
				converted = `\`${converted}\``;
				break;

			case 'em':
				converted = `_${converted}_`;
				break;

			case 'link':
				converted = `[${converted}](${mark.attrs.href})`;
				break;

			case 'strike':
				converted = `~${converted}~`;
				break;

			case 'strong':
				converted = `**${converted}**`;
				break;

			default: // not supported
				warnings.add(mark.type);
				break;
		}

		return converted;
	}, node.text);
}

Converter.convert = (adf) => {
	const warnings = new Set();

	Converter.validate(adf);

	// todo: do stuff with warnings

	return _convert(adf, warnings);
};

Converter.validate = (adf) => {
	// Super naive validation -- someday validate against this: https://unpkg.com/@atlaskit/adf-schema@22.0.1/dist/json-schema/v1/full.json
	let ok = true;

	if (!adf || typeof adf !== 'object') {
		ok = false;
	}

	if (adf.type !== 'doc') {
		ok = false;
	}

	if (adf.version !== 1) {
		ok = false;
	}

	if (!ok) {
		throw new Error('adf-validation-failed');
	}
};
