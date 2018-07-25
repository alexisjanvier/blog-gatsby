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

const getDefaultAuthor = activeMembers => {
    const hasDefaultAuthor = existsSync('./.authorrc');

    if (hasDefaultAuthor) {
        const defaultAuthor = readFileSync('./.authorrc', 'utf8');

        if (activeMembers.includes(defaultAuthor)) {
            return Promise.resolve(defaultAuthor);
        }

        console.log(chalk.red(`${defaultAuthor} is not a valid author.`));
    }

    return inquirer
        .prompt([
            {
                type: 'autocomplete',
                name: 'defaultAuthor',
                message: `Who are you?`,
                validate: input => Boolean(input) || 'Please answer',
                source: (answers, input = '') =>
                    Promise.resolve(
                        input
                            ? fuzzy
                                .filter(input, activeMembers)
                                .map(result => result.original)
                            : activeMembers
                    )
            }
        ])
        .then(answers => {
            writeFileSync('./.authorrc', answers.defaultAuthor, 'utf8');
            return answers.defaultAuthor;
        });
};

const getFrontMatterAttributes = file =>
    new Promise(resolve => {
        const content = readFileSync(file, 'utf8');
        const data = frontMatter(content);
        return resolve(data.attributes);
    });

const getActiveTeamMembers = () => {
    const files = readdirSync('./content/team');

    return Promise.all(
        files
            .map(file => `./content/team/${file}`)
            .map(getFrontMatterAttributes)
    ).then(members =>
        members.filter(member => !member.retired).map(member => member.name)
    );
};

const getKnownTags = () => {
    const files = readdirSync('./content/blog');

    return Promise.all(
        files
            .map(file => `./content/blog/${file}`)
            .map(getFrontMatterAttributes)
    )
        .then(posts =>
            posts.reduce(
                (acc, post) =>
                    (post.tags || []).reduce((acc, tag) => acc.add(tag), acc),
                new Set()
            )
        )
        .then(tags => Array.from(tags));
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

const inquirerMoreAuthors = (postAuthors, activeAuthors) =>
    inquirer
        .prompt([
            {
                type: 'autocomplete',
                name: 'authors',
                message: `Who are the authors? Current authors: ${
                    postAuthors.length > 0 ? postAuthors.join(', ') : 'none'
                }`,
                suggestOnly: true,
                pageSize: 10,
                source: (answers, input = '') =>
                    Promise.resolve(
                        input
                            ? fuzzy
                                .filter(input, activeAuthors)
                                .map(result => result.original)
                            : activeAuthors
                    )
            },
            {
                type: 'confirm',
                message: answers =>
                    `Enter another author? Current authors: ${[
                        ...postAuthors,
                        answers.tag
                    ].join(', ')}`,
                name: 'enterAnotherAuthor'
            }
        ])
        .then(answers => {
            const newAuthors = [...postAuthors, answers.tag];
            if (answers.enterAnotherAuthor) {
                return inquirerAuthors(
                    newAuthors,
                    activeAuthors.filter(
                        author => !newAuthors.includes(author)
                    )
                );
            }
            return newAuthors;
        });

const inquirerAuthors = (postAuthors, activeAuthors) =>
    inquirer
        .prompt([
            {
                type: 'confirm',
                message: `Can we skip adding more authors? (Enter for yes)`,
                name: 'skipAuthors'
            }
        ])
        .then(answers => {
            if (answers.skipAuthors) {
                return postAuthors;
            }
            return inquirerMoreAuthors(postAuthors, activeAuthors);
        });

const createBlogpost = ({ answers, postAuthors, postTags }) => {
    const { title, slug, excerpt } = answers;
    const currentDate = new Date();
    const currentFormattedDate = format(currentDate, 'YYYY-MM-DD');
    const postPath = `./content/blog/${currentFormattedDate}-${slug}.md`;

    const content = `---
layout: post
title: "${title}"
excerpt: "${excerpt}"
image370x240_5:
image1024x395:
authors:
${postAuthors.map(author => `- ${author}`).join('\n')}
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

Promise.all([getActiveTeamMembers(), getKnownTags()]).then(
    ([activeMembers, tags]) =>
        getDefaultAuthor(activeMembers).then(defaultAuthor => {
            inquirer
                .prompt([
                    {
                        type: 'input',
                        message: `Hey ${defaultAuthor}! What's your post title?`,
                        name: 'title',
                        validate: input => Boolean(input) || 'This is required'
                    },
                    {
                        type: 'input',
                        message: `What's the post slug?`,
                        name: 'slug',
                        default: answers =>
                            slug(answers.title, { lower: true }),
                        validate: input => Boolean(input) || 'This is required'
                    },
                    {
                        type: 'input',
                        message: `Write a short (usually 1-2 line) description of your post or press Enter to move on`,
                        name: 'excerpt'
                    }
                ])
                .then(answers =>
                    inquirerAuthors(
                        [defaultAuthor],
                        activeMembers.filter(
                            author => author !== defaultAuthor
                        )
                    ).then(postAuthors => ({
                        answers,
                        postAuthors
                    }))
                )
                .then(result =>
                    inquirerTags([], tags).then(postTags => ({
                        ...result,
                        postTags
                    }))
                )
                .then(createBlogpost);
        })
);
