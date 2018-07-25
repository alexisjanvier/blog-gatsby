/* eslint no-console: "off" */
const inquirer = require('inquirer');
const chalk = require('chalk');
const slug = require('slug');
const { existsSync, readFileSync, readdirSync, writeFileSync } = require('fs');
const format = require('date-fns/format');
const frontMatter = require('front-matter');
const fuzzy = require('fuzzy');

inquirer.registerPrompt('search-checkbox', require('inquirer-search-checkbox'));
inquirer.registerPrompt(
    'autocomplete',
    require('inquirer-autocomplete-prompt')
);

const getFrontMatterAttributes = file =>
    new Promise(resolve => {
        const content = readFileSync(file, 'utf8');
        const data = frontMatter(content);
        return resolve(data.attributes);
    });

const getKnownTags = () => {
    const files = readdirSync('./src/posts');

    return Promise.all(
        files
            .map(file => `./src/posts/${file}`)
            .map(getFrontMatterAttributes)
    )
        .then(posts =>
            posts.reduce(
                (acc, post) =>
                    (post.tags || []).reduce((acc, tag) => acc.add(tag), acc),
                new Set()
            )
        )
        .then(tags => Array.from(tags))
        .then(tags => tags.map(tag => tag.toLowerCase()))
        .then(tags => [...(new Set(tags))])
        .then(tags => tags.sort());
};

const inquirerMoreTags = (postTags, tags) =>
    inquirer
        .prompt([
            {
                type: 'autocomplete',
                name: 'tag',
                message: `What are the tags? Current tags: ${
                    postTags.length > 0 ? postTags.join(', ') : 'none'
                }`,
                suggestOnly: true,
                pageSize: 10,
                source: (answers, input = '') =>
                    Promise.resolve(
                        input
                            ? fuzzy
                                .filter(input, tags)
                                .map(result => result.original)
                            : tags
                    )
            },
            {
                type: 'confirm',
                message: answers =>
                    `Enter another tag? Current tags: ${[
                        ...postTags,
                        answers.tag
                    ].join(', ')}`,
                name: 'enterAnotherTag'
            }
        ])
        .then(answers => {
            const newTags = [...postTags, answers.tag];
            if (answers.enterAnotherTag) {
                return inquirerMoreTags(
                    newTags,
                    tags.filter(tag => !newTags.includes(tag))
                );
            }
            return newTags;
        });

const inquirerTags = (postTags, tags) =>
    inquirer
        .prompt([
            {
                type: 'confirm',
                message: `Can we skip adding tags? (Enter for yes)`,
                name: 'skipTags'
            }
        ])
        .then(answers => {
            if (answers.skipTags) {
                return postTags;
            }
            return inquirerMoreTags(postTags, tags);
        });

const createBlogpost = ({ answers, postTags }) => {
    const { title, description } = answers;
    const currentDate = new Date();
    const currentFormattedDate = format(currentDate, 'YYYY-MM-DD');
    const postPath = `./src/posts/${currentFormattedDate}-${slug}.md`;

    const content = `---
title: "${title}"
slug: "${slug(title)}"
marmelab:
date: "${currentFormattedDate}"
description: "${description}"
tags:
${postTags.map(tag => `- ${tag}`).join('\n')}
---
`;
    writeFileSync(postPath, content, 'utf8');

    console.log(
        `Done! Go ahead and edit ${chalk.cyan(postPath)} to complete the post.`
    );
    console.log(
        `You can start editing in Code: ${chalk.blue(`code ${postPath}`)}`
    );
};

Promise.all([getKnownTags()]).then(
    ([tags]) => console.log(tags)
);

// Promise.all([getKnownTags()]).then(
//     ([activeMembers, tags]) =>
//         getDefaultAuthor(activeMembers).then(defaultAuthor => {
//             inquirer
//                 .prompt([
//                     {
//                         type: 'input',
//                         message: `Hey ${defaultAuthor}! What's your post title?`,
//                         name: 'title',
//                         validate: input => Boolean(input) || 'This is required'
//                     },
//                     {
//                         type: 'input',
//                         message: `What's the post slug?`,
//                         name: 'slug',
//                         default: answers =>
//                             slug(answers.title, { lower: true }),
//                         validate: input => Boolean(input) || 'This is required'
//                     },
//                     {
//                         type: 'input',
//                         message: `Write a short (usually 1-2 line) description of your post or press Enter to move on`,
//                         name: 'excerpt'
//                     }
//                 ])
//                 .then(answers =>
//                     inquirerAuthors(
//                         [defaultAuthor],
//                         activeMembers.filter(
//                             author => author !== defaultAuthor
//                         )
//                     ).then(postAuthors => ({
//                         answers,
//                         postAuthors
//                     }))
//                 )
//                 .then(result =>
//                     inquirerTags([], tags).then(postTags => ({
//                         ...result,
//                         postTags
//                     }))
//                 )
//                 .then(createBlogpost);
//         })
// );
