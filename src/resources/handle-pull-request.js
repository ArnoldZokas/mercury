'use strict';

const errorTypes = require('../constants/error-types');
const metadataFormatter = require('../utils/format-pr-metadata');

module.exports = ({ emitter, config }) => (repository, callback) => {
  if (repository.skipPullRequest) {
    return callback(null, repository);
  }

  const github = require('../services/github')(config);
  const prAlreadyExists = repository.prInfo.found && !repository.prInfo.outdated;
  const action = prAlreadyExists ? 'Updating' : 'Creating';

  emitter.emit('action', { message: `${action} github pull request for ${repository.owner}/${repository.repo}` });

  const pullRequestMetadata = metadataFormatter.format(repository);

  const prOptions = {
    owner: repository.owner,
    repo: repository.repo,
    head: `${config.github.owner}:${config.github.branch}`,
    title: pullRequestMetadata.title,
    base: repository.manifestContent.workingBranch,
    body: pullRequestMetadata.body
  };

  let handlePr;

  if (prAlreadyExists) {
    prOptions.number = repository.prInfo.number;
    handlePr = github.updatePullRequest;
  } else {
    handlePr = github.createPullRequest;
  }

  handlePr(prOptions, err => {
    if (err) {
      err = new Error(`Failed while ${action.toLowerCase()} pull request`);
      emitter.emit('error', { error: err, errorType: errorTypes[`failed${action}PullRequest`], details: repository });
    }

    callback(err, repository);
  });
};
