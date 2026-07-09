/**
 * Popular npm packages list for typosquatting detection.
 * This is a curated list of the most-downloaded packages.
 * Can be updated via CLI command in the future.
 */

/** Top npm packages by weekly downloads (curated subset). */
export const POPULAR_PACKAGES: string[] = [
  // Core utilities
  'lodash', 'underscore', 'ramda', 'rxjs',
  // Build tools
  'typescript', 'webpack', 'rollup', 'esbuild', 'vite', 'parcel', 'turbo',
  'babel-core', '@babel/core', '@babel/parser', '@babel/traverse',
  'tsup', 'tslib', 'ts-node', 'tsx',
  // Testing
  'jest', 'mocha', 'chai', 'vitest', 'cypress', 'playwright',
  'sinon', 'nyc', 'istanbul', 'supertest',
  // React ecosystem
  'react', 'react-dom', 'react-router', 'react-router-dom',
  'next', 'gatsby', 'redux', 'react-redux', '@reduxjs/toolkit',
  'styled-components', 'emotion', '@emotion/react', '@emotion/styled',
  'formik', 'react-hook-form', 'swr', 'react-query', '@tanstack/react-query',
  // Vue ecosystem
  'vue', 'vuex', 'vue-router', 'pinia', 'nuxt',
  // Angular ecosystem
  '@angular/core', '@angular/cli', '@angular/common',
  // Node.js frameworks
  'express', 'koa', 'fastify', 'hapi', 'nest', '@nestjs/core',
  'socket.io', 'ws', 'cors', 'helmet', 'morgan', 'compression',
  // CLI tools
  'commander', 'yargs', 'minimist', 'meow', 'inquirer',
  'chalk', 'ora', 'cli-progress', 'cli-table3', 'boxen',
  // Database
  'mongoose', 'sequelize', 'typeorm', 'prisma', '@prisma/client',
  'pg', 'mysql', 'mysql2', 'redis', 'ioredis', 'knex',
  'mongodb', 'sqlite3', 'better-sqlite3',
  // HTTP clients
  'axios', 'node-fetch', 'got', 'superagent', 'request', 'undici',
  // File system
  'fs-extra', 'glob', 'globby', 'chokidar', 'rimraf', 'mkdirp',
  // Utilities
  'uuid', 'nanoid', 'date-fns', 'moment', 'dayjs', 'luxon',
  'debug', 'dotenv', 'cross-env', 'env-cmd',
  'semver', 'yup', 'zod', 'joi', 'ajv',
  'async', 'bluebird', 'p-limit', 'p-queue',
  // Crypto & auth
  'jsonwebtoken', 'bcrypt', 'bcryptjs', 'passport', 'helmet',
  'crypto-js', 'jose', 'oauth',
  // Logging
  'winston', 'pino', 'bunyan', 'log4js', 'morgan',
  // Linting & formatting
  'eslint', 'prettier', 'stylelint', 'tslint',
  // CSS
  'tailwindcss', 'postcss', 'autoprefixer', 'sass', 'less',
  'styled-components', 'css-loader', 'style-loader',
  // Package management
  'npm', 'yarn', 'pnpm', 'lerna', 'turbo',
  // AWS
  'aws-sdk', '@aws-sdk/client-s3', '@aws-sdk/client-lambda',
  // Google
  '@google-cloud/storage', 'firebase', 'firebase-admin',
  // Miscellaneous popular
  'body-parser', 'cookie-parser', 'multer', 'sharp',
  'cheerio', 'puppeteer', 'jsdom',
  'marked', 'markdown-it', 'highlight.js', 'prismjs',
  'nodemailer', 'handlebars', 'ejs', 'pug',
  'classnames', 'clsx', 'prop-types',
  'immutable', 'immer',
  'husky', 'lint-staged', 'commitlint',
  'cross-spawn', 'execa', 'shelljs',
  'tar', 'archiver', 'adm-zip',
  'xml2js', 'csv-parse', 'papaparse',
  'socket.io-client', 'ws',
  'three', 'd3', 'chart.js', 'echarts',
  'swiper', 'slick-carousel',
  'animate.css', 'framer-motion', 'gsap',
  'i18next', 'react-i18next', 'vue-i18n',
  'storybook', '@storybook/react',
  'electron', 'electron-builder',
  'pm2', 'nodemon', 'concurrently',
];

/**
 * Well-known brand names that attackers commonly impersonate.
 */
export const BRAND_NAMES: string[] = [
  'google', 'facebook', 'meta', 'microsoft', 'amazon', 'aws',
  'apple', 'github', 'gitlab', 'npm', 'node', 'nodejs',
  'react', 'angular', 'vue', 'svelte', 'next', 'nuxt',
  'vercel', 'netlify', 'cloudflare', 'heroku', 'docker',
  'kubernetes', 'terraform', 'jenkins', 'circleci',
  'stripe', 'paypal', 'shopify', 'twilio', 'sendgrid',
  'mongodb', 'postgresql', 'mysql', 'redis', 'elastic',
  'firebase', 'supabase', 'prisma', 'hasura',
  'openai', 'anthropic', 'huggingface',
  'slack', 'discord', 'telegram', 'whatsapp',
  'sentry', 'datadog', 'newrelic', 'grafana',
  'babel', 'webpack', 'rollup', 'vite', 'esbuild',
  'typescript', 'eslint', 'prettier',
  'jest', 'vitest', 'cypress', 'playwright',
  'tailwind', 'bootstrap', 'material',
];
