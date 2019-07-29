'use strict';

const BbPromise = require('bluebird');
const _ = require('lodash');

module.exports = {
  setDeploymentBucketName() {
    console.log("setDeploymentBucketName")
    // set a default name for the deployment bucket
    const service = this.serverless.service.service;
    const stage = this.options.stage;
    const timestamp = (+new Date());
    const name = `sls-${service}-${stage}-${timestamp}`;

    this.serverless.service.provider.deploymentBucketName = name;

    // console.log(this.serverless.service.provider.region)
    // process.exit()
    // check if there's already a deployment and update if available
    const params = {
      project: this.serverless.service.provider.project,
      deployment: `sls-${this.serverless.service.service}-${this.options.stage}`,
    };

    return this.provider.request('deploymentmanager', 'resources', 'list', params)
      .then((response) => {
        if (!_.isEmpty(response) && response.resources) {
          const regex = new RegExp(`sls-${service}-${stage}-.+`);
          console.log("sls-${service}-${stage}-.+")
          let deploymentBucket = response.resources
            .find(resource => (resource.type === 'storage.v1.bucket'
              && resource.name.match(regex) && resource.finalProperties.indexOf(this.serverless.service.provider.region) > -1));
          if (!deploymentBucket) {
            deploymentBucket = response.resources
              .find(resource => (resource.type === 'storage.v1.bucket'
                && resource.name.match(regex)));
          }
          this.serverless.service.provider.deploymentBucketName = deploymentBucket.name;
        }
      })
      .catch(() => BbPromise.resolve()); // if it cannot be found (e.g. on initial deployment)
  },
};