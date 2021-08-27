#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SimpleApp2Stack } from '../lib/simple-app2-stack';
import { SimpleAppStackDns } from '../lib/simple-app-stack-dns';

const domainNameApex = 'vadimstorozhuk.com';

const app = new cdk.App();

const {hostedZone, certificate} = new SimpleAppStackDns(app, 'SimpleAppStackDns', {
  dnsName: domainNameApex,
});

new SimpleApp2Stack(app, 'SimpleApp2Stack', {
  hostedZone,
  certificate,
  dnsName: domainNameApex
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// new SimpleApp2Stack(app, 'SimpleApp2Stack-dev', {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },
//   env: { region: 'us-east-1' },
//   envName: 'dev',

//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });

// new SimpleApp2Stack(app, 'SimpleApp2Stack-prod', {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },
//   env: { region: 'us-east-2' },
//   envName: 'prod',

//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });
