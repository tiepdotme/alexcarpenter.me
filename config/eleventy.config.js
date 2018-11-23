const {DateTime} = require('luxon')
const CleanCSS = require('clean-css')
const UglifyJS = require('uglify-js')
const htmlmin = require('html-minifier')
const pluginRss = require('@11ty/eleventy-plugin-rss')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const Abreast = require('../src/_includes/components/Abreast.js')
const Card = require('../src/_includes/components/Card.js')
const Checklist = require('../src/_includes/components/Checklist.js')
const Figure = require('../src/_includes/components/Figure.js')
const Youtube = require('../src/_includes/components/Youtube.js')
const markdown = require('markdown-it')({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
}).use(require('markdown-it-anchor'), {
  level: [2],
  permalink: false,
})

module.exports = eleventyConfig => {
  const parseDate = str => {
    if (str instanceof Date) {
      return str
    }
    const date = DateTime.fromISO(str, {zone: 'utc'})
    return date.toJSDate()
  }

  // Plugins
  eleventyConfig.addPlugin(pluginRss)
  eleventyConfig.addPlugin(syntaxHighlight)

  eleventyConfig.setLibrary('md', markdown)

  // Filters
  eleventyConfig.addFilter(
    'cssmin',
    code => new CleanCSS({}).minify(code).styles,
  )

  eleventyConfig.addFilter('jsmin', code => {
    let minified = UglifyJS.minify(code)
    if (minified.error) {
      console.log('UglifyJS error: ', minified.error)
      return code
    }
    return minified.code
  })

  // Minify HTML output
  eleventyConfig.addTransform('htmlmin', function(content, outputPath) {
    if (outputPath.indexOf('.html') > -1) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      })
      return minified
    }
    return content
  })

  eleventyConfig.addFilter('markdownify', str => markdown.render(str))

  eleventyConfig.addFilter('markdownify_inline', str =>
    markdown.renderInline(str),
  )

  eleventyConfig.addFilter('strip_html', str => {
    return str.replace(
      /<script.*?<\/script>|<!--.*?-->|<style.*?<\/style>|<.*?>/g,
      '',
    )
  })

  eleventyConfig.addFilter('date_to_permalink', obj => {
    const date = parseDate(obj)
    return DateTime.fromJSDate(date).toFormat('yyyy/MM')
  })

  eleventyConfig.addFilter('date_formatted', obj => {
    const date = parseDate(obj)
    return DateTime.fromJSDate(date).toFormat('yyyy/MM/dd')
  })

  eleventyConfig.addFilter('date_to_med', obj => {
    const date = parseDate(obj)
    return DateTime.fromJSDate(date).toFormat('MMM yyyy')
  })

  eleventyConfig.addFilter('permalink', str => {
    return str.replace(/\.html/g, '')
  })

  // Collections
  eleventyConfig.addCollection('posts', collection => {
    return collection.getFilteredByGlob('**/posts/*.md').reverse()
  })

  eleventyConfig.addCollection('latestPosts', collection => {
    return collection
      .getFilteredByGlob('**/posts/*.md')
      .slice(-5)
      .reverse()
  })

  // Shortcodes
  eleventyConfig.addShortcode('Abreast', Abreast)
  eleventyConfig.addShortcode('Card', Card)
  eleventyConfig.addShortcode('Checklist', Checklist)
  eleventyConfig.addShortcode('Figure', Figure)
  eleventyConfig.addShortcode('Youtube', Youtube)

  // ETC.
  eleventyConfig
    .addPassthroughCopy('src/assets')
    .addPassthroughCopy('src/manifest.json')

  return {
    templateFormats: ['njk', 'md', 'html'],
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: 'www',
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    passthroughFileCopy: true,
  }
}
