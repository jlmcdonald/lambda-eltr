let randomstring = require('randomstring'),
    expect = require('chai').expect,
    postrollTranscoderLambda = require('../bin/index');

describe('Create Postroll Transcoding Job', () => {
    let validRecord = {
        "eventVersion": "2.0",
        "eventTime": "1970-01-01T00:00:00.000Z",
        "requestParameters": {
            "sourceIPAddress": "127.0.0.1"
        },
        "s3": {
            "configurationId": "testConfigRule",
            "object": {
                "eTag": "0123456789abcdef0123456789abcdef",
                "sequencer": "0A1B2C3D4E5F678901",
                "key": "test-postroll.mp4",
                "size": 1024
            },
            "bucket": {
                "arn": "arn:aws:s3:::flynns.vidangel.com",
                "name": "flynns.vidangel.com",
                "ownerIdentity": {
                    "principalId": "EXAMPLE"
                }
            },
            "s3SchemaVersion": "1.0"
        },
        "responseElements": {
            "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
            "x-amz-request-id": "EXAMPLE123456789"
        },
        "awsRegion": "us-east-1",
        "eventName": "ObjectCreated:Put",
        "userIdentity": {
            "principalId": "EXAMPLE"
        },
        "eventSource": "aws:s3"
    };

    it('can create jobs', done => {
        let context = {
            succeed: result => {
                expect(result.created).to.be.true;
                done();
            },
            fail: result => {
                done(new Error(result.msg));
            }
        };

        postrollTranscoderLambda.setSuffix(`_${randomstring.generate(10)}`);
        postrollTranscoderLambda.handler({
            "Records": [validRecord]
        }, context);
    });

    it('excludes invalid buckets', done => {
        let context = {
                succeed: result => {
                    done(new Error('never context.succeed'));
                    console.info(result.event);
                },
                fail: result => {
                    expect(result.created).to.be.false;
                    done();
                }
            },
            badRecord = JSON.parse(JSON.stringify(validRecord));

        badRecord.s3.bucket.name = "mcp.vidangel.com";

        postrollTranscoderLambda.handler({
            "Records": [badRecord]
        }, context);
    });
});
