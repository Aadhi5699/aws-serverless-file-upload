# AWS Serverless File Upload & Processing Platform

## Overview

This project demonstrates a scalable, event-driven serverless architecture on AWS. It allows users to securely upload files to S3 using pre-signed URLs, triggers Lambda functions for processing, and sends notifications upon completion.

User -> API Gateway -> Upload Lambda -> Pre-Signed URL -> S3 Upload Bucket -> S3 Event Notification -> Processor Lambda -> Processed Bucket -> SNS -> Email Notification

## Tech Stack

* AWS Lambda
* Amazon S3
* API Gateway
* SNS
* CloudWatch
* IAM

## Features

- Secure pre-signed uploads
- API Gateway integration
- Event-driven Lambda processing
- SNS email notifications
- CloudWatch alarms
- Least privilege IAM

## Architecture Diagram
![Architecture Diagram](architecture-diagram.png)

## Setup Guide