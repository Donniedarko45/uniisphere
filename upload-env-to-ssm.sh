#!/bin/bash

# Set your AWS region
AWS_REGION=" us-east-1"  # e.g., us-east-1

# Read from .env.production file and upload to SSM Parameter Store
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    if [[ $key == \#* ]] || [ -z "$key" ]; then
        continue
    fi
    
    # Remove any quotes from the value
    value=$(echo "$value" | tr -d '"' | tr -d "'")
    
    # Create the parameter name
    PARAM_NAME="/uniisphere/prod/$key"
    
    # Upload to SSM Parameter Store
    aws ssm put-parameter \
        --name "$PARAM_NAME" \
        --value "$value" \
        --type "SecureString" \
        --overwrite \
        --region "$AWS_REGION"
    
    echo "Uploaded $key to SSM Parameter Store"
done < .env.production 