'use strict';

const config        = require('config');
const errorTypes 	= require('../constants/error-types');
const github 		= require('../services/github');
const Logger 		= require('../services/logger-service');

const loggerService = Logger();

module.exports = (repository, callback) => {
    
	if(repository.prInfo.found){
		return callback(null, repository);
	}

	loggerService.info(`Resetting outdated branch for ${repository.mercuryForkOwner}/${repository.repo}`);

	const options = {
		owner: repository.mercuryForkOwner,
		repo: repository.repo,
        branch: config.github.branch
	};

	github.deleteReference(options, (err) => {
		if(err){
			err = new Error('Failed while deleting outdated branch');
			loggerService.error(err, errorTypes.failedToDeleteOutdatedBranch, repository);
			repository.skip = true;
		}
        
		callback(err, repository);
	});
};
