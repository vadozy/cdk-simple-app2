import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';
import { Runtime } from '@aws-cdk/aws-lambda';
import * as path from 'path';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { CorsHttpMethod, HttpMethod, HttpApi } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront';

export class SimpleApp2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Photos bucket

    const bucket = new Bucket(this, 'MySimpleAppBucket', {
      encryption: BucketEncryption.S3_MANAGED,
    });

    new BucketDeployment(this, 'MySimpleAppPhotos', {
      sources: [Source.asset(path.join(__dirname, '..', 'photos'))],
      destinationBucket: bucket,
    });
    // ---

    // React app bucket

    const reactAppBucket = new Bucket(this, 'MyReactAppBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
    });

    // CloudFront for the s3 based react app
    const reactCloudFront = new CloudFrontWebDistribution(
      this,
      'MyReactAppDistribution',
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: reactAppBucket,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );

    new BucketDeployment(this, 'MyReactAppDeploy', {
      sources: [Source.asset(path.join(__dirname, '..', 'frontend', 'build'))],
      destinationBucket: reactAppBucket,
      distribution: reactCloudFront, // so that cloudFront cleans its cache when redeploying
    });
    // ---

    const getPhotos = new lambda.NodejsFunction(this, 'MySimpleAppLambda', {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, '..', 'api', 'get-photos', 'index.ts'),
      handler: 'getPhotos',
      environment: {
        PHOTO_BUCKET_NAME: bucket.bucketName,
      },
    });

    const bucketContainerPermissions = new PolicyStatement();
    bucketContainerPermissions.addResources(bucket.bucketArn);
    bucketContainerPermissions.addActions('s3:ListBucket');

    const bucketPermissions = new PolicyStatement();
    bucketPermissions.addResources(`${bucket.bucketArn}/*`);
    bucketPermissions.addActions('s3:GetObject', 's3:PutObject');

    getPhotos.addToRolePolicy(bucketContainerPermissions);
    getPhotos.addToRolePolicy(bucketPermissions);

    // API Gateway
    const httpApi = new HttpApi(this, 'MySimpleAppHttpApi', {
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [CorsHttpMethod.GET],
      },
      apiName: 'photo-api',
      createDefaultStage: true,
    });

    const lambdaIntegration = new LambdaProxyIntegration({
      handler: getPhotos,
    });

    httpApi.addRoutes({
      path: '/getAllPhotos',
      methods: [HttpMethod.GET],
      integration: lambdaIntegration,
    });

    new cdk.CfnOutput(this, 'MySimpleAppBucketNameExport', {
      value: bucket.bucketName,
      exportName: 'MySimpleAppBucketName',
    });

    new cdk.CfnOutput(this, 'MyReactAppBucketNameExport', {
      value: reactAppBucket.bucketName,
      exportName: 'MyReactAppBucketName',
    });

    new cdk.CfnOutput(this, 'MySimpleAppApiExport', {
      value: httpApi.url!,
      exportName: 'MySimpleAppApi',
    });

    new cdk.CfnOutput(this, 'MyReactAppURLExport', {
      value: reactCloudFront.distributionDomainName,
      exportName: 'MyReactAppURL',
    });
  }
}
