import {
  APIGatewayProxyEventV2,
  Context,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { S3 } from 'aws-sdk';

const s3 = new S3();
const bucketName = process.env.PHOTO_BUCKET_NAME!;

async function generateUrl(
  object: S3.Object
): Promise<{ filename: string; url: string }> {
  const url = await s3.getSignedUrlPromise('getObject', {
    Bucket: bucketName,
    Key: object.Key,
    Expires: 24 * 60 * 60,
  });
  return {
    filename: object.Key!,
    url,
  };
}

async function getPhotos(
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyStructuredResultV2> {
  console.log(`I've got the bucket name: ${bucketName}`);
  try {
    const { Contents: results } = await s3
      .listObjects({ Bucket: bucketName })
      .promise();
    const photos = await Promise.all(
      results!.map(result => generateUrl(result))
    );
    console.log('logging result');
    console.log(results);
    return {
      statusCode: 200,
      body: JSON.stringify(photos),
    };
  } catch (error) {
    console.error('Could not s3.listObjects', error);
    return {
      statusCode: 500,
      body: error.message,
    };
  }
  // return {
  //   statusCode: 200,
  //   body: 'Hello from lambda, it is alive!',
  // };
}

export { getPhotos };
