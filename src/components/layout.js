import Helmet from 'react-helmet';
import Link from 'gatsby-link';
import React from 'react';
import PropTypes from 'prop-types';
import { StaticQuery, graphql } from 'gatsby';

import TwitterIcon from '../icones/twitter.png';
import GithubIcon from '../icones/github.png';

require('../sass/ajnet.scss');
require('prismjs/themes/prism-tomorrow.css');

const ListLink = props => (
    <li style={{ display: `inline-block`, marginRight: `1rem` }}>
        <Link to={props.to}>{props.children}</Link>
    </li>
);

const TemplateView = ({ children, data }) => (
    <div style={{ margin: `0 auto`, maxWidth: 1000, padding: `1.25rem 1rem` }}>
        <Helmet>
            <title>alexisjanvier.net</title>
            <meta name="description" content={`${data.site.siteMetadata.title} ${data.site.siteMetadata.subtitle}`} />
            <meta name="keywords" content="blog,developpeur,caen,marmelab,javascript,ddd,devops,graphql" />
            <meta name="author" content={data.site.siteMetadata.author} />
        </Helmet>
        <header style={{ marginBottom: `1.5rem` }}>
            <Link to="/">
                <h3>{data.site.siteMetadata.title}</h3>
                <h5>{data.site.siteMetadata.subtitle}</h5>
            </Link>
            <ul style={{ listStyle: `none`, float: `right` }}>
                <ListLink to="/">Blog</ListLink>
                <ListLink to="/about/">About</ListLink>
                <li style={{ display: `inline-block`, marginRight: `1rem` }}>
                    <a href={`https://twitter.com/${data.site.siteMetadata.twitter}`}>
                        <img src={TwitterIcon} />
                    </a>
                </li>
                <li style={{ display: `inline-block`, marginRight: `1rem` }}>
                    <a href={`https://github.com//${data.site.siteMetadata.github}`}>
                        <img src={GithubIcon} />
                    </a>
                </li>
            </ul>
        </header>
        {children}
    </div>
);

TemplateView.propTypes = {
    children: PropTypes.any
};

export const Template = props => (
    <StaticQuery
        query={graphql`
            query NavBarQuery {
                site {
                    siteMetadata {
                        title
                        subtitle
                        twitter
                        github
                        author
                    }
                }
            }
        `}
        render={data => (
            <header>
                <TemplateView data={data} {...props} />
            </header>
        )}
    />
);

export default Template;
