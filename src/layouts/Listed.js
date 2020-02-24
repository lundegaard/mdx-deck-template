import React from 'react';
import styled from '@emotion/styled';
import { Appear } from 'mdx-deck';
import { Li, Ul } from '../components';

const ListedBase = styled.div([], {
	width: '100vw',
	height: '100vh',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	position: 'relative',
	flexDirection: 'column',

	'& a': {
		color: 'inherit',
	},
});

const Listed = ({ children, dense, ...rest }) => {
	const [title, list, ...restChildren] = React.Children.toArray(children);

	return (
		<ListedBase {...rest}>
			{title}
			<Ul dense={dense || React.Children.count(list.props.children) > 3}>
				<Appear>
					{React.Children.map(list.props.children, (x, i) =>
						React.createElement(Li, { key: i }, x.props.children)
					)}
				</Appear>
			</Ul>
			{restChildren}
		</ListedBase>
	);
};

Listed.defaultProps = {};

export default Listed;
