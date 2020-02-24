import { themes } from 'mdx-deck';
import chroma from 'chroma-js';
import { vsDark } from '@code-surfer/themes';
import { mergeDeepRight } from 'ramda';

const { dark } = themes;

const darkGray = '#3d4549';
const green = '#29c775';
const blue = '#1372fa';
const red = '#eb5856';
const white = '#ffffff';

const subtitleBase = {
	fontSize: '1.8rem',
	fontWeight: 'heading',
	textTransform: 'uppercase',
	position: 'relative',
	variant: 'text.heading',

	'&:after': {
		position: 'absolute',
		bottom: '-8px',
		left: '50%',
		transform: 'translate(-50%, 0)',
		height: '5px',
		width: '50px',
		content: '""',
	},
};
const subtitle = {
	...mergeDeepRight(subtitleBase, {
		'&:after': {
			background: '#009fe3',
		},
	}),
	secondary: mergeDeepRight(subtitleBase, {
		'&:after': {
			background: green,
		},
	}),
};

export const theme = {
	...dark,
	blue,
	green,
	red,
	white,
	darkGray,
	fontFamilies: {
		body: 'Roboto, system-ui, sans-serif',
		heading: 'Circular Pro, system-ui, sans-serif',
		monospace: 'Roboto Mono, Menlo, monospace',
	},
	fontWeights: { body: '300', heading: '400' },
	colors: {
		text: '#fff',
		background: darkGray,
		backgroundBroke: red,
		link: white,
		pre: '#fff',
		preBackground: darkGray,
		code: '#fff',
	},
	text: {
		heading: {
			fontFamily: 'heading',
		},
	},
	styles: {
		h1: {
			textTransform: 'uppercase',
		},
		h2: subtitle,
		subtitle,
		// used by code-surfer
		h4: subtitle,
		a: {
			textDecoration: 'none',
			color: 'inherit',
			borderBottom: `0.03em dashed ${chroma(white)
				.alpha(0.5)
				.hex()}`,

			'&:hover': {
				color: 'inherit',
			},
		},
		ul: {
			listStyle: 'none',
			margin: '0',
			padding: '0',
		},
		li: {
			fontSize: '1.777em',
			marginBottom: '0.7em',
			textAlign: 'center',
			dense: {
				fontSize: '1em',
				marginBottom: '0.4em',
			},
		},
		Small: {
			fontSize: '0.777em',
		},
		Slide: {
			background: `linear-gradient(
			  90deg,
			  rgba(255,255,255,0.05) 1px,
			  rgba(0,0,0,0) 1px,
			  rgba(0,0,0,0) 0),
			${darkGray}`,
			backgroundSize: '180px auto',
			fontWeight: '300',
		},
		CodeSurfer: {
			...vsDark.styles.CodeSurfer,
			pre: {
				backgroundColor: darkGray,
			},
			code: {
				backgroundColor: darkGray,
			},
			title: {
				backgroundColor: darkGray,
			},
		},
	},
};
