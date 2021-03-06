'use strict';

const _ = require('lodash');
const async = require('async');
const errorTypes = require('../constants/error-types');

const retryPolicy = {
  times: 5,
  interval: retryCount => 200 * retryCount
};

module.exports = ({ emitter, config }) => (repository, callback) => {
  emitter.emit('action', { message: `Committing new or updated files to ${repository.mercuryForkOwner}/${repository.repo}` });

  let commitCount = 0;
  const github = require('../services/github')(config);

  async.eachSeries(
    repository.translationFiles,
    (file, callback) => {
      async.eachOfSeries(
        file.locales,
        (locale, localeId, callback) => {
          const options = {
            owner: config.github.owner,
            repo: repository.repo,
            path: locale.githubPath,
            ref: config.github.branch,
            content: locale.smartlingContent,
            message: `Mercury commit for ${localeId} to file ${locale.githubPath}`
          };

          github.getFile(options, (err, file) => {
            if (err && err.code !== 404) {
              return callback(new Error(err.message));
            }

            const content = file.content;
            const sha = file.sha;

            _.set(options, 'branch', options.ref);
            _.unset(options, 'ref');

            if (!content) {
              emitter.emit('action', { message: `Creating new ${localeId} file ${locale.githubPath} on ${repository.mercuryForkOwner}/${repository.repo}` });
              commitCount++;
              async.retry(retryPolicy, github.createFile.bind(null, options), callback);
            } else if (content && content !== locale.smartlingContent) {
              emitter.emit('action', { message: `Updating existing ${localeId} file ${locale.githubPath} on ${repository.mercuryForkOwner}/${repository.repo}` });
              options.sha = sha;
              commitCount++;
              async.retry(retryPolicy, github.updateFile.bind(null, options), callback);
            } else {
              return callback();
            }
          });
        },
        callback
      );
    },
    err => {
      if (commitCount === 0) {
        repository.skipPullRequest = true;
      }

      if (err) {
        err = new Error(err.message);
        emitter.emit('error', { error: err, errorType: errorTypes.failedGithubCommit, details: repository });
        repository.skip = true;
      }

      callback(err, repository);
    }
  );
};
