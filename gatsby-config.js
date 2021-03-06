module.exports = {
    siteMetadata: {
        title: "This is not 'Nam.",
        subtitle: 'This is web development. There are rules.',
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
                        resolve: 'gatsby-remark-embed-gist',
                        options: {
                            // Optional:

                            // the github handler whose gists are to be accessed
                            // username: 'weirdpattern',

                            // a flag indicating whether the github default gist css should be included or not
                            // default: true
                            includeDefaultCss: true
                        }
                    },
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
        {
            resolve: `gatsby-plugin-google-analytics`,
            options: {
                trackingId: 'UA-129388047-1',
                head: false,
                anonymize: true,
                respectDNT: true
            }
        },
        `gatsby-plugin-sitemap`
    ]
};
