import React, { Fragment } from 'react';
import styled from '@emotion/styled';
import { position, top, right, bottom, left, zIndex } from 'styled-system';
import { Text } from 'theme-ui';

export const Small = props => (
	<Text sx={{ variant: 'styles.Small' }} {...props} />
);

const MetaListSeparator = styled.span`
	padding: 0 8px;
`;

export const MetaList = ({ children, ...rest }) => (
	<section {...rest}>
		{React.Children.map(children, (x, i) => (
			<Fragment>
				{i !== 0 ? <MetaListSeparator>{'·'}</MetaListSeparator> : null}
				{x.props.children}
			</Fragment>
		))}
	</section>
);

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
