import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as SimpleApp2 from '../lib/simple-app2-stack';

import '@aws-cdk/assert/jest'; // jest matchers

test('Simple App Stack: Complicated test', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new SimpleApp2.SimpleApp2Stack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {
          MySimpleAppBucket6B59014A: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                  {
                    ServerSideEncryptionByDefault: {
                      SSEAlgorithm: 'AES256',
                    },
                  },
                ],
              },
            },
            UpdateReplacePolicy: 'Retain',
            DeletionPolicy: 'Retain',
          },
        },
        Outputs: {
          MySimpleAppBucketNameExport: {
            Value: {
              Ref: 'MySimpleAppBucket6B59014A',
            },
            Export: {
              Name: 'MySimpleAppBucketName',
            },
          },
        },
      },
      MatchStyle.EXACT
    )
  );
});

test('Stack create a S3 Bucket resource', () => {
  // ARRANGE
  const app = new cdk.App();
  // ACT
  const stack = new SimpleApp2.SimpleApp2Stack(app, 'MyTestStack');
  // ASSERT
  expect(stack).toHaveResource('AWS::S3::Bucket');

  expect(stack).toHaveOutput({ exportName: 'MySimpleAppBucketName' });
});
