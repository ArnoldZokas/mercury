'use strict';

const _         = require('lodash');
const expect 	= require('chai').expect;
const injectr	= require('injectr');
const sinon		= require('sinon');
const testData = require('./testData');

describe('resources.commitFiles()', () => {
    
    const mockedCommitFiles = (githubGetFileStub, githubCreateFileStub, githubUpdateFileStub) => injectr('../../src/resources/commit-files.js', {
        '../services/github': {
            getFile: githubGetFileStub,
            createFile: githubCreateFileStub,
            updateFile: githubUpdateFileStub
        }
    });
    
    const repository = testData.postGithubFetchRepository;
    let githubGetFileStub,
        githubCreateFileStub,
        githubUpdateFileStub;
    
    describe('happy path with file creation', () => {
    
        let err;
            
        beforeEach((done) => {
            githubGetFileStub = sinon.stub().yields({ message: 'Not found', code: 404 }, { content: null, sha: null });
            githubCreateFileStub = sinon.stub().yields();
            githubUpdateFileStub = sinon.stub().yields();
            
            const testRepo = _.cloneDeep(repository);
            testRepo.translationFiles = [
                {
                    locales: {
                        'de-DE': { 
                            smartlingContent: 'file content',
                            githubPath: 'src/locales/de-DE/file.json', 
                            githubContent: null,
                            isDifferent: true
                        }
                    }    
                }
            ];
            
            mockedCommitFiles(githubGetFileStub, githubCreateFileStub, githubUpdateFileStub)(testRepo, (error) => {
                err = error;
                done();
            });
        });

        it('should not error', () => {
            expect(err).to.be.null;
        });

        it('should call createFile once', () => {
            expect(githubCreateFileStub.called).to.be.true;
        });
        
        it('should never call updateFile', () => {
            expect(githubUpdateFileStub.called).to.be.false;
        });
    });
    
    describe('happy path with file update', () => {
    
        let err;
        
        beforeEach((done) => {
            githubGetFileStub = sinon.stub().yields(null, { content: 'file content', sha: 'test_sha' });
            githubCreateFileStub = sinon.stub().yields();
            githubUpdateFileStub = sinon.stub().yields();
            
            const testRepo = _.cloneDeep(repository);
            testRepo.translationFiles = [
                {
                    locales: {
                        'de-DE': { 
                            smartlingContent: 'translated file content',
                            githubPath: 'src/locales/de-DE/file.json', 
                            githubContent: 'file content',
                            isDifferent: true
                        }
                    }    
                }
            ];
            
            mockedCommitFiles(githubGetFileStub, githubCreateFileStub, githubUpdateFileStub)(testRepo, (error) => {
                err = error;
                done();
            });
        });

        it('should not error', () => {
            expect(err).to.be.null;
        });

        it('should never call createFile', () => {
            expect(githubCreateFileStub.called).to.be.false;
        });
        
        it('should call updateFile once', () => {
            expect(githubUpdateFileStub.called).to.be.true;
        });
    });
    
    describe('happy path with no action', () => {
    
        let err;
        
        beforeEach((done) => {
            githubGetFileStub = sinon.stub().yields(null, { content: 'translated file content', sha: 'test_sha' });
            githubCreateFileStub = sinon.stub().yields();
            githubUpdateFileStub = sinon.stub().yields();
            
            const testRepo = _.cloneDeep(repository);
            testRepo.translationFiles = [
                {
                    locales: {
                        'de-DE': { 
                            smartlingContent: 'translated file content',
                            githubPath: 'src/locales/de-DE/file.json', 
                            githubContent: 'translated file content',
                            isDifferent: false
                        }
                    }    
                }
            ];
            
            mockedCommitFiles(githubGetFileStub, githubCreateFileStub, githubUpdateFileStub)(testRepo, (error) => {
                err = error;
                done();
            });
        });
        
        it('should not error', () => {
            expect(err).to.be.null;
        });

        it('should never call createFile', () => {
            expect(githubCreateFileStub.called).to.be.false;
        });
        
        it('should never call updateFile', () => {
            expect(githubUpdateFileStub.called).to.be.false;
        });
        
        it('should never call getFile', () => {
            expect(githubGetFileStub.called).to.be.false;
        });
    });
    
    describe('error when getting file sha', () => {
    
        let err;
        
        beforeEach((done) => {
            githubGetFileStub = sinon.stub().yields({ message: 'Failed to get SHA', code: 422 }, { sha: null });
            githubCreateFileStub = sinon.stub().yields();
            githubUpdateFileStub = sinon.stub().yields();
            
            const testRepo = _.cloneDeep(repository);
            testRepo.translationFiles = [
                {
                    locales: {
                        'de-DE': { 
                            smartlingContent: 'translated file content',
                            githubPath: 'src/locales/de-DE/file.json', 
                            githubContent: 'file content',
                            isDifferent: true
                        }
                    }    
                }
            ];
            
            mockedCommitFiles(githubGetFileStub, githubCreateFileStub, githubUpdateFileStub)(testRepo, (error) => {
                err = error;
                done();
            });
        });

        it('should show an error', () => {
            expect(err.message).to.contain('Failed to get SHA');
        });
        
        it('should never call updateFile', () => {
            expect(githubUpdateFileStub.called).to.be.false;
        });
    });
    
    describe('error when creating file', () => {
    
        let err;
        
        beforeEach((done) => {
            githubGetFileStub = sinon.stub().yields({ message: 'Not found', code: 404 }, { content: null, sha: null });
            githubCreateFileStub = sinon.stub().yields({ message: 'Error when creating file', code: 500 });
            githubUpdateFileStub = sinon.stub().yields();
            
            const testRepo = _.cloneDeep(repository);
            testRepo.translationFiles = [
                {
                    locales: {
                        'de-DE': { 
                            smartlingContent: 'file content',
                            githubPath: 'src/locales/de-DE/file.json', 
                            githubContent: null,
                            isDifferent: true
                        }
                    }    
                }
            ];
            
            mockedCommitFiles(githubGetFileStub, githubCreateFileStub, githubUpdateFileStub)(testRepo, (error) => {
                err = error;
                done();
            });
        });

        it('should show an error', () => {
            expect(err.message).to.contain('Error when creating file');
        });
    });
    
    describe('error when updating file', () => {
    
        let err;
        
        beforeEach((done) => {
            githubGetFileStub = sinon.stub().yields({ message: 'Not found', code: 404 }, { content: null, sha: null });
            githubCreateFileStub = sinon.stub().yields({ message: 'Error when creating file', code: 500 });
            githubUpdateFileStub = sinon.stub().yields();
            
            const testRepo = _.cloneDeep(repository);
            testRepo.translationFiles = [
                {
                    locales: {
                        'de-DE': { 
                            smartlingContent: 'file content',
                            githubPath: 'src/locales/de-DE/file.json', 
                            githubContent: null,
                            isDifferent: true
                        }
                    }    
                }
            ];
            
            mockedCommitFiles(githubGetFileStub, githubCreateFileStub, githubUpdateFileStub)(testRepo, (error) => {
                err = error;
                done();
            });
        });
    
        it('should show an error', () => {
            expect(err.message).to.contain('Error when creating file');
        });
    });
});