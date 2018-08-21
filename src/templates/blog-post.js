import Helmet from 'react-helmet';
import React from 'react';
import format from 'date-fns/format';
import locale from 'date-fns/locale/fr';
import { graphql } from 'gatsby';

import Layout from '../components/layout';

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
