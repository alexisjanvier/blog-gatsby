import React from 'react';
import Link from 'gatsby-link';
import format from 'date-fns/format';
import locale from 'date-fns/locale/fr';
import { graphql } from 'gatsby';

import Layout from '../components/layout';

const styles = {
    marmelab: {
        margin: '0 0.5rem'
    },
    logo: {
        width: '30px',
        height: '30px',
        margin: '0 5px',
        padding: 0
    }
};

const PostItem = ({ post }) => {
    if (post.marmelab) {
        return (
            <a href={post.marmelab}>
                <h2>{post.title}</h2>
                <h4>
                    Publié le {format(post.date, 'DD MMMM YYYY', { locale })} sur le blog de <img style={styles.logo} src="/images/marmelab.png" />
                </h4>
                <p>{post.description}</p>
            </a>
        );
    }

    return (
        <Link to={post.slug}>
            <h2>{post.title}</h2>
            <h4>
                Publié le {format(post.date, 'DD MMMM YYYY', { locale })}
            </h4>
            <p>{post.description}</p>
        </Link>
    );
};

export default ({ data }) => {
    return (
        <Layout>
            <div>
                {data.allMarkdownRemark.edges.map(({ node }) => (
                    <div className="blog-list" key={node.id}>
                        <PostItem post={node.frontmatter} />
                    </div>
                ))}
            </div>
        </Layout>
    );
};

export const query = graphql`
    query IndexQuery {
        allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
            totalCount
            edges {
                node {
                    id
                    frontmatter {
                        date
                        description
                        marmelab
                        slug
                        tags
                        title
                    }
                }
            }
        }
    }
`;
