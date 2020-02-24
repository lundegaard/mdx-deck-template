import React, { Fragment } from 'react';
import styled from '@emotion/styled';
import { position, top, right, bottom, left, zIndex } from 'styled-system';
// import chroma from 'chroma-js';

/* eslint-disable react/prop-types */

export const Subtitle = styled.h2`
	padding-bottom: 16px;
	margin-bottom: 32px;

	&:after {
		background: ${ps => ps.theme[ps.color]}!important;
	}
`;

Subtitle.defaultProps = { color: 'green' };

export const Li = styled.li``;
export const Ul = styled.ul`
	${ps =>
		ps.dense
			? `
					li {
						font-size: 1em;
						margin-bottom: 0.4em;
					}
			  `
			: ''}
`;
export const Text = styled.span`
	font-size: 0.7em;
`;

const MetaListSeparator = styled.span`
	padding: 0 8px;
`;

export const MetaList = ({ children, ...rest }) => {
	return (
		<section {...rest}>
			{React.Children.map(children, (x, i) => (
				<Fragment>
					{i !== 0 ? <MetaListSeparator>{'·'}</MetaListSeparator> : null}
					{x.props.children}
				</Fragment>
			))}
		</section>
	);
};

export const Position = styled.div`
	${position}
	${zIndex}
	${top}
	${left}
	${bottom}
	${right}
`;

export const Relative = styled(Position)``;

Relative.defaultProps = { position: 'relative' };

export const Absolute = styled(Position)``;

Absolute.defaultProps = { position: 'absolute' };

export const ImageText = styled.span`
	position: relative;
	z-index: 2;
	strong {
		color: #fff;
		font-weight: normal;
		text-shadow: 4px 4px 4px ${ps => ps.theme.green};
	}
`;
