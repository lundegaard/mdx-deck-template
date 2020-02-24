import { dark } from 'mdx-deck/themes';
import vsDark from 'prism-react-renderer/themes/vsDark';
import chroma from 'chroma-js';

const darkGray = '#3d4549';
const green = '#29c775';
const blue = '#1372fa';
const red = '#eb5856';
const white = '#ffffff';

const subtitle = {
	fontSize: '1.8rem',
	textTransform: 'uppercase',
	position: 'relative',
	fontFamily: 'Circular Pro, system-ui, sans-serif',
	fontWeight: '400',

	'&:after': {
		position: 'absolute',
		bottom: '-8px',
		left: '50%',
		transform: 'translate(-50%, 0)',
		height: '5px',
		width: '50px',
		background: '#009fe3',
		content: '""',
	},
};

export const theme = {
	...dark,
	blue,
	green,
	red,
	white,
	darkGray,
	font: 'Roboto, system-ui, sans-serif',
	monospace: 'Roboto Mono, Menlo, monospace',
	weights: ['300', '300', '300'],
	Slide: {
		background: `linear-gradient(
			  90deg,
			  rgba(255,255,255,0.05) 1px,
			  rgba(0,0,0,0) 1px,
			  rgba(0,0,0,0) 0),
			${darkGray}`,
		backgroundSize: '80px auto',
		fontWeight: '300',
	},
	colors: {
		text: '#fff',
		background: darkGray,
		backgroundBroke: red,
		link: white,
		pre: '#fff',
		preBackground: darkGray,
		code: '#fff',
	},
	h1: {
		textTransform: 'uppercase',
		fontFamily: 'Circular Pro, system-ui, sans-serif',
		fontWeight: '400',
	},
	h2: subtitle,
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
			// textDecoration: 'underline',
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
	},
	codeSurfer: {
		...vsDark,
		plain: {
			backgroundColor: darkGray,
		},
		showNumbers: false,
	},
};
