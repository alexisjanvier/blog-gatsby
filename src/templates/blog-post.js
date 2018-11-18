import Helmet from 'react-helmet';
import React from 'react';
import format from 'date-fns/format';
import locale from 'date-fns/locale/fr';
import { graphql } from 'gatsby';

import Layout from '../components/layout';

class JustComments extends React.Component {
    constructor (...args) {
        super(...args);
        this.ref = React.createRef();
    }
    render () {
        return (
            <div
                ref={this.ref}
                className="just-comments"
                data-apikey="cdfe5295-0bb5-4662-b98b-11fcfc0eaa83"
            />
        );
    }
    componentDidMount () {
        const s = document.createElement('script');
        s.src = '//just-comments.com/w.js';
        s.setAttribute('data-timestamp', +new Date());
        this.ref.current.appendChild(s);
    }
}

export default ({ data }) => {
    const post = data.markdownRemark;
    return (
        <Layout>
            <div>
                <Helmet>
                    <title>{post.frontmatter.title}</title>
                    <meta name="description" content={post.frontmatter.description} />
                    <meta name="keywords" content={`${post.frontmatter.tags}`} />
                    <meta property="og:title" content={post.frontmatter.title} />
                    <meta property="og:description" content={post.frontmatter.description} />
                    {post.frontmatter.cover && <meta property="og:image" content={`https://www.alexisjanvier.net/covers/${post.frontmatter.cover}`} />}
                    <meta property="og:url" content={`https://www.alexisjanvier.net/${post.frontmatter.slug}`} />
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta property="og:site_name" content="alexisjanvier.net" />
                    <meta name="twitter:image:alt" content={post.frontmatter.title} />
                    <meta name="twitter:site" content="@alexisjanvier" />
                </Helmet>
                <div className="postIntro">
                    <h1>{post.frontmatter.title}</h1>
                    <p className="date">Publié le {format(post.frontmatter.date, 'DD MMMM YYYY', { locale })}</p>
                </div>

                <div dangerouslySetInnerHTML={{ __html: post.html }} />
                <JustComments />
            </div>
        </Layout>
    );
};

export const query = graphql`
    query BlogPostQuery($slug: String!) {
        markdownRemark(frontmatter: { slug: { eq: $slug } }) {
            html
            frontmatter {
                cover
                date
                description
                slug
                tags
                title
            }
        }
    }
`;
