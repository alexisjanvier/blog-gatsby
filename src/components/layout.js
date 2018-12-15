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
ListLink.propTypes = {
    children: PropTypes.any,
    to: PropTypes.string
};

const TemplateView = ({ children, data }) => {
    const coverImage = 'https://www.alexisjanvier.net/covers/ajnet.jpg';
    const siteDescription = `${data.site.siteMetadata.title} ${data.site.siteMetadata.subtitle}`;
    const siteTitle = 'alexisjanvier.net';
    return (
        <div style={{ margin: `0 auto`, maxWidth: 1000, padding: `1.25rem 1rem` }}>
            <Helmet>
                <title>{siteTitle}</title>
                <meta name="description" content={siteDescription} />
                <meta name="keywords" content="blog,developpeur,caen,marmelab" />
                <meta name="author" content={data.site.siteMetadata.author} />
                <meta itemProp="name" content={siteTitle} />
                <meta itemProp="description" content={siteDescription} />
                <meta itemProp="image" content={coverImage} />
                <meta property="og:title" content={siteTitle} />
                <meta property="og:description" content={siteDescription} />
                <meta property="og:image" content={coverImage} />
                <meta property="og:url" content="https://www.alexisjanvier.net" />
                <meta property="og:site_name" content="alexisjanvier.net" />
                <meta name="twitter:title" content={siteTitle} />
                <meta name="twitter:description" content={siteDescription} />
                <meta name="twitter:image" content={coverImage} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:image:alt" content={siteTitle} />
                <meta name="twitter:creator" content="@alexisjanvier" />
                <meta name="twitter:site" content="@alexisjanvier" />
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
};

TemplateView.propTypes = {
    children: PropTypes.any,
    data: PropTypes.any
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
