import { Injectable } from '@angular/core';
import * as AWS from 'aws-sdk';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Injectable()
export class AppService {
  constructor(private http: HttpClient) {
    this.anonLog();
  }

  anonLog() {
    // Configure the credentials provider to use your identity pool
    AWS.config.region = 'us-east-2'; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: 'us-east-2:7c138827-bc77-4682-ab97-a78014179fb6',
    });

    // Make the call to obtain credentials
    (<AWS.CognitoIdentityCredentials>AWS.config.credentials).get(function () {
      // Credentials will be available when this function is called.
      const accessKeyId = AWS.config.credentials.accessKeyId;
      const secretAccessKey = AWS.config.credentials.secretAccessKey;
      const sessionToken = AWS.config.credentials.sessionToken;
    });
  }

  detectLabels(imageData) {
    // AWS.region = "us-east-2";
    const rekognition = new AWS.Rekognition();
    const params = {
      Image: {
        Bytes: imageData
      },
      MaxLabels: 5,
      MinConfidence: 80
    };
    const promise = new Promise((resolve, reject) => {
      rekognition.detectLabels(params, (err, data) => {
        if (err || data.Labels.length === 0) {
          reject(err); // an error occurred
        } else {
          resolve(data);
        }
      });
    });
    return promise;
  }

  compareImages(sourceImage, targetImage) {
    const rekognition = new AWS.Rekognition();

    const params = {
      SourceImage: { /* required */
        Bytes: sourceImage
      },
      TargetImage: { /* required */
        Bytes: targetImage
      },
      SimilarityThreshold: 0.0
    };
    const promise = new Promise((resolve, reject) => {
      rekognition.compareFaces(params, (err, data) => {
        if (err) {
          reject(err); // an error occurred
        } else {
          resolve(data.FaceMatches[0].Similarity);
        }
      });
    });
    return promise;
  }

  indexFaces(sourceImage) {
    const rekognition = new AWS.Rekognition();
    const params = {
      CollectionId: "ProfileCollection",
      Image: {
        Bytes: sourceImage
      }
    };
    // response['FaceRecords'][0]['Face']['FaceId']

    const promise = new Promise((resolve, reject) => {
      rekognition.indexFaces(params, (err, data) => {
        if (err) {
          reject(err); // an error occurred
        } else {
          resolve(data.FaceRecords[0].Face.FaceId);
        }
      });
    });
    return promise;
  }

  searchFacesByImage(sourceImage) {
    const rekognition = new AWS.Rekognition();
    const params = {
      CollectionId: "ProfileCollection",
      Image: {
        Bytes: sourceImage
      }
    };

    const promise = new Promise((resolve, reject) => {
      rekognition.searchFacesByImage(params, (err, data) => {
        if (err) {
          reject(err); // an error occurred
        } else {
          resolve({
            faceId: data.FaceMatches[0].Face.FaceId,
            confidence: data.FaceMatches[0].Face.Confidence
          });
        }
      });
    });
    return promise;
  }

  putItem(FaceId, email, firstName, lastName) {
    const dynamodb = new AWS.DynamoDB();
    const params = {
      TableName: 'profile_collection',
      Item: {
        RekognitionId: {
          S: FaceId
        },
        email: {
          S: email
        },
        firstName: {
          S: firstName
        },
        lastName: {
          S: lastName
        }
      }
    };
    const promise = new Promise((resolve, reject) => {
      dynamodb.putItem(params, (err, data) => {
        if (err) {
          reject(err); // an error occurred
        } else {
          resolve(data);
        }
      });
    });
    return promise;
  }

  //check the documentation
  getItem(faceId) {
    const dynamodb = new AWS.DynamoDB();
    const params = {
      TableName: 'profile_collection',
      Key: {
        RekognitionId: {
          S: faceId
        }
      }
    };
    const promise = new Promise((resolve, reject) => {
      dynamodb.getItem(params, (err, data) => {
        if (err) {
          reject(err); // an error occurred
        } else {
          if (data.Item) {
            resolve({
              email: data.Item.email.S,
              firstName: data.Item.firstName.S,
              lastName: data.Item.lastName.S
            });
          } else {
            resolve();
          }

        }
      });
    });
    return promise;
  }

  register(image) {
    debugger;
    return this.http.post(`https://05y3xpamki.execute-api.us-east-2.amazonaws.com/prod/mySample4`,
    JSON.stringify({
      image,
      email:'grace',
    }));
  }
}

/**
aws rekognition create-collection --collection-id ProfileCollection --region us-east-2 
aws dynamodb create-table --table-name ProfileCollection --attribute-definitions AttributeName=RekognitionId,AttributeType=S AttributeName=email,AttributeType=S --key-schema AttributeName=RekognitionId,KeyType=HASH AttributeName=email,KeyType=RANGE --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 --region us-east-2
aws s3 mb s3://profile-collection-bucket-name --region us-east-2

aws iam put-role-policy --role-name LambdaRekognitionRole1 --policy-name LambdaPermissions --policy-document file://access-policy.json
aws iam put-role-policy --role-name LambdaRekognitionRole1 --policy-name LambdaPermissions --policy-document file://access-policy.json
 */
