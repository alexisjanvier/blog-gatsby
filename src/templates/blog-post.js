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
                title
                date
                tags
                description
            }
        }
    }
`;
