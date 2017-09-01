module.exports = {
    siteMetadata: {
        title: "This is not 'Nam.",
        subtitle: 'This is my blog. There are rules.',
        twitter: `alexisjanvier`,
        github: `alexisjanvier`,
        author: `Àlexis Janvier`,
        siteUrl: `http://alexisjanvier.net`
    },
    plugins: [
        `gatsby-plugin-sass`,
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `src`,
                path: `${__dirname}/src/`
            }
        },
        `gatsby-transformer-remark`,
        {
            resolve: `gatsby-plugin-typography`,
            options: {
                pathToConfigModule: `src/utils/typography.js`
            }
        },
        {
            resolve: `gatsby-transformer-remark`,
            options: {
                plugins: [
                    {
                        resolve: `gatsby-remark-prismjs`,
                        options: {
                            // Class prefix for <pre> tags containing syntax highlighting;
                            // defaults to 'language-' (eg <pre class="language-js">).
                            // If your site loads Prism into the browser at runtime,
                            // (eg for use with libraries like react-live),
                            // you may use this to prevent Prism from re-processing syntax.
                            // This is an uncommon use-case though;
                            // If you're unsure, it's best to use the default value.
                            classPrefix: 'language-'
                        }
                    }
                ]
            }
        },
        `gatsby-plugin-react-helmet`,
        `gatsby-plugin-sitemap`
    ]
};
