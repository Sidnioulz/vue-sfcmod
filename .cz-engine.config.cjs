const chalk = require('chalk')
const { configLoader } = require('commitizen')
const wordWrap = require('word-wrap')

const options = configLoader.load() || {}
const longestTypeLength =
  Object.keys(options.types).reduce((previous, current) => Math.max(previous, current.length), 0) +
  1

const formattedOptions = Object.entries(options.types).map(([key, type]) => ({
  name: `${`${key}:`.padEnd(longestTypeLength)} ${type.description}`,
  value: key,
}))

/**
 * Formats a commit subject to ensure an uppercase
 * first letter and to remove trailing punctuation.
 * @param {string} subject The subject to format.
 * @returns {string} The formatted subject.
 */
function formatSubject(subject) {
  // Enforce uppercase first letter
  let output = subject.trim()
  output = output.charAt(0).toUpperCase() + output.slice(1, output.length)

  // Remove trailing punctuation
  while (output.endsWith('.')) {
    output = output.slice(0, output.length - 1)
  }

  return output
}

/**
 * Computes the max length for the commit summary by
 * substracting the length of injected summary text.
 * @param {object} answers The inquirer answers.
 * @returns {number} The max length to enforce for the subject.
 */
function maxSummaryLength(answers) {
  const headerLength = answers.type.length + 2

  return options.maxHeaderWidth - headerLength
}

function hasContent(str) {
  return (str || '').trim().length > 0
}

function wrap(str, newline = '\n') {
  return wordWrap(str, {
    cut: false,
    trim: true,
    newline,
    indent: '',
    width: options.maxLineWidth,
  })
}

module.exports = {
  prompter(cz, commit) {
    cz.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Type of change to commit',
        pageSize: 20,
        default: options.defaultType,
        choices: formattedOptions,
      },
      {
        type: 'input',
        name: 'subject',
        message(answers) {
          return `Write a short, imperative tense description of the change (max ${maxSummaryLength(
            answers,
          )} chars):\n`
        },
        default: options.defaultSubject,
        filter: formatSubject,
        transformer(subject, answers) {
          const filteredSubject = formatSubject(subject)
          const color =
            filteredSubject.length <= maxSummaryLength(answers) ? chalk.green : chalk.red

          return color(`(${filteredSubject.length}) ${subject}`)
        },
        validate(subject, answers) {
          const formatted = formatSubject(subject)

          if (formatted.length === 0) {
            return 'subject is required'
          }

          if (formatted.length > maxSummaryLength(answers)) {
            return `Subject length must be less than or equal to ${maxSummaryLength(
              answers,
            )} characters. Current length is ${formatted.length} characters.`
          }

          return true
        },
      },
      {
        type: 'input',
        name: 'body',
        message: 'Provide a longer description of the change: (press enter to skip)\n',
        default: options.defaultBody,
      },
      {
        type: 'confirm',
        name: 'isBreaking',
        message: 'Are there any breaking changes?',
        default: false,
      },
      {
        type: 'input',
        name: 'breaking',
        message: 'Describe the breaking changes:\n',
        when(answers) {
          return answers.isBreaking
        },
      },
    ]).then((answers) => {
      const head = `${answers.type}: ${answers.subject}`

      const body = hasContent(answers.body) ? wrap(answers.body) : false

      // Apply breaking change prefix, removing it if already present
      const breaking = hasContent(answers.breaking)
        ? wrap(`BREAKING CHANGE: ${answers.breaking.trim().replace(/^BREAKING CHANGE: /, '')}`)
        : ''

      commit([head, body, breaking].filter(Boolean).join('\n\n'))
    })
  },
}
