import React from 'react';
import Link from 'gatsby-link';
import format from 'date-fns/format';
import locale from 'date-fns/locale/fr';

export default ({ data }) => {
    return (
        <div>
            {data.allMarkdownRemark.edges.map(({ node }) => (
                <div className="blog-list" key={node.id}>
                    <Link to={node.frontmatter.slug}>
                        <h2>{node.frontmatter.title}</h2>
                        <h4>
                            Publié le {format(node.frontmatter.date, 'DD MMMM YYYY', { locale })}
                        </h4>
                        <p>{node.frontmatter.description}</p>
                    </Link>
                </div>
            ))}
        </div>
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
                        title
                        date
                        tags
                        description
                        slug
                    }
                }
            }
        }
    }
`;
