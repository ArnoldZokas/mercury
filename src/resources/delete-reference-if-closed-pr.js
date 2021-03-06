'use strict';

const errorTypes = require('../constants/error-types');

module.exports = ({ emitter, config }) => (repository, callback) => {
  if (repository.prInfo.found && !repository.prInfo.closed) {
    return callback(null, repository);
  }

  emitter.emit('action', { message: `Deleting outdated reference for ${repository.mercuryForkOwner}/${repository.repo}` });

  const github = require('../services/github')(config);
  const options = {
    owner: repository.mercuryForkOwner,
    repo: repository.repo,
    branch: config.github.branch
  };

  github.deleteReference(options, err => {
    if (err && err.message != 'Reference has already been manually deleted by the repo owners') {
      err = new Error('Failed while deleting outdated reference');
      emitter.emit('error', { error: err, errorType: errorTypes.failedToDeleteOutdatedBranch, details: repository });
      repository.skip = true;
    } else {
      err = null;
    }

    callback(err, repository);
  });
};
