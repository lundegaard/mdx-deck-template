import React, { Children, cloneElement } from 'react';
import PropTypes from 'prop-types';
import { Image } from 'mdx-deck';
import styled from '@emotion/styled';
import { ImageText } from '../components';

const ImageStyled = styled(Image)`
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	background-color: ${ps => ps.theme.darkGray};

	&:before {
		content: '';
		position: absolute;
		display: block;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0)
			linear-gradient(to bottom, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0.4) 100%)
			repeat 0 0;
		z-index: 1;
	}
`;

const BackgroundImaged = ({ children, ...rest }) => (
	<ImageStyled {...rest}>
		{Children.map(children, parent => {
			const children = parent.props.children;
			return children
				? cloneElement(parent, {}, <ImageText>{children}</ImageText>)
				: parent;
		})}
	</ImageStyled>
);

BackgroundImaged.propTypes = { children: PropTypes.node };

BackgroundImaged.defaultProps = {};

export default BackgroundImaged;
