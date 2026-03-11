---
author: Nithissh
pubDatetime: 2025-01-08T11:22:00.000Z
title: "Reveal Hidden risks using Securityhub"
featured: false
draft: false
tags:
  - pwnedlabs
description: "Walkthrough of exploring AWS securityhub and a simulation activity to identify an issue that lead to some interesting findings"
---

## Scenario 

 

On your first day as a security analyst at Huge Logistics, you activate AWS Security Hub. The next day you are met with a detailed dashboard, revealing a myriad of potential risks within the AWS infrastructure. Use this service to identify risks and help improve their security posture!

  

## Things provided in the lab 

 

|     |     |
| --- | --- |
| IAM Url | [https://427648302155.signin.aws.amazon.com/console](https://427648302155.signin.aws.amazon.com/console) |
| Username | security-hub-user |
| Password | N0Crit1c4lPl3ase!! |

  

## How Securityhub works?

 

- It’s a centralized security management services 
- Where it collects the findings across the services like AWS guardduty, firewall manager, config and inspector
- Also integrates well with the third party provider like tenable, aquacloud and Wiz
- Provides a visual representation of security posture with charts, tables, and customizable insights.
- All findings are normalized using the AWS Security Finding Format (ASFF) for consistency.
- Centralize findings across accounts and regions using AWS Organizations.
- Use **EventBridge** to automate workflows, such as notifying teams or remediating issues.
- Security Hub must be enabled in each region where resources are deployed.
- Findings are retained for 90 days by default. Export important data for long-term analysis.

  

## Solution



Once after logging in with the IAM credentials provided from the lab objective through the AWS console where we access the `Securityhub`⁠ and here is how the securityhub dashboard looksalike where we can view the insights on our security findings in our account

  

![](/assets/images/pwnedlabs/securityhub.png)  

  

In the same page, we can also view the security findings in region wise as well and in our case, the findings are more off in the `us-east-1`⁠ region and if you take the realtime organization accounts where the application and application hosted instances and databases will be hosted across different regions 

  

![](/assets/images/pwnedlabs/securityhub-2.png)  

  

In the controls tab, basically how the controls works his where these are some predefined set of rules offered by AWS.. Kind of think like if you are open-source vulnerability scanners like nuclei where we will predefined community rules to scan 0-days.. like that these controls will check for different rules across different resources like EC2, S3 and alot more 

  

We can visualize the results in numbers or metrics way 

  

![](/assets/images/pwnedlabs/securityhub-3.png)  

  

In the security standards tab, we will have the finding based on the security standard that aws supports like:

- **CIS AWS Foundations Benchmark**: Basic security recommendations to secure your AWS account.
- **AWS Foundational Security Best Practices**: Advanced AWS-specific security checks to harden resources.
- **PCI DSS**: Ensures secure handling of payment card data to meet compliance.
- **ISO/IEC 27001:2013**: International standard for systematically managing sensitive information.
- **GDPR**: Protects the privacy of personal data for individuals in the EU.
- **NIST Cybersecurity Framework**: Guidelines to identify, protect, detect, respond to, and recover from cybersecurity risks.

  

![](/assets/images/pwnedlabs/securityhub-4.png)  

  

One another interesting tab is the insights part where **it** provides a powerful way to analyze and prioritize security findings by grouping them into meaningful categories

  

![](/assets/images/pwnedlabs/securityhub-5.png)   

  

## Understanding Findings 



Here we can look into few findings like the first one based on EBS 

  

![](/assets/images/pwnedlabs/securityhub-6.png)  

  

Here what they say his EBS snapshots are publicly available meaning anyone with an AWS account can easily take the EBS snapshot and mount it as volume and access the sensitive data in it.. 

  

One another finding is based on the following, This check looks at your **EC2 security group rules** to see if they allow **anyone on the internet** to connect to your server on **port 22**

  

where our igress controller set to `0.0.0.0/0`⁠ and `::/0` meaning anyone with the IPv4 or IPv6 address.. can able to access the SSH port 

  

![](/assets/images/pwnedlabs/securityhub-7.png)  

  

Through the controls tab, we can view one interesting finding which is based on the s3 bucket where both the buckets have public read access.. Through the filtering option in the left, you can check based on “Checks that are failed”

  

![](/assets/images/pwnedlabs/securityhub-8.png)   

  

One bucket with a concerning name where it hosts and have a contents related to `hugo-logistics.com` and another one is different and interesting at same time which is `huge-logistics-export-temp`⁠ where we have access to the particular bucket, looking into that we have some interesting stuffs one is our `flag.txt`  an actual flag to solve the flag and other one is `migration_accessKeys.csv`⁠ 

  

![](/assets/images/pwnedlabs/securityhub-9.png)   

  

From the CSV, we got these AWS access key and secret key and as csv filename concerns that these keys are used for the migration purposes 

  

|     |     |
| --- | --- |
| Access key  | Secret access key |
| AKIA************J5VS | 4n4y************************+7BB |

  

Once after setting up these credentials and as noted that these credentials are used for the migration purpose.. you can see that this credential belongs to user called `migration` 

  

```sh
nits@FWS-CHE-LT-8869 Downloads % aws configure --profile pwnedlabs-2
AWS Access Key ID [None]: AKIA************J5VS
AWS Secret Access Key [None]: 4n4y************************+7BB
Default region name [None]: us-east-1
Default output format [None]: 
nits@FWS-CHE-LT-8869 Downloads % aws sts get-caller-identity --profile pwnedlabs-2
{
    "UserId": "AIDAWHEOTHRFXKRWYIKAB",
    "Account": "427648302155",
    "Arn": "arn:aws:iam::427648302155:user/migration"
}
```

  

We can download the `flag.txt` file and this is content in that file `e8e98717c9bc450b625cb967d673f5ab` and submit it as solution and that solves the lab 

  

## Things I learned from this lab 



- Understanding the security hub dashboard 
- How to analyze the findings by standards and controls
- Filtering options are much feasible in terms of prioritizing the vulnerabilities and products 
- Visualization using insights tab 
