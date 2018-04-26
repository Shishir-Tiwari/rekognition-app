import { Injectable } from '@angular/core';
import * as AWS from 'aws-sdk';

@Injectable()
export class AppService {
  constructor() {
    this.anonLog();
  }

  anonLog() {
    // Configure the credentials provider to use your identity pool
    AWS.config.region = 'us-east-2'; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: 'us-east-2:71bd3c00-e780-43cc-ac49-e1ae9020dd18',
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
          resolve(data.SourceImageFace.Confidence);
        }
      });
    });
    return promise;
  }
}
