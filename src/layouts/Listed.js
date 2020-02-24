/** @jsx jsx */
import { jsx } from 'theme-ui';
import { Children, cloneElement } from 'react';
import styled from '@emotion/styled';
import { Appear } from 'mdx-deck';

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

// sx={{ variant: 'styles.ul.dense' }}
const Listed = ({ children, dense: propDense, ...rest }) => {
	const [title, list, ...restChildren] = Children.toArray(children);

	const dense = propDense || Children.count(list.props.children) > 3;

	const newListChildren = <Appear>{list.props.children}</Appear>;
	const newList = cloneElement(list, {
		children: newListChildren,
	});

	return (
		<ListedBase {...rest}>
			{title}
			<div
				sx={{
					li: {
						variant: dense ? 'styles.li.dense' : '',
					},
				}}
			>
				{newList}
			</div>
			{restChildren}
		</ListedBase>
	);
};

export default Listed;
