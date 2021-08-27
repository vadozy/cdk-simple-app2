import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';
import { Runtime } from '@aws-cdk/aws-lambda';
import * as path from 'path';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { CorsHttpMethod, HttpMethod, HttpApi } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { Distribution } from '@aws-cdk/aws-cloudfront';
import { ARecord, IPublicHostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import { ICertificate } from '@aws-cdk/aws-certificatemanager';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { S3BucketWithDeploy } from './s3-bucket-with-deploy';

interface SimpleAppStackProps extends cdk.StackProps {
  envName?: string;
  hostedZone: IPublicHostedZone;
  certificate: ICertificate;
  dnsName: string;
}

export class SimpleApp2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: SimpleAppStackProps) {
    super(scope, id, props);

    // Photos bucket
    const { bucket } = new S3BucketWithDeploy(this, 'MySimpleAppCustomBucket', {
      deployTo: ['..', 'photos'],
      encryption: BucketEncryption.S3_MANAGED,
    });
    // ---

    // React app bucket

    const reactAppBucket = new Bucket(this, 'MyReactAppBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
    });

    // CloudFront for the s3 based react app

    const reactCloudFront = new Distribution(this, 'MyReactAppDistribution', {
      defaultBehavior: { origin: new S3Origin(reactAppBucket) },
      domainNames: [props.dnsName],
      certificate: props.certificate,
    });

    new ARecord(this, 'MySimpleAppARecordApex', {
      zone: props.hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(reactCloudFront)),
    });

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
