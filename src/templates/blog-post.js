import Helmet from 'react-helmet';
import React from 'react';
import format from 'date-fns/format';
import locale from 'date-fns/locale/fr';

export default ({ data }) => {
    const post = data.markdownRemark;
    return (
        <div>
            <Helmet>
                <title>{post.frontmatter.title}</title>
                <meta name="description" content={post.frontmatter.description} />
                <meta name="keywords" content={`${post.frontmatter.tags}`} />
            </Helmet>
            <div className="postIntro">
                <h1>{post.frontmatter.title}</h1>
                <p className="date">Publié le {format(post.frontmatter.date, 'DD MMMM YYYY', { locale })}</p>
                <p className="tags">{`${post.frontmatter.tags}`}</p>
                <p className="intro">{post.frontmatter.description}</p>
            </div>

            <div dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>
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
